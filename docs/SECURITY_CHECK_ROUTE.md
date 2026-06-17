# MemoryShield AI - Security Check Route (Core Endpoint)

## POST /api/v1/security/check

The main endpoint. Every AI action passes through this.

### Request Schema

```python
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from uuid import UUID

class SecurityCheckRequest(BaseModel):
    """Request to check if action is safe"""

    agent_id: UUID = Field(..., description="Agent performing the action")

    request_type: str = Field(
        ...,
        description="Type of request",
        enum=["prompt", "tool_call", "data_access", "model_manipulation"]
    )

    content: str = Field(
        ...,
        min_length=1,
        max_length=100000,
        description="Raw prompt or action content"
    )

    context: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional context"
    )

    # Common context fields
    tool_name: Optional[str] = None
    tool_parameters: Optional[Dict] = None
    user_id: Optional[str] = None
    timestamp: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class SecurityCheckResponse(BaseModel):
    """Response from security check"""

    action: str = Field(..., enum=["ALLOW", "WARN", "BLOCK"])
    risk_score: float = Field(..., ge=0, le=100)
    confidence: float = Field(..., ge=0, le=1)

    # For ALLOW
    warnings: List[str] = []

    # For WARN/BLOCK
    reason: Optional[str] = None
    similar_incidents: List[Dict] = []
    policy_violations: List[Dict] = []
    detected_signals: List[str] = []

    # Always returned
    incident_id: Optional[str] = None
    threat_type: Optional[str] = None
    severity: Optional[str] = None
    threat_family: Optional[Dict] = None

    # Request metadata
    request_id: str
    timestamp: str
```

### Implementation

```python
# backend/app/routes/security.py

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4
from datetime import datetime

from app.schemas.security_check import SecurityCheckRequest, SecurityCheckResponse
from app.models import SecurityIncident, Agent
from app.engines.embedding_engine import EmbeddingEngine
from app.engines.policy_engine import PolicyEngine
from app.engines.similarity_engine import SimilarityEngine
from app.engines.risk_scorer import RiskScorer
from app.engines.threat_family_engine import ThreatFamilyEngine
from app.database.connection import get_db_session
from app.config import settings
from app.utils.auth import verify_api_key

router = APIRouter(tags=["Security"])


@router.post(
    "/security/check",
    response_model=SecurityCheckResponse,
    summary="Check if action is safe",
    description="Core security check - every AI action passes through this"
)
async def check_security(
    request_body: SecurityCheckRequest,
    request: Request,
    db: AsyncSession = Depends(get_db_session),
    api_key: str = Depends(verify_api_key)
):
    """
    Security check endpoint.

    Every action from an AI agent should pass through here:
    - Prompts
    - Tool calls
    - Data access
    - Model operations

    Response:
    - ALLOW: Safe, log and execute
    - WARN: Potentially risky, allow with alert
    - BLOCK: Dangerous, prevent execution
    """

    request_id = request.headers.get("X-Request-ID", str(uuid4()))

    try:
        # ====================================================================
        # 1. Verify agent exists and is active
        # ====================================================================
        agent = await db.execute(
            select(Agent).where(
                Agent.id == request_body.agent_id,
                Agent.is_active == True
            )
        )
        agent = agent.scalars().first()

        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        # ====================================================================
        # 2. Generate embedding for prompt
        # ====================================================================
        embedding_engine = EmbeddingEngine(
            api_key=settings.OPENAI_API_KEY,
            model=settings.OPENAI_EMBEDDING_MODEL
        )

        try:
            embedding = await embedding_engine.generate_embedding(
                request_body.content
            )
        except Exception as e:
            logger.error(f"Embedding generation failed: {str(e)}")
            embedding = None

        # ====================================================================
        # 3. Check policies
        # ====================================================================
        policy_engine = PolicyEngine(db)
        violations, has_violations = await policy_engine.check_policies(
            raw_prompt=request_body.content,
            org_id=str(agent.organization_id)
        )

        # Determine severity
        severity = "CRITICAL" if violations else "MEDIUM"
        if request_body.request_type == "data_access":
            severity = "HIGH"

        # ====================================================================
        # 4. Find similar incidents (if embedding available)
        # ====================================================================
        similar_incidents = []
        threat_type = request_body.request_type.upper()

        if embedding:
            similarity_engine = SimilarityEngine(db)
            similar_incidents = await similarity_engine.find_similar_incidents(
                embedding=embedding,
                org_id=str(agent.organization_id),
                limit=settings.TOP_K_SIMILAR_INCIDENTS,
                threshold=settings.SIMILARITY_THRESHOLD
            )

            # Infer threat type from similar incidents
            if similar_incidents:
                threat_type = similar_incidents[0].get("threat_type", threat_type)

        # ====================================================================
        # 5. Extract signals (patterns in prompt)
        # ====================================================================
        detected_signals = extract_signals(request_body.content)

        # ====================================================================
        # 6. Calculate risk score
        # ====================================================================
        risk_scorer = RiskScorer(settings)

        risk_score, action = risk_scorer.calculate_risk_score(
            policy_violations=violations,
            similarity_matches=similar_incidents,
            detected_signals=detected_signals,
            agent_history={
                "false_positive_rate": agent.false_positive_rate,
                "repeated_violations": 0  # TODO: calculate
            },
            severity=severity
        )

        # ====================================================================
        # 7. Link to threat family
        # ====================================================================
        threat_family_id = None
        threat_family = None

        if action in ["WARN", "BLOCK"]:
            threat_family_engine = ThreatFamilyEngine(db)
            threat_family_id = await threat_family_engine.get_or_create_family(
                org_id=str(agent.organization_id),
                threat_type=threat_type,
                incident_id=None
            )
            threat_family = await threat_family_engine.get_family_details(
                threat_family_id
            )

        # ====================================================================
        # 8. Create incident record (if WARN/BLOCK)
        # ====================================================================
        incident_id = None

        if action in ["WARN", "BLOCK"]:
            incident = SecurityIncident(
                id=uuid4(),
                organization_id=agent.organization_id,
                agent_id=agent.id,
                timestamp=datetime.utcnow(),
                threat_type=threat_type,
                severity=severity,
                raw_prompt=request_body.content,
                prompt_preview=request_body.content[:500],
                tool_call=request_body.context,
                tool_name=request_body.tool_name,
                tool_parameters=request_body.tool_parameters,
                detected_signals=detected_signals,
                policy_violations=[v.get("policy_id") for v in violations],
                response=f"Action {action}",
                outcome=action,
                action_taken=f"Request {action}",
                risk_score=risk_score,
                threat_family_id=threat_family_id,
                embedding=embedding,
                user_id=request_body.user_id,
                ip_address=request_body.ip_address or request.client.host,
                user_agent=request_body.user_agent,
                context=request_body.context or {},
                created_at=datetime.utcnow(),
                indexed_at=datetime.utcnow() if embedding else None
            )

            db.add(incident)
            await db.commit()
            await db.refresh(incident)

            incident_id = str(incident.id)

            # Update agent stats
            agent.total_incidents += 1
            if action == "BLOCK":
                agent.blocked_count += 1
            else:
                agent.warned_count += 1

            await db.commit()

        else:
            # ALLOW - just log
            agent.allowed_count += 1
            await db.commit()

        # ====================================================================
        # 9. Build response
        # ====================================================================
        response = SecurityCheckResponse(
            action=action,
            risk_score=risk_score,
            confidence=0.95 if violations else 0.85,
            warnings=[] if action == "ALLOW" else [
                f"Policy violation: {v.get('policy_name')}" for v in violations
            ],
            reason=build_reason(violations, similar_incidents, risk_score),
            similar_incidents=similar_incidents,
            policy_violations=violations,
            detected_signals=detected_signals,
            incident_id=incident_id,
            threat_type=threat_type,
            severity=severity,
            threat_family=threat_family,
            request_id=request_id,
            timestamp=datetime.utcnow().isoformat()
        )

        logger.info(
            f"Security check: {action} | "
            f"Risk: {risk_score} | "
            f"Agent: {agent.name} | "
            f"Request: {request_id}"
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Security check failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Security check failed")


def extract_signals(prompt: str) -> list:
    """Extract threat signals from prompt"""
    signals = []

    # Common injection patterns
    patterns = {
        "ignore previous": "Prompt injection attempt",
        "reveal prompt": "System prompt extraction",
        "system message": "System prompt extraction",
        "api key": "Credential extraction",
        "password": "Credential extraction",
        "delete database": "Dangerous command",
        "drop table": "Dangerous command",
    }

    prompt_lower = prompt.lower()

    for pattern, signal in patterns.items():
        if pattern in prompt_lower:
            signals.append(signal)

    return list(set(signals))  # Deduplicate


def build_reason(violations: list, similar: list, risk_score: float) -> str:
    """Build explanation for decision"""
    reasons = []

    if violations:
        policy_names = [v.get("policy_name") for v in violations]
        reasons.append(f"Violated policies: {', '.join(set(policy_names))}")

    if similar:
        best_match = similar[0]
        similarity = best_match.get("similarity_score", 0)
        reasons.append(
            f"High similarity ({similarity:.0%}) to previous "
            f"{best_match.get('threat_type')} on {best_match.get('timestamp')}"
        )

    if not reasons:
        reasons.append(f"Risk score {risk_score:.0f}/100 exceeds threshold")

    return " | ".join(reasons)
```

### Response Examples

#### ALLOW Response

```json
{
  "action": "ALLOW",
  "risk_score": 15,
  "confidence": 0.85,
  "warnings": [],
  "incident_id": null,
  "threat_type": "prompt",
  "severity": "MEDIUM",
  "threat_family": null,
  "request_id": "uuid",
  "timestamp": "2026-06-17T10:30:00Z"
}
```

#### WARN Response

```json
{
  "action": "WARN",
  "risk_score": 45,
  "confidence": 0.92,
  "warnings": [
    "Policy violation: NO_SYSTEM_PROMPT_DISCLOSURE"
  ],
  "reason": "Violated policies: NO_SYSTEM_PROMPT_DISCLOSURE | High similarity (94%) to previous Prompt Injection on 2026-06-12",
  "similar_incidents": [
    {
      "id": "uuid",
      "threat_type": "Prompt Injection",
      "severity": "CRITICAL",
      "outcome": "BLOCKED",
      "risk_score": 85,
      "timestamp": "2026-06-12T14:20:00Z",
      "similarity_score": 0.94
    }
  ],
  "policy_violations": [
    {
      "policy_id": "uuid",
      "policy_name": "NO_SYSTEM_PROMPT_DISCLOSURE",
      "severity": "CRITICAL",
      "matched_pattern": "reveal prompt"
    }
  ],
  "detected_signals": [
    "Prompt injection attempt",
    "System prompt extraction"
  ],
  "incident_id": "uuid",
  "threat_type": "Prompt Injection",
  "severity": "CRITICAL",
  "threat_family": {
    "id": "uuid",
    "name": "Prompt Injection",
    "incident_count": 47
  },
  "request_id": "uuid",
  "timestamp": "2026-06-17T10:30:00Z"
}
```

#### BLOCK Response

```json
{
  "action": "BLOCK",
  "risk_score": 85,
  "confidence": 0.96,
  "warnings": [
    "Policy violation: NO_SYSTEM_PROMPT_DISCLOSURE",
    "Policy violation: NO_CREDENTIAL_EXPOSURE"
  ],
  "reason": "Violated policies: NO_SYSTEM_PROMPT_DISCLOSURE, NO_CREDENTIAL_EXPOSURE | High similarity (96%) to previous Prompt Injection on 2026-06-12 | Risk score 85/100 exceeds threshold",
  "similar_incidents": [
    {
      "id": "uuid",
      "threat_type": "Prompt Injection",
      "severity": "CRITICAL",
      "outcome": "BLOCKED",
      "risk_score": 85,
      "timestamp": "2026-06-12T14:20:00Z",
      "similarity_score": 0.96
    }
  ],
  "policy_violations": [
    {
      "policy_id": "uuid",
      "policy_name": "NO_SYSTEM_PROMPT_DISCLOSURE",
      "severity": "CRITICAL",
      "matched_pattern": "reveal prompt"
    },
    {
      "policy_id": "uuid",
      "policy_name": "NO_CREDENTIAL_EXPOSURE",
      "severity": "CRITICAL",
      "matched_pattern": "api key"
    }
  ],
  "detected_signals": [
    "Prompt injection attempt",
    "System prompt extraction",
    "Credential extraction"
  ],
  "incident_id": "uuid",
  "threat_type": "Prompt Injection",
  "severity": "CRITICAL",
  "threat_family": {
    "id": "uuid",
    "name": "Prompt Injection",
    "attack_type": "Prompt Injection",
    "incident_count": 48,
    "shared_indicators": [
      "ignore previous",
      "reveal prompt"
    ]
  },
  "request_id": "uuid",
  "timestamp": "2026-06-17T10:30:00Z"
}
```

### Usage in Agent

```python
# Example: AI Agent using MemoryShield

import requests

MEMORYSHIELD_API = "http://localhost:8000/api/v1"
API_KEY = "sk_ms_..."

def safe_execute(prompt, agent_id):
    """Execute a prompt only if safe"""

    # Check with MemoryShield
    response = requests.post(
        f"{MEMORYSHIELD_API}/security/check",
        headers={"Authorization": f"Bearer {API_KEY}"},
        json={
            "agent_id": agent_id,
            "request_type": "prompt",
            "content": prompt,
            "context": {
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    )

    check = response.json()

    if check["action"] == "BLOCK":
        print(f"BLOCKED: {check['reason']}")
        print(f"Similar incident: {check['similar_incidents'][0]['id']}")
        return None

    if check["action"] == "WARN":
        print(f"WARNING: {check['reason']}")
        print(f"Risk: {check['risk_score']:.0f}/100")
        # Log warning but continue

    # Safe to execute
    return execute_prompt(prompt)
```

---

## Integration Patterns

### 1. Claude Agent
```python
from memoryshield import MemoryShieldClient

client = MemoryShieldClient(api_key=os.getenv("MEMORYSHIELD_API_KEY"))

def protected_tool_call(name, args):
    # Check tool call
    check = client.check_security(
        agent_id=AGENT_ID,
        request_type="tool_call",
        content=f"{name}({json.dumps(args)})"
    )

    if check.action == "BLOCK":
        raise Exception(f"Tool call blocked: {check.reason}")

    # Execute tool
    return call_tool(name, args)
```

### 2. OpenAI Function Calling
```python
from memoryshield import MemoryShieldClient

client = MemoryShieldClient()

def execute_function_call(function_name, function_args):
    # Security check
    check = client.check_security(
        agent_id=OPENAI_AGENT_ID,
        request_type="tool_call",
        content=json.dumps({
            "function": function_name,
            "args": function_args
        })
    )

    if check.action == "BLOCK":
        return {"error": f"Blocked: {check.reason}"}

    return functions[function_name](**function_args)
```

### 3. LangChain Integration
```python
from langchain.agents import tool
from memoryshield import MemoryShieldClient

client = MemoryShieldClient()

@tool
def protected_get_file(path: str):
    """Get file contents"""

    # Check data access
    check = client.check_security(
        agent_id=AGENT_ID,
        request_type="data_access",
        content=f"access: {path}"
    )

    if check.action == "BLOCK":
        raise Exception(check.reason)

    return read_file(path)
```
