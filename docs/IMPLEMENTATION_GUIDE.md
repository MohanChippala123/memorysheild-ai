# MemoryShield AI - Complete Implementation Guide

This guide covers everything needed to build and deploy MemoryShield AI from scratch.

---

## Phase 1: Foundation (Weeks 1-2)

### 1.1 Project Setup

```bash
# Create monorepo structure
mkdir memoryshield-ai
cd memoryshield-ai

# Create folders
mkdir backend frontend database docs scripts

# Initialize git
git init
git add .gitignore README.md

# Create environment files
cat > .env.example << 'EOF'
# Database
DATABASE_URL=postgresql://memoryshield:password@localhost:5432/memoryshield
DB_PASSWORD=secure_password

# OpenAI
OPENAI_API_KEY=sk-...

# Server
SECRET_KEY=dev-secret-key
DEBUG=true
HOST=0.0.0.0
PORT=8000

# Redis
REDIS_URL=redis://localhost:6379/0

# Frontend
VITE_API_URL=http://localhost:8000
EOF

cp .env.example .env
```

### 1.2 Database Setup

1. **Create PostgreSQL database**
```bash
createdb memoryshield
psql memoryshield < DATABASE_SCHEMA.sql
```

2. **Install pgvector extension**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
```

3. **Create indices**
```sql
CREATE INDEX idx_incident_embedding ON security_incidents 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

4. **Insert seed data**
```bash
python scripts/seed_demo_data.py
```

### 1.3 Backend Scaffold

```bash
cd backend

# Create structure
mkdir -p app/{models,schemas,routes,engines,services,utils,database}

# Create __init__.py files
touch app/__init__.py app/models/__init__.py app/schemas/__init__.py \
      app/routes/__init__.py app/engines/__init__.py app/services/__init__.py

# Create core files (use provided code from main.py, config.py, models.py)
cp ../backend_main.py app/main.py
cp ../backend_config.py app/config.py
cp ../backend_models.py app/models/base.py

# Create requirements.txt (use provided file)
cp ../requirements.txt .

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF
```

### 1.4 Frontend Scaffold

```bash
cd frontend

# Create with Vite
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install
npm install -D @types/react @types/react-dom tailwindcss postcss autoprefixer
npm install axios react-router-dom zustand @tanstack/react-query

# Setup Tailwind
npx tailwindcss init -p

# Create folder structure
mkdir -p src/{components,pages,hooks,services,types,styles,store}
mkdir -p src/components/{layout,dashboard,incidents,threats,agents,analyst,policies,shared}

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
EOF
```

### 1.5 Docker Compose

```bash
# Copy docker-compose.yml to root
cp ../docker-compose.yml .

# Start services
docker-compose up -d

# Verify
docker-compose ps
docker-compose logs backend
```

---

## Phase 2: Security Memory Core (Weeks 3-4)

### 2.1 Implement Policy Engine

**File:** `backend/app/engines/policy_engine.py`

```python
from sqlalchemy.ext.asyncio import AsyncSession
import re

class PolicyEngine:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def check_policies(self, prompt: str, org_id: str):
        # Load org's policies
        # Check prompt against each policy
        # Return violations
        pass
```

### 2.2 Implement Embedding Engine

**File:** `backend/app/engines/embedding_engine.py`

```python
import openai

class EmbeddingEngine:
    def __init__(self, api_key: str):
        self.api_key = api_key

    async def generate_embedding(self, text: str):
        response = openai.Embedding.create(
            input=text[:8000],
            model="text-embedding-3-small"
        )
        return response['data'][0]['embedding']
```

### 2.3 Implement Similarity Engine

**File:** `backend/app/engines/similarity_engine.py`

```python
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import UUID

class SimilarityEngine:
    async def find_similar_incidents(self, embedding, org_id):
        # Vector search: find cosine-similar incidents
        # Return top K matches with scores
        pass
```

**Key SQL Query:**
```sql
SELECT 
    id, threat_type, severity, outcome,
    (1 - cosine_distance(embedding, %s)) as similarity_score
FROM security_incidents
WHERE organization_id = %s
ORDER BY cosine_distance(embedding, %s)
LIMIT 5;
```

### 2.4 Implement Risk Scorer

**File:** `backend/app/engines/risk_scorer.py`

```python
class RiskScorer:
    def calculate_risk_score(self, violations, similar, signals, history):
        # Calculate component scores
        policy_risk = self._policy_risk(violations)
        similarity_risk = self._similarity_risk(similar)
        pattern_risk = self._pattern_risk(signals)
        history_risk = self._history_risk(history)
        
        # Sum and normalize
        total = policy_risk + similarity_risk + pattern_risk + history_risk
        return min(100, total)
```

### 2.5 Create Security Check Route

**File:** `backend/app/routes/security.py`

```python
from fastapi import APIRouter, Depends
from app.schemas.security_check import SecurityCheckRequest, SecurityCheckResponse
from app.engines import EmbeddingEngine, PolicyEngine, SimilarityEngine, RiskScorer

router = APIRouter()

@router.post("/security/check")
async def check_security(request: SecurityCheckRequest, db=Depends(get_db)):
    # 1. Generate embedding
    embedding = await embedding_engine.generate_embedding(request.content)
    
    # 2. Check policies
    violations = await policy_engine.check_policies(request.content, org_id)
    
    # 3. Find similar incidents
    similar = await similarity_engine.find_similar_incidents(embedding, org_id)
    
    # 4. Calculate risk
    risk_score = risk_scorer.calculate_risk_score(violations, similar)
    
    # 5. Store incident if needed
    if risk_score > 60:  # Block threshold
        incident = create_incident(...)
        await db.commit()
    
    return SecurityCheckResponse(...)
```

### 2.6 Create Incident Endpoints

**File:** `backend/app/routes/incidents.py`

```python
@router.get("/incidents")
async def list_incidents(org_id, skip=0, limit=50, db=Depends(get_db)):
    # List incidents with pagination and filters
    pass

@router.get("/incidents/{incident_id}")
async def get_incident(incident_id, db=Depends(get_db)):
    # Get single incident with full details
    pass

@router.post("/incidents/search")
async def search_incidents(query, org_id, db=Depends(get_db)):
    # Full-text search
    pass
```

### 2.7 Basic Frontend Pages

Create:
- `src/pages/Dashboard.tsx` - Overview
- `src/pages/SecurityVault.tsx` - Incident search
- `src/pages/IncidentExplorer.tsx` - Incident detail
- `src/components/layout/Layout.tsx` - Navigation

---

## Phase 3: Intelligence Layer (Weeks 5-6)

### 3.1 Threat Family Engine

**File:** `backend/app/engines/threat_family_engine.py`

```python
class ThreatFamilyEngine:
    async def get_or_create_family(self, org_id, threat_type):
        # Find existing family or create new one
        # Update with incident details
        pass

    async def link_incidents(self, incident_id, family_id):
        # Link incident to threat family
        pass

    async def get_family_details(self, family_id):
        # Return family with related incidents
        pass
```

### 3.2 AI Analyst Engine

**File:** `backend/app/engines/analyst_engine.py`

```python
class AnalystEngine:
    async def analyze_incident(self, incident):
        # Use GPT-4 to analyze incident
        # Return insights and recommendations
        pass

    async def query_memory(self, query):
        # Answer questions about security data
        # Cite supporting incidents
        pass
```

### 3.3 Metrics Service

**File:** `backend/app/services/metrics_service.py`

```python
class MetricsService:
    async def calculate_agent_metrics(self, agent_id, date_from, date_to):
        # Calculate detection rate, false positive rate, etc.
        pass

    async def calculate_trend(self, agent_id, days=30):
        # Calculate risk trend
        pass
```

### 3.4 AI Analyst Endpoint

**File:** `backend/app/routes/analyst.py`

```python
@router.post("/analyst/query")
async def analyst_query(query: str, org_id: str, db=Depends(get_db)):
    # Query security data
    engine = AnalystEngine()
    response = await engine.query_memory(query)
    return {"response": response, "confidence": 0.85}
```

### 3.5 Frontend Pages

Create:
- `src/pages/ThreatFamilies.tsx` - Threat family visualization
- `src/pages/AgentProfile.tsx` - Agent metrics
- `src/pages/SecurityAnalyst.tsx` - Chat interface
- `src/components/threats/ThreatGraph.tsx` - React Flow graph

### 3.6 Charts & Visualization

Install dependencies:
```bash
npm install recharts react-flow-renderer
```

Create components:
- `src/components/shared/LineChart.tsx` - Risk trends
- `src/components/shared/BarChart.tsx` - Threat distribution
- `src/components/shared/PieChart.tsx` - Incident breakdown

---

## Phase 4: Polish & Production (Week 7)

### 4.1 Testing

**Backend Tests:** `backend/tests/`

```python
# test_security_check.py
@pytest.mark.asyncio
async def test_security_check_blocks_injection():
    # Test that prompt injection is blocked
    pass

@pytest.mark.asyncio
async def test_similarity_detection():
    # Test that similar incidents are found
    pass

# test_risk_scorer.py
def test_risk_score_calculation():
    scorer = RiskScorer()
    score = scorer.calculate_risk_score(violations, similar, signals)
    assert score >= 0 and score <= 100
```

**Frontend Tests:** `frontend/src/__tests__/`

```typescript
// Dashboard.test.tsx
test('renders security score', () => {
    render(<Dashboard />);
    expect(screen.getByText(/Security Score/i)).toBeInTheDocument();
});

// IncidentTable.test.tsx
test('displays incidents', async () => {
    render(<IncidentTable incidents={mockIncidents} />);
    expect(screen.getByText('Prompt Injection')).toBeInTheDocument();
});
```

### 4.2 Performance Optimization

1. **Database**
   - Add indices (already in schema)
   - Enable query logging
   - Profile slow queries

2. **Backend**
   - Connection pooling
   - Cache similarities (Redis)
   - Batch embedding generation

3. **Frontend**
   - Code splitting
   - Image optimization
   - Lazy load routes

### 4.3 Documentation

Create:
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Full endpoint docs
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues
- User guide in `/docs/`

### 4.4 Security Hardening

1. **API Security**
   - Rate limiting: `slowapi`
   - CORS configuration
   - HTTPS enforcement
   - API key rotation

2. **Database**
   - Connection encryption
   - Row-level security (RLS)
   - Data masking for PII
   - Automatic backups

3. **Authentication**
   - JWT tokens
   - Refresh token rotation
   - Session timeout
   - MFA ready

### 4.5 Deployment

**Docker:**
```bash
# Build images
docker build -t memoryshield-backend ./backend
docker build -t memoryshield-frontend ./frontend

# Push to registry
docker tag memoryshield-backend:latest myregistry/memoryshield-backend:latest
docker push myregistry/memoryshield-backend:latest

# Deploy with docker-compose
docker-compose -f docker-compose.yml up -d
```

**Kubernetes (Optional):**
```bash
# Create secrets
kubectl create secret generic memoryshield-secrets \
  --from-literal=db-password=xxx \
  --from-literal=openai-key=xxx

# Apply manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

---

## Development Workflow

### Daily Development

```bash
# Start services
docker-compose up -d

# Watch backend logs
docker-compose logs -f backend

# Run backend tests
pytest backend/tests -v --watch

# Run frontend dev server
cd frontend && npm run dev

# Code changes auto-reload in both
```

### Git Workflow

```bash
# Feature branch
git checkout -b feature/new-feature

# Make changes
# Commit
git commit -m "Add new feature"

# Push and create PR
git push origin feature/new-feature
# Create PR on GitHub
```

### Before Pushing

```bash
# Format code
black backend/
prettier --write frontend/src/

# Run tests
pytest backend/tests
npm test

# Type check
mypy backend/app
tsc --noEmit frontend/
```

---

## Troubleshooting

### Database Issues

```bash
# Connect to postgres
docker exec -it memoryshield-postgres psql -U memoryshield -d memoryshield

# Check vector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

# Rebuild indices
REINDEX INDEX idx_incident_embedding;
```

### Backend Issues

```bash
# Check logs
docker-compose logs backend

# Restart backend
docker-compose restart backend

# Run migrations
docker exec memoryshield-backend alembic upgrade head
```

### Frontend Issues

```bash
# Clear cache
rm -rf frontend/node_modules frontend/.next
npm install

# Restart dev server
npm run dev
```

---

## Performance Tuning

### PostgreSQL

```sql
-- Increase shared_buffers
ALTER SYSTEM SET shared_buffers = '256MB';

-- Increase work_mem
ALTER SYSTEM SET work_mem = '8MB';

-- Reload config
SELECT pg_reload_conf();
```

### Redis

```bash
# Monitor keys
redis-cli MONITOR

# Clear cache
redis-cli FLUSHDB
```

### API Rate Limiting

```python
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/security/check")
@limiter.limit("100/minute")
async def check_security(...):
    pass
```

---

## Monitoring & Alerting

### Prometheus Metrics

```python
from prometheus_client import Counter, Histogram

incident_counter = Counter('incidents_total', 'Total incidents')
check_duration = Histogram('check_duration_seconds', 'Check duration')

@router.post("/security/check")
async def check_security(...):
    with check_duration.time():
        # ... logic ...
        incident_counter.inc()
```

### ELK Stack (Optional)

```yaml
# logs stored in Elasticsearch
# Visualized in Kibana
# Monitored with Alerting
```

---

## Next Steps After MVP

1. **Integration SDK** - Python/Node.js SDKs
2. **Hosted SaaS** - Managed cloud service
3. **Advanced ML** - Custom threat models
4. **Automation** - Automated response playbooks
5. **Integration Marketplace** - Third-party tools
6. **Mobile App** - iOS/Android monitoring

---

## Key Resources

- FastAPI docs: https://fastapi.tiangolo.com
- SQLAlchemy: https://docs.sqlalchemy.org
- pgvector: https://github.com/pgvector/pgvector
- React: https://react.dev
- Tailwind: https://tailwindcss.com

---

## Support

- **Questions:** Check MEMORYSHIELD_ARCHITECTURE.md
- **Issues:** File GitHub issue with logs
- **Contributions:** See CONTRIBUTING.md

Good luck building MemoryShield!
