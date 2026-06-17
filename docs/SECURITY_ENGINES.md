# MemoryShield AI - Core Security Engines

## 1. Similarity Engine (similarity_engine.py)

### Purpose
Find similar historical incidents using vector embeddings and cosine similarity.

### Implementation

```python
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pgvector.sqlalchemy import Vector
import numpy as np
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)


class SimilarityEngine:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def find_similar_incidents(
        self,
        embedding: Vector,
        org_id: str,
        limit: int = 5,
        threshold: float = 0.85,
        days_lookback: int = 90
    ) -> List[Dict]:
        """
        Find incidents similar to the given embedding.

        Args:
            embedding: Vector embedding of current request
            org_id: Organization ID
            limit: Max results to return
            threshold: Minimum similarity score (0-1)
            days_lookback: Only search last N days

        Returns:
            List of similar incidents with scores
        """
        try:
            from app.models import SecurityIncident
            from datetime import datetime, timedelta

            # Query similar incidents using vector distance
            cutoff_date = datetime.utcnow() - timedelta(days=days_lookback)

            # Use cosine distance: 1 - (cosine similarity)
            # So we order by distance ascending
            query = select(
                SecurityIncident.id,
                SecurityIncident.threat_type,
                SecurityIncident.severity,
                SecurityIncident.outcome,
                SecurityIncident.risk_score,
                SecurityIncident.timestamp,
                # Calculate similarity score (1 - distance)
                (1 - func.cosine_distance(
                    SecurityIncident.embedding,
                    embedding
                )).label("similarity_score")
            ).where(
                SecurityIncident.organization_id == org_id,
                SecurityIncident.timestamp > cutoff_date
            ).order_by(
                func.cosine_distance(SecurityIncident.embedding, embedding)
            ).limit(limit)

            result = await self.db.execute(query)
            rows = result.fetchall()

            similar_incidents = []
            for row in rows:
                similarity = float(row.similarity_score)

                # Only include if above threshold
                if similarity >= threshold:
                    similar_incidents.append({
                        "id": str(row.id),
                        "threat_type": row.threat_type,
                        "severity": row.severity,
                        "outcome": row.outcome,
                        "risk_score": row.risk_score,
                        "timestamp": row.timestamp.isoformat(),
                        "similarity_score": round(similarity, 3)
                    })

            logger.info(
                f"Found {len(similar_incidents)} similar incidents "
                f"(threshold={threshold})"
            )

            return similar_incidents

        except Exception as e:
            logger.error(f"Error finding similar incidents: {str(e)}")
            return []

    async def get_similar_by_threat_family(
        self,
        threat_family_id: str,
        org_id: str,
        limit: int = 10
    ) -> List[Dict]:
        """
        Get all incidents in a threat family.
        """
        from app.models import SecurityIncident

        query = select(SecurityIncident).where(
            SecurityIncident.organization_id == org_id,
            SecurityIncident.threat_family_id == threat_family_id
        ).order_by(SecurityIncident.timestamp.desc()).limit(limit)

        result = await self.db.execute(query)
        incidents = result.scalars().all()

        return [self._incident_to_dict(inc) for inc in incidents]

    def _incident_to_dict(self, incident) -> Dict:
        """Convert incident to dictionary"""
        return {
            "id": str(incident.id),
            "threat_type": incident.threat_type,
            "severity": incident.severity,
            "outcome": incident.outcome,
            "risk_score": incident.risk_score,
            "timestamp": incident.timestamp.isoformat(),
        }
```

---

## 2. Risk Scorer (risk_scorer.py)

### Purpose
Calculate total risk score based on multiple factors.

### Implementation

```python
from typing import Dict, List, Tuple
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class ThreatSeverity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class RiskScorer:
    """Calculate risk scores for security incidents"""

    # Risk score weights
    POLICY_VIOLATION_WEIGHT = 0.40  # 40 points max
    SIMILARITY_WEIGHT = 0.30        # 30 points max
    PATTERN_WEIGHT = 0.20           # 20 points max
    HISTORY_WEIGHT = 0.10           # 10 points max

    SEVERITY_SCORES = {
        ThreatSeverity.CRITICAL: 100,
        ThreatSeverity.HIGH: 75,
        ThreatSeverity.MEDIUM: 50,
        ThreatSeverity.LOW: 25,
    }

    COMMON_DANGEROUS_PATTERNS = {
        # Prompt injection indicators
        "ignore previous": 8,
        "ignore all previous": 10,
        "reveal prompt": 12,
        "show system prompt": 12,
        "system message": 10,
        "disregard": 9,
        "forget": 7,
        "override": 8,

        # Credential indicators
        "credentials": 15,
        "api key": 18,
        "api_key": 18,
        "password": 20,
        "secret": 15,
        "token": 12,
        "auth": 10,

        # Data exfiltration
        "download all": 12,
        "export database": 14,
        "retrieve all": 12,
        "sensitive data": 10,
        "pii": 15,
        "confidential": 10,

        # Dangerous operations
        "delete database": 20,
        "drop table": 18,
        "truncate": 16,
        "destroy": 15,
        "erase": 14,
    }

    def __init__(self, config=None):
        self.config = config

    def calculate_risk_score(
        self,
        policy_violations: List[Dict],
        similarity_matches: List[Dict],
        detected_signals: List[str],
        agent_history: Dict = None,
        severity: str = "MEDIUM"
    ) -> Tuple[float, str]:
        """
        Calculate total risk score (0-100).

        Returns:
            (risk_score, action) where action is ALLOW/WARN/BLOCK
        """
        score = 0

        # 1. Policy violation risk (0-40)
        policy_risk = self._calculate_policy_risk(policy_violations, severity)
        score += policy_risk

        # 2. Similarity risk (0-30)
        similarity_risk = self._calculate_similarity_risk(similarity_matches)
        score += similarity_risk

        # 3. Pattern risk (0-20)
        pattern_risk = self._calculate_pattern_risk(detected_signals)
        score += pattern_risk

        # 4. Agent history risk (0-10)
        history_risk = self._calculate_history_risk(agent_history or {})
        score += history_risk

        # Normalize to 0-100
        score = min(100, max(0, score))

        # Determine action
        action = self._determine_action(score)

        logger.info(
            f"Risk Score: {score:.1f} | "
            f"Policy: {policy_risk:.1f} | "
            f"Similarity: {similarity_risk:.1f} | "
            f"Pattern: {pattern_risk:.1f} | "
            f"History: {history_risk:.1f} | "
            f"Action: {action}"
        )

        return round(score, 1), action

    def _calculate_policy_risk(
        self,
        violations: List[Dict],
        severity: str
    ) -> float:
        """Policy violation risk (0-40)"""
        if not violations:
            return 0

        # Base score by severity
        base = self.SEVERITY_SCORES.get(severity, 50)

        # Scale to 0-40 range
        max_severity_score = self.SEVERITY_SCORES[ThreatSeverity.CRITICAL]
        policy_risk = (base / max_severity_score) * self.POLICY_VIOLATION_WEIGHT * 100

        return min(40, policy_risk)

    def _calculate_similarity_risk(
        self,
        matches: List[Dict]
    ) -> float:
        """Similarity risk (0-30)"""
        if not matches:
            return 0

        best_match = matches[0]
        similarity = float(best_match.get("similarity_score", 0))

        # Base similarity score
        score = similarity * self.SIMILARITY_WEIGHT * 100

        # Multiply if previous was CRITICAL
        if best_match.get("severity") == "CRITICAL":
            score *= 1.3

        # Multiply if previous was BLOCKED
        if best_match.get("outcome") == "BLOCKED":
            score *= 1.2

        # Multiply if recent
        from datetime import datetime, timedelta
        timestamp = datetime.fromisoformat(best_match.get("timestamp", ""))
        if datetime.utcnow() - timestamp < timedelta(days=7):
            score *= 1.1

        return min(30, score)

    def _calculate_pattern_risk(
        self,
        signals: List[str]
    ) -> float:
        """Pattern risk (0-20)"""
        if not signals:
            return 0

        pattern_score = 0
        for signal in signals:
            signal_lower = signal.lower()

            for pattern, weight in self.COMMON_DANGEROUS_PATTERNS.items():
                if pattern in signal_lower:
                    pattern_score += weight
                    break

        # Normalize to 0-20
        return min(20, pattern_score)

    def _calculate_history_risk(
        self,
        history: Dict
    ) -> float:
        """Agent history risk (0-10)"""
        if not history:
            return 0

        # Base on false positive rate
        false_positive_rate = history.get("false_positive_rate", 0)
        base = false_positive_rate * self.HISTORY_WEIGHT * 100

        # Bonus if repeated violations
        repeated = history.get("repeated_violations", 0)
        if repeated > 3:
            base += 5

        return min(10, base)

    def _determine_action(self, score: float) -> str:
        """Determine action based on risk score"""
        if score >= 61:
            return "BLOCK"
        elif score >= 26:
            return "WARN"
        else:
            return "ALLOW"
```

---

## 3. Policy Engine (policy_engine.py)

### Purpose
Check requests against security policies.

### Implementation

```python
from typing import List, Dict, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import re
import logging

logger = logging.getLogger(__name__)


class PolicyEngine:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def check_policies(
        self,
        raw_prompt: str,
        org_id: str,
        policies: List[Dict] = None
    ) -> Tuple[List[Dict], float]:
        """
        Check prompt against security policies.

        Returns:
            (violations, risk_score)
            where violations is list of matched policies
        """
        violations = []

        if not policies:
            policies = await self._get_enabled_policies(org_id)

        for policy in policies:
            matched = self._check_policy(raw_prompt, policy)
            if matched:
                violations.append({
                    "policy_id": policy.get("id"),
                    "policy_name": policy.get("name"),
                    "severity": policy.get("severity"),
                    "matched_pattern": matched.get("pattern"),
                    "confidence": matched.get("confidence", 0.95)
                })

        logger.info(f"Policy check found {len(violations)} violations")

        return violations, len(violations) > 0

    def _check_policy(self, prompt: str, policy: Dict) -> Dict or None:
        """Check if prompt violates policy"""
        rules = policy.get("rules", {})
        prompt_lower = prompt.lower()

        # Check patterns (regex)
        patterns = rules.get("patterns", [])
        for pattern in patterns:
            try:
                if re.search(pattern, prompt_lower, re.IGNORECASE):
                    return {
                        "pattern": pattern,
                        "confidence": 0.95,
                        "type": "regex"
                    }
            except re.error:
                logger.warning(f"Invalid regex pattern: {pattern}")

        # Check keywords
        keywords = rules.get("keywords", [])
        for keyword in keywords:
            if keyword.lower() in prompt_lower:
                return {
                    "pattern": keyword,
                    "confidence": 0.90,
                    "type": "keyword"
                }

        return None

    async def _get_enabled_policies(self, org_id: str) -> List[Dict]:
        """Get all enabled policies for organization"""
        from app.models import SecurityPolicy

        query = select(SecurityPolicy).where(
            SecurityPolicy.organization_id == org_id,
            SecurityPolicy.enabled == True
        )

        result = await self.db.execute(query)
        policies = result.scalars().all()

        return [
            {
                "id": str(p.id),
                "name": p.name,
                "severity": p.severity,
                "action": p.action,
                "rules": p.rules
            }
            for p in policies
        ]
```

---

## 4. Embedding Engine (embedding_engine.py)

### Purpose
Generate vector embeddings for prompts and incidents.

### Implementation

```python
import openai
from typing import List
import logging

logger = logging.getLogger(__name__)


class EmbeddingEngine:
    def __init__(self, api_key: str, model: str = "text-embedding-3-small"):
        self.api_key = api_key
        self.model = model
        openai.api_key = api_key

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for text using OpenAI.

        Args:
            text: Text to embed

        Returns:
            1536-dimensional vector
        """
        try:
            # Truncate to 8000 tokens
            max_chars = 8000 * 4  # ~4 chars per token
            text_truncated = text[:max_chars]

            response = openai.Embedding.create(
                input=text_truncated,
                model=self.model
            )

            embedding = response['data'][0]['embedding']
            logger.info(f"Generated embedding (dims: {len(embedding)})")

            return embedding

        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            raise

    async def batch_embed(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        embeddings = []
        for text in texts:
            embedding = await self.generate_embedding(text)
            embeddings.append(embedding)
        return embeddings
```

---

## 5. Threat Family Engine (threat_family_engine.py)

### Purpose
Cluster and manage threat families.

### Implementation

```python
from typing import Dict, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import logging

logger = logging.getLogger(__name__)


class ThreatFamilyEngine:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def get_or_create_family(
        self,
        org_id: str,
        threat_type: str,
        incident_id: str = None
    ) -> str:
        """
        Get or create threat family for threat type.

        Returns:
            threat_family_id
        """
        from app.models import ThreatFamily
        from datetime import datetime

        # Check if family exists
        query = select(ThreatFamily).where(
            ThreatFamily.organization_id == org_id,
            ThreatFamily.attack_type == threat_type,
            ThreatFamily.name == threat_type
        )

        result = await self.db.execute(query)
        family = result.scalars().first()

        if family:
            # Update last seen
            family.last_seen = datetime.utcnow()
            await self.db.commit()
            return str(family.id)

        # Create new family
        import uuid
        family = ThreatFamily(
            id=uuid.uuid4(),
            organization_id=org_id,
            name=threat_type,
            attack_type=threat_type,
            severity="MEDIUM",
            first_seen=datetime.utcnow(),
            last_seen=datetime.utcnow()
        )

        self.db.add(family)
        await self.db.commit()

        logger.info(f"Created threat family: {threat_type}")

        return str(family.id)

    async def get_family_details(self, family_id: str) -> Dict:
        """Get threat family details with incidents"""
        from app.models import ThreatFamily

        query = select(ThreatFamily).where(ThreatFamily.id == family_id)
        result = await self.db.execute(query)
        family = result.scalars().first()

        if not family:
            return None

        return {
            "id": str(family.id),
            "name": family.name,
            "attack_type": family.attack_type,
            "severity": family.severity,
            "incident_count": family.incident_count,
            "shared_indicators": family.shared_indicators,
            "first_seen": family.first_seen.isoformat() if family.first_seen else None,
            "last_seen": family.last_seen.isoformat() if family.last_seen else None
        }
```

---

## 6. AI Analyst Engine (analyst_engine.py)

### Purpose
Provide AI-powered security incident analysis.

### Implementation

```python
from typing import Dict
import openai
import logging

logger = logging.getLogger(__name__)


class AnalystEngine:
    def __init__(self, api_key: str):
        self.api_key = api_key
        openai.api_key = api_key

    async def analyze_incident(
        self,
        incident: Dict
    ) -> Dict:
        """
        Analyze incident and provide insights.

        Returns:
            {
                "summary": str,
                "threat_level": str,
                "recommendations": [str],
                "confidence": float
            }
        """
        try:
            prompt = f"""
Analyze this security incident and provide insights:

Threat Type: {incident.get('threat_type')}
Severity: {incident.get('severity')}
Risk Score: {incident.get('risk_score')}
Raw Prompt: {incident.get('raw_prompt')[:500]}
Detected Signals: {', '.join(incident.get('detected_signals', []))}
Similar Incidents: {incident.get('similar_incidents_count', 0)}

Provide:
1. What happened (1-2 sentences)
2. Why it's concerning (1-2 sentences)
3. Top 3 recommendations
            """

            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a security analyst."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=300
            )

            analysis = response.choices[0].message.content

            logger.info("Generated incident analysis")

            return {
                "analysis": analysis,
                "confidence": 0.85
            }

        except Exception as e:
            logger.error(f"Error analyzing incident: {str(e)}")
            return {
                "analysis": "Error generating analysis",
                "confidence": 0.0
            }

    async def analyze_threat_family(
        self,
        family: Dict,
        incidents: List[Dict]
    ) -> Dict:
        """Analyze threat family and trend"""
        # Similar implementation for family analysis
        pass
```

---

## Engine Integration

All engines are used together in the security check flow:

```
1. Incoming Request
   ↓
2. Extract content & generate embedding (EmbeddingEngine)
   ↓
3. Check policies (PolicyEngine)
   ↓
4. Find similar incidents (SimilarityEngine)
   ↓
5. Calculate risk score (RiskScorer)
   ↓
6. Link to threat family (ThreatFamilyEngine)
   ↓
7. Allow/Warn/Block decision
   ↓
8. If blocked: Generate analysis (AnalystEngine)
```
