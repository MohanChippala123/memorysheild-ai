-- MemoryShield AI - Complete Database Schema
-- PostgreSQL with pgvector extension

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- Core Tables
-- ============================================================================

-- Organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_org_created_at (created_at)
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'analyst', -- admin, analyst, viewer
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(organization_id, email),
    INDEX idx_user_org (organization_id),
    INDEX idx_user_created_at (created_at)
);

-- ============================================================================
-- Agent Management
-- ============================================================================

CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    agent_type VARCHAR(100), -- claude, gpt-4, llama, etc
    model_version VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

    -- Statistics (denormalized for performance)
    total_incidents INTEGER DEFAULT 0,
    blocked_count INTEGER DEFAULT 0,
    warned_count INTEGER DEFAULT 0,
    allowed_count INTEGER DEFAULT 0,
    detection_rate FLOAT DEFAULT 0.0,
    false_positive_rate FLOAT DEFAULT 0.0,
    current_risk_score FLOAT DEFAULT 0.0,

    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(organization_id, name),
    INDEX idx_agent_org (organization_id),
    INDEX idx_agent_created_at (created_at),
    INDEX idx_agent_active (is_active)
);

-- ============================================================================
-- Security Incidents (Core)
-- ============================================================================

CREATE TABLE security_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

    -- Timing
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Threat Classification
    threat_type VARCHAR(100) NOT NULL, -- Prompt Injection, Data Exfiltration, Tool Abuse, etc
    severity VARCHAR(50) NOT NULL, -- CRITICAL, HIGH, MEDIUM, LOW

    -- Content
    raw_prompt TEXT NOT NULL,
    prompt_preview VARCHAR(500),
    tool_call JSONB,
    tool_name VARCHAR(255),
    tool_parameters JSONB,

    -- Detection
    detected_signals TEXT[] DEFAULT '{}', -- Array of matched patterns
    confidence_score FLOAT,

    -- Policies
    policy_violations TEXT[] DEFAULT '{}', -- Array of violated policy IDs

    -- Response
    response TEXT,
    outcome VARCHAR(50) NOT NULL DEFAULT 'BLOCKED', -- ALLOWED, WARNED, BLOCKED
    action_taken VARCHAR(255),

    -- Scoring
    risk_score FLOAT NOT NULL DEFAULT 0.0, -- 0-100

    -- Relationships
    threat_family_id UUID,
    similar_incidents UUID[] DEFAULT '{}', -- Array of related incident IDs

    -- Vector Storage
    embedding VECTOR(1536),

    -- Metadata
    user_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    context JSONB DEFAULT '{}'::jsonb,

    -- Indexing
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    indexed_at TIMESTAMP,

    INDEX idx_incident_org (organization_id),
    INDEX idx_incident_agent (agent_id),
    INDEX idx_incident_threat_type (threat_type),
    INDEX idx_incident_severity (severity),
    INDEX idx_incident_outcome (outcome),
    INDEX idx_incident_timestamp (timestamp DESC),
    INDEX idx_incident_risk_score (risk_score DESC),
    INDEX idx_incident_threat_family (threat_family_id),
    INDEX idx_incident_created_at (created_at DESC),
    INDEX idx_incident_embedding ON security_incidents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)
);

-- ============================================================================
-- Threat Intelligence
-- ============================================================================

CREATE TABLE threat_families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,
    attack_type VARCHAR(100), -- Prompt Injection, Data Exfiltration, etc

    -- Hierarchy
    parent_family_id UUID REFERENCES threat_families(id) ON DELETE SET NULL,

    -- Shared Characteristics
    shared_indicators TEXT[] DEFAULT '{}',
    shared_patterns VARCHAR(500)[],
    ttps TEXT[], -- Tactics, Techniques, Procedures

    -- First/Last Incident
    first_incident_id UUID REFERENCES security_incidents(id) ON DELETE SET NULL,
    last_incident_id UUID REFERENCES security_incidents(id) ON DELETE SET NULL,

    -- Statistics
    incident_count INTEGER DEFAULT 0,
    avg_severity VARCHAR(50),
    severity VARCHAR(50), -- CRITICAL, HIGH, MEDIUM, LOW

    -- Timeline
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    first_seen TIMESTAMP,
    last_seen TIMESTAMP,

    metadata JSONB DEFAULT '{}'::jsonb,

    UNIQUE(organization_id, name),
    INDEX idx_threat_family_org (organization_id),
    INDEX idx_threat_family_type (attack_type),
    INDEX idx_threat_family_severity (severity),
    INDEX idx_threat_family_created_at (created_at DESC)
);

-- Link table: incidents to threat families (for N-to-N relationship)
ALTER TABLE security_incidents ADD CONSTRAINT fk_threat_family
    FOREIGN KEY (threat_family_id) REFERENCES threat_families(id) ON DELETE SET NULL;

-- Threat Indicators (shared patterns within families)
CREATE TABLE threat_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    threat_family_id UUID NOT NULL REFERENCES threat_families(id) ON DELETE CASCADE,

    indicator_type VARCHAR(100) NOT NULL, -- KEYWORD, PATTERN, BEHAVIOR, SIGNATURE
    value TEXT NOT NULL,
    description TEXT,

    frequency INTEGER DEFAULT 1, -- How many times seen
    severity VARCHAR(50),

    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    metadata JSONB DEFAULT '{}'::jsonb,

    INDEX idx_indicator_family (threat_family_id),
    INDEX idx_indicator_type (indicator_type)
);

-- ============================================================================
-- Security Policies
-- ============================================================================

CREATE TABLE security_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Policy Rules
    rules JSONB NOT NULL, -- { patterns: [], keywords: [], conditions: [] }

    -- Enforcement
    severity VARCHAR(50) NOT NULL, -- CRITICAL, HIGH, MEDIUM, LOW
    action VARCHAR(50) NOT NULL DEFAULT 'WARN', -- ALLOW, WARN, BLOCK
    enabled BOOLEAN DEFAULT TRUE,

    -- Audit
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    metadata JSONB DEFAULT '{}'::jsonb,

    UNIQUE(organization_id, name),
    INDEX idx_policy_org (organization_id),
    INDEX idx_policy_enabled (enabled),
    INDEX idx_policy_created_at (created_at DESC)
);

-- Policy Violations (incident -> policy junction)
CREATE TABLE policy_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES security_incidents(id) ON DELETE CASCADE,
    policy_id UUID NOT NULL REFERENCES security_policies(id) ON DELETE CASCADE,

    matched_pattern VARCHAR(500),
    violation_severity VARCHAR(50),
    confidence_score FLOAT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_policy_violation_incident (incident_id),
    INDEX idx_policy_violation_policy (policy_id)
);

-- ============================================================================
-- Vector Embeddings (Optimization)
-- ============================================================================

CREATE TABLE memory_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL UNIQUE REFERENCES security_incidents(id) ON DELETE CASCADE,

    embedding VECTOR(1536) NOT NULL,
    model_name VARCHAR(100) DEFAULT 'text-embedding-3-small',

    -- Caching for recent similarity searches
    similarity_cache JSONB DEFAULT '{}'::jsonb,
    cache_updated_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_embedding_incident (incident_id),
    INDEX idx_embedding_created_at (created_at)
);

-- ============================================================================
-- Metrics & Analytics
-- ============================================================================

CREATE TABLE agent_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

    metric_date DATE NOT NULL,

    -- Daily Counts
    incidents_detected INTEGER DEFAULT 0,
    incidents_blocked INTEGER DEFAULT 0,
    incidents_warned INTEGER DEFAULT 0,
    incidents_allowed INTEGER DEFAULT 0,

    -- Daily Rates
    detection_rate FLOAT DEFAULT 0.0,
    false_positive_rate FLOAT DEFAULT 0.0,
    block_rate FLOAT DEFAULT 0.0,

    -- Risk
    avg_risk_score FLOAT DEFAULT 0.0,
    max_risk_score FLOAT DEFAULT 0.0,

    -- Threat Distribution
    threat_distribution JSONB DEFAULT '{}'::jsonb, -- { threat_type: count }

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(agent_id, metric_date),
    INDEX idx_metrics_org (organization_id),
    INDEX idx_metrics_agent (agent_id),
    INDEX idx_metrics_date (metric_date DESC),
    INDEX idx_metrics_created_at (created_at DESC)
);

-- Risk Timeline (for trend visualization)
CREATE TABLE risk_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

    timeline_date DATE NOT NULL,
    risk_score FLOAT NOT NULL,
    trend VARCHAR(50), -- UP, DOWN, STABLE
    change_percent FLOAT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(agent_id, timeline_date),
    INDEX idx_risk_timeline_org (organization_id),
    INDEX idx_risk_timeline_agent (agent_id),
    INDEX idx_risk_timeline_date (timeline_date DESC)
);

-- ============================================================================
-- Audit & Compliance
-- ============================================================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    incident_id UUID REFERENCES security_incidents(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,

    action VARCHAR(255) NOT NULL, -- INCIDENT_BLOCKED, POLICY_CREATED, etc
    action_type VARCHAR(100), -- SECURITY_CHECK, POLICY_MANAGEMENT, USER_ACTION, etc
    details JSONB NOT NULL,

    severity VARCHAR(50),
    status VARCHAR(50), -- SUCCESS, FAILURE, PENDING

    created_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    ip_address VARCHAR(45),
    user_agent VARCHAR(500),

    INDEX idx_audit_org (organization_id),
    INDEX idx_audit_incident (incident_id),
    INDEX idx_audit_agent (agent_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_created_at (created_at DESC)
);

-- ============================================================================
-- Authentication & API Keys
-- ============================================================================

CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,

    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,

    last_used_at TIMESTAMP,
    last_used_ip VARCHAR(45),

    is_active BOOLEAN DEFAULT TRUE,

    metadata JSONB DEFAULT '{}'::jsonb,

    UNIQUE(organization_id, name),
    INDEX idx_api_key_org (organization_id),
    INDEX idx_api_key_hash (key_hash),
    INDEX idx_api_key_active (is_active)
);

-- ============================================================================
-- Caching & Performance
-- ============================================================================

CREATE TABLE similarity_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES security_incidents(id) ON DELETE CASCADE,

    similar_incidents JSONB NOT NULL, -- [ { id, similarity, threat_type } ]
    cache_key VARCHAR(255) UNIQUE NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,

    INDEX idx_similarity_cache_incident (incident_id),
    INDEX idx_similarity_cache_expires (expires_at)
);

-- ============================================================================
-- Indices for Performance
-- ============================================================================

-- Vector search index (already created above)
-- Additional query optimization indices

CREATE INDEX idx_incident_org_timestamp ON security_incidents(organization_id, timestamp DESC);
CREATE INDEX idx_incident_agent_severity ON security_incidents(agent_id, severity);
CREATE INDEX idx_incident_threat_family_count ON threat_families(organization_id, incident_count DESC);

-- Partial indices for active records
CREATE INDEX idx_agents_active ON agents(organization_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_policies_enabled ON security_policies(organization_id) WHERE enabled = TRUE;
CREATE INDEX idx_api_keys_active ON api_keys(organization_id) WHERE is_active = TRUE;

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

CREATE VIEW incident_summary AS
SELECT
    i.id,
    i.agent_id,
    i.threat_type,
    i.severity,
    i.outcome,
    i.risk_score,
    i.timestamp,
    (SELECT COUNT(*) FROM security_incidents si
     WHERE si.threat_family_id = i.threat_family_id) as family_count,
    (SELECT COUNT(*) FROM security_incidents si
     WHERE si.id != i.id AND si.threat_family_id = i.threat_family_id
     AND si.timestamp > i.timestamp - INTERVAL '30 days') as recent_family_incidents
FROM security_incidents i;

CREATE VIEW agent_summary AS
SELECT
    a.id,
    a.name,
    a.total_incidents,
    a.blocked_count,
    a.warned_count,
    a.allowed_count,
    a.detection_rate,
    a.false_positive_rate,
    a.current_risk_score,
    (SELECT COUNT(DISTINCT threat_type) FROM security_incidents
     WHERE agent_id = a.id) as unique_threat_types,
    (SELECT COUNT(*) FROM security_incidents
     WHERE agent_id = a.id AND timestamp > CURRENT_TIMESTAMP - INTERVAL '7 days') as incidents_last_7_days
FROM agents a;

CREATE VIEW threat_family_summary AS
SELECT
    tf.id,
    tf.name,
    tf.attack_type,
    tf.incident_count,
    tf.severity,
    (SELECT COUNT(*) FROM threat_indicators WHERE threat_family_id = tf.id) as indicator_count,
    tf.first_seen,
    tf.last_seen,
    (SELECT AVG(risk_score) FROM security_incidents WHERE threat_family_id = tf.id) as avg_risk_score
FROM threat_families tf;

-- ============================================================================
-- Function for Incident Count Updates
-- ============================================================================

CREATE OR REPLACE FUNCTION update_agent_incident_counts()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE agents
    SET
        total_incidents = (SELECT COUNT(*) FROM security_incidents WHERE agent_id = NEW.agent_id),
        blocked_count = (SELECT COUNT(*) FROM security_incidents WHERE agent_id = NEW.agent_id AND outcome = 'BLOCKED'),
        warned_count = (SELECT COUNT(*) FROM security_incidents WHERE agent_id = NEW.agent_id AND outcome = 'WARNED'),
        allowed_count = (SELECT COUNT(*) FROM security_incidents WHERE agent_id = NEW.agent_id AND outcome = 'ALLOWED'),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.agent_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_agent_counts
AFTER INSERT OR DELETE ON security_incidents
FOR EACH ROW
EXECUTE FUNCTION update_agent_incident_counts();

-- ============================================================================
-- Function for Threat Family Count Updates
-- ============================================================================

CREATE OR REPLACE FUNCTION update_threat_family_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.threat_family_id IS NOT NULL THEN
        UPDATE threat_families
        SET
            incident_count = (SELECT COUNT(*) FROM security_incidents WHERE threat_family_id = NEW.threat_family_id),
            last_seen = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.threat_family_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_threat_family_counts
AFTER INSERT OR DELETE ON security_incidents
FOR EACH ROW
EXECUTE FUNCTION update_threat_family_counts();

-- ============================================================================
-- Sample Data (for development)
-- ============================================================================

INSERT INTO organizations (name, slug) VALUES
    ('Demo Org', 'demo-org');

INSERT INTO agents (organization_id, name, agent_type, model_version)
    SELECT id, 'Claude AI Agent', 'claude', '4-turbo' FROM organizations WHERE slug = 'demo-org';

INSERT INTO threat_families (organization_id, name, attack_type, severity)
    SELECT id, 'Prompt Injection', 'Prompt Injection', 'CRITICAL' FROM organizations WHERE slug = 'demo-org';

INSERT INTO security_policies (organization_id, name, description, rules, severity, action, enabled)
    SELECT
        id,
        'No System Prompt Disclosure',
        'Block attempts to reveal system prompts',
        '{"patterns": ["ignore previous", "reveal prompt", "show instructions"], "keywords": ["system prompt", "hidden instructions"]}'::jsonb,
        'CRITICAL',
        'BLOCK',
        TRUE
    FROM organizations WHERE slug = 'demo-org';
