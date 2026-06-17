# MemoryShield AI - Complete Project Structure

```
memoryshield-ai/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app entry point
│   │   ├── config.py                  # Configuration
│   │   ├── dependencies.py             # DI container
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── agents.py              # Agent model
│   │   │   ├── incidents.py           # Incident model
│   │   │   ├── threats.py             # Threat family model
│   │   │   ├── policies.py            # Policy model
│   │   │   ├── metrics.py             # Metrics model
│   │   │   └── audit.py               # Audit log model
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── agent.py               # Agent schemas
│   │   │   ├── incident.py            # Incident schemas
│   │   │   ├── threat.py              # Threat family schemas
│   │   │   ├── policy.py              # Policy schemas
│   │   │   ├── security_check.py      # Security check request/response
│   │   │   └── analyst.py             # Analyst schemas
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── security.py            # POST /api/v1/security/check
│   │   │   ├── incidents.py           # Incident CRUD endpoints
│   │   │   ├── threat_families.py     # Threat family endpoints
│   │   │   ├── agents.py              # Agent endpoints
│   │   │   ├── policies.py            # Policy management
│   │   │   ├── metrics.py             # Metrics endpoints
│   │   │   ├── analyst.py             # AI analyst endpoints
│   │   │   └── health.py              # Health check
│   │   ├── engines/
│   │   │   ├── __init__.py
│   │   │   ├── policy_engine.py       # Policy checking
│   │   │   ├── similarity_engine.py   # Vector search
│   │   │   ├── risk_scorer.py         # Risk calculation
│   │   │   ├── threat_family_engine.py # Family clustering
│   │   │   ├── embedding_engine.py    # Embedding generation
│   │   │   └── analyst_engine.py      # AI analysis
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── incident_service.py    # Incident business logic
│   │   │   ├── agent_service.py       # Agent business logic
│   │   │   ├── threat_service.py      # Threat family logic
│   │   │   ├── policy_service.py      # Policy logic
│   │   │   ├── metrics_service.py     # Metrics calculation
│   │   │   └── audit_service.py       # Audit logging
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                # JWT authentication
│   │   │   ├── validators.py          # Input validation
│   │   │   ├── constants.py           # Constants (severity, types, etc)
│   │   │   └── logger.py              # Structured logging
│   │   └── database/
│   │       ├── __init__.py
│   │       ├── connection.py          # DB connection pool
│   │       ├── base.py                # Base model
│   │       └── migrations/            # Alembic migrations
│   │           ├── env.py
│   │           ├── script.py.mako
│   │           └── versions/
│   │               ├── 001_initial_schema.py
│   │               ├── 002_add_embeddings.py
│   │               └── ...
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   ├── test_security_check.py
│   │   ├── test_similarity_engine.py
│   │   ├── test_risk_scorer.py
│   │   ├── test_policy_engine.py
│   │   └── ...
│   ├── requirements.txt               # Python dependencies
│   ├── Dockerfile                     # Backend container
│   └── .env.example                   # Environment template
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx                   # React entry
│   │   ├── App.tsx                    # Root component
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   ├── incidents.ts
│   │   │   ├── threats.ts
│   │   │   ├── policies.ts
│   │   │   ├── agents.ts
│   │   │   └── api.ts
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── TopBar.tsx
│   │   │   │   └── Layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── SecurityScore.tsx
│   │   │   │   ├── MetricsGrid.tsx
│   │   │   │   ├── ThreatChart.tsx
│   │   │   │   ├── RecentIncidents.tsx
│   │   │   │   └── AgentHealth.tsx
│   │   │   ├── incidents/
│   │   │   │   ├── IncidentExplorer.tsx
│   │   │   │   ├── IncidentTable.tsx
│   │   │   │   ├── IncidentDetail.tsx
│   │   │   │   ├── IncidentSearch.tsx
│   │   │   │   └── SimilarIncidents.tsx
│   │   │   ├── threats/
│   │   │   │   ├── ThreatFamilies.tsx
│   │   │   │   ├── FamilyGraph.tsx
│   │   │   │   └── FamilyDetail.tsx
│   │   │   ├── agents/
│   │   │   │   ├── AgentProfile.tsx
│   │   │   │   ├── AgentMetrics.tsx
│   │   │   │   └── AgentList.tsx
│   │   │   ├── analyst/
│   │   │   │   ├── SecurityAnalyst.tsx
│   │   │   │   ├── ChatInterface.tsx
│   │   │   │   └── IncidentCard.tsx
│   │   │   ├── policies/
│   │   │   │   ├── PolicyManagement.tsx
│   │   │   │   ├── PolicyList.tsx
│   │   │   │   ├── PolicyEditor.tsx
│   │   │   │   └── RuleBuilder.tsx
│   │   │   └── shared/
│   │   │       ├── Badge.tsx
│   │   │       ├── SeverityIndicator.tsx
│   │   │       ├── LoadingSpinner.tsx
│   │   │       └── ErrorBoundary.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── SecurityVault.tsx
│   │   │   ├── IncidentExplorer.tsx
│   │   │   ├── ThreatFamilies.tsx
│   │   │   ├── AgentProfile.tsx
│   │   │   ├── SecurityAnalyst.tsx
│   │   │   ├── Policies.tsx
│   │   │   └── Settings.tsx
│   │   ├── hooks/
│   │   │   ├── useIncidents.ts
│   │   │   ├── useThreats.ts
│   │   │   ├── useAgent.ts
│   │   │   ├── useAnalyst.ts
│   │   │   └── useApi.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   └── storage.ts
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   ├── variables.css
│   │   │   └── animations.css
│   │   └── store/
│   │       └── useStore.ts            # Zustand store
│   ├── public/
│   │   ├── favicon.svg
│   │   └── logo.svg
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── .env.example
│   └── Dockerfile
│
├── docker-compose.yml                 # Full stack
├── .gitignore
├── README.md                          # Project guide
├── SETUP.md                           # Setup instructions
├── DEMO_SCRIPT.md                     # Demo walkthrough
├── API_DOCUMENTATION.md               # Full API docs
├── DATABASE_SCHEMA.md                 # SQL schema
└── DEPLOYMENT.md                      # Deployment guide
```

## Key File Descriptions

### Backend Core Files

**main.py**
- FastAPI application initialization
- CORS configuration
- Route registration
- Middleware setup
- Error handlers

**config.py**
- Environment variable loading
- Database configuration
- OpenAI configuration
- Feature flags
- Security settings

**dependencies.py**
- Dependency injection
- Database session factory
- API key validation
- Agent authentication

**models/** 
- SQLAlchemy ORM models
- Database table definitions
- Relationships and constraints

**schemas/**
- Pydantic models
- Request/response validation
- OpenAPI documentation

**engines/**
- Core security logic
- Policy checking
- Similarity search
- Risk calculation
- Embedding generation
- Threat clustering
- AI analysis

**services/**
- Business logic layer
- Database operations
- External API calls
- Data transformation

**routes/**
- HTTP endpoint definitions
- Request handling
- Response formatting

### Frontend Core Files

**App.tsx**
- Route configuration
- Theme provider
- State initialization

**components/**
- Reusable UI components
- Page-specific components
- Shared utilities

**pages/**
- Route page components
- Page-level logic
- Data fetching

**hooks/**
- Custom React hooks
- API data fetching
- State management
- Local storage

**types/index.ts**
- TypeScript interfaces
- Type definitions
- API contracts

**store/useStore.ts**
- Zustand state management
- Global application state
- Persistence

### Configuration Files

**docker-compose.yml**
- PostgreSQL service
- Redis service (caching)
- Backend service
- Frontend service
- Volumes and networks

**requirements.txt**
- Python dependencies
- Version pinning
- Development tools

**package.json**
- Node dependencies
- Build scripts
- Dev servers

**tsconfig.json**
- TypeScript configuration
- Path aliases
- Module resolution

**tailwind.config.js**
- Color tokens
- Component extensions
- Dark mode configuration

---

## Build & Run

```bash
# Setup
git clone memoryshield-ai
cd memoryshield-ai

# Using Docker (recommended)
docker-compose up -d

# Manual setup
cd backend && pip install -r requirements.txt
cd ../frontend && npm install

# Run backend
cd backend && uvicorn app.main:app --reload

# Run frontend
cd frontend && npm run dev

# Access
Frontend: http://localhost:5173
Backend: http://localhost:8000
API Docs: http://localhost:8000/docs
```

---

## Development Workflow

```bash
# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "description"

# Run tests
pytest backend/tests -v

# Code formatting
black backend/
prettier --write frontend/src/

# Type checking
mypy backend/app
tsc --noEmit frontend/

# Linting
flake8 backend/
eslint frontend/src/
```
