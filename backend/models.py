# backend/app/models/__init__.py
# SQLAlchemy ORM Models for MemoryShield AI

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text,
    ForeignKey, ARRAY, JSON, UUID as SQL_UUID, Index, ForeignKeyConstraint
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import VECTOR
from datetime import datetime
import uuid

Base = declarative_base()

# ============================================================================
# Organization & Auth
# ============================================================================

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(SQL_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    slug = Column(String(255), nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    metadata = Column(JSON, default={})
    is_active = Column(Boolean, default=True)

    # Relationships
    agents = relationship("Agent", back_populates="organization")
    incidents = relationship("SecurityIncident", back_populates="organization")
    policies = relationship("SecurityPolicy", back_populates="organization")


class User(Base):
    __tablename__ = "users"

    id = Column(SQL_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(SQL_UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    email = Column(String(255), nullable=False)
    name = Column(String(255))
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="analyst")  # admin, analyst, viewer
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)
    is_active = Column(Boolean, default=True)


class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(SQL_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(SQL_UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    agent_id = Column(SQL_UUID(as_uuid=True), ForeignKey("agents.id"))
    name = Column(String(255), nullable=False)
    key_hash = Column(String(255), nullable=False, unique=True)
    created_by = Column(SQL_UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    last_used_at = Column(DateTime)
    last_used_ip = Column(String(45))
    is_active = Column(Boolean, default=True)
    metadata = Column(JSON, default={})


# ============================================================================
# Agents
# ============================================================================

class Agent(Base):
    __tablename__ = "agents"

    id = Column(SQL_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(SQL_UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    agent_type = Column(String(100))
    model_version = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_activity = Column(DateTime)
    is_active = Column(Boolean, default=True)

    # Statistics
    total_incidents = Column(Integer, default=0)
    blocked_count = Column(Integer, default=0)
    warned_count = Column(Integer, default=0)
    allowed_count = Column(Integer, default=0)
    detection_rate = Column(Float, default=0.0)
    false_positive_rate = Column(Float, default=0.0)
    current_risk_score = Column(Float, default=0.0)

    metadata = Column(JSON, default={})

    # Relationships
    organization = relationship("Organization", back_populates="agents")
    incidents = relationship("SecurityIncident", back_populates="agent")
    metrics = relationship("AgentMetrics", back_populates="agent")


# ============================================================================
# Security Incidents (Core)
# ============================================================================

class SecurityIncident(Base):
    __tablename__ = "security_incidents"

    id = Column(SQL_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(SQL_UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    agent_id = Column(SQL_UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False)

    # Timing
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Threat Classification
    threat_type = Column(String(100), nullable=False)
    severity = Column(String(50), nullable=False)

    # Content
    raw_prompt = Column(Text, nullable=False)
    prompt_preview = Column(String(500))
    tool_call = Column(JSON)
    tool_name = Column(String(255))
    tool_parameters = Column(JSON)

    # Detection
    detected_signals = Column(ARRAY(String), default=[])
    confidence_score = Column(Float)

    # Policies
    policy_violations = Column(ARRAY(String), default=[])

    # Response
    response = Column(Text)
    outcome = Column(String(50), default="BLOCKED")
    action_taken = Column(String(255))

    # Scoring
    risk_score = Column(Float, default=0.0)

    # Relationships
    threat_family_id = Column(SQL_UUID(as_uuid=True), ForeignKey("threat_families.id"))
    similar_incidents = Column(ARRAY(SQL_UUID(as_uuid=True)), default=[])

    # Vector Storage
    embedding = Column(VECTOR(1536))

    # Metadata
    user_id = Column(String(255))
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    context = Column(JSON, default={})

    created_at = Column(DateTime, default=datetime.utcnow)
    indexed_at = Column(DateTime)

    # Relationships
    organization = relationship("Organization", back_populates="incidents")
    agent = relationship("Agent", back_populates="incidents")
    threat_family = relationship("ThreatFamily", back_populates="incidents")
    policy_violations_rel = relationship("PolicyViolation", back_populates="incident")
    audit_logs = relationship("AuditLog", back_populates="incident")


# ============================================================================
# Threat Intelligence
# ============================================================================

class ThreatFamily(Base):
    __tablename__ = "threat_families"

    id = Column(SQL_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(SQL_UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)

    name = Column(String(255), nullable=False)
    description = Column(Text)
    attack_type = Column(String(100))

    parent_family_id = Column(SQL_UUID(as_uuid=True), ForeignKey("threat_families.id"))

    shared_indicators = Column(ARRAY(String), default=[])
    shared_patterns = Column(ARRAY(String), default=[])
    ttps = Column(ARRAY(String), default=[])

    first_incident_id = Column(SQL_UUID(as_uuid=True), ForeignKey("security_incidents.id"))
    last_incident_id = Column(SQL_UUID(as_uuid=True), ForeignKey("security_incidents.id"))

    incident_count = Column(Integer, default=0)
    avg_severity = Column(String(50))
    severity = Column(String(50))

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    first_seen = Column(DateTime)
    last_seen = Column(DateTime)

    metadata = Column(JSON, default={})

    # Relationships
    incidents = relationship("SecurityIncident", back_populates="threat_family", foreign_keys=[SecurityIncident.threat_family_id])
    indicators = relationship("ThreatIndicator", back_populates="threat_family")


class ThreatIndicator(Base):
    __tablename__ = "threat_indicators"

    id = Column(SQL_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    threat_family_id = Column(SQL_UUID(as_uuid=True), ForeignKey("threat_families.id"), nullable=False)

    indicator_type = Column(String(100), nullable=False)
    value = Column(Text, nullable=False)
    description = Column(Text)

    frequency = Column(Integer, default=1)
    severity = Column(String(50))

    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    metadata = Column(JSON, default={})

    # Relationships
    threat_family = relationship("ThreatFamily", back_populates="indicators")


# ============================================================================
# Policies
# ============================================================================

class SecurityPolicy(Base):
    __tablename__ = "security_policies"

    id = Column(SQL_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(SQL_UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)

    name = Column(String(255), nullable=False)
    description = Column(Text)

    rules = Column(JSON, nullable=False)

    severity = Column(String(50), nullable=False)
    action = Column(String(50), default="WARN")
    enabled = Column(Boolean, default=True)

    created_by = Column(SQL_UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    metadata = Column(JSON, default={})

    # Relationships
    organization = relationship("Organization", back_populates="policies")
    violations = relationship("PolicyViolation", back_populates="policy")


class PolicyViolation(Base):
    __tablename__ = "policy_violations"

    id = Column(SQL_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id = Column(SQL_UUID(as_uuid=True), ForeignKey("security_incidents.id"), nullable=False)
    policy_id = Column(SQL_UUID(as_uuid=True), ForeignKey("security_policies.id"), nullable=False)

    matched_pattern = Column(String(500))
    violation_severity = Column(String(50))
    confidence_score = Column(Float)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    incident = relationship("SecurityIncident", back_populates="policy_violations_rel")
    policy = relationship("SecurityPolicy", back_populates="violations")


# ============================================================================
# Metrics & Analytics
# ============================================================================

class AgentMetrics(Base):
    __tablename__ = "agent_metrics"

    id = Column(SQL_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(SQL_UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    agent_id = Column(SQL_UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False)

    metric_date = Column(DateTime, nullable=False)

    incidents_detected = Column(Integer, default=0)
    incidents_blocked = Column(Integer, default=0)
    incidents_warned = Column(Integer, default=0)
    incidents_allowed = Column(Integer, default=0)

    detection_rate = Column(Float, default=0.0)
    false_positive_rate = Column(Float, default=0.0)
    block_rate = Column(Float, default=0.0)

    avg_risk_score = Column(Float, default=0.0)
    max_risk_score = Column(Float, default=0.0)

    threat_distribution = Column(JSON, default={})

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    agent = relationship("Agent", back_populates="metrics")


class RiskTimeline(Base):
    __tablename__ = "risk_timeline"

    id = Column(SQL_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(SQL_UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    agent_id = Column(SQL_UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False)

    timeline_date = Column(DateTime, nullable=False)
    risk_score = Column(Float, nullable=False)
    trend = Column(String(50))
    change_percent = Column(Float)

    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================================================
# Audit
# ============================================================================

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(SQL_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(SQL_UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)

    incident_id = Column(SQL_UUID(as_uuid=True), ForeignKey("security_incidents.id"))
    agent_id = Column(SQL_UUID(as_uuid=True), ForeignKey("agents.id"))

    action = Column(String(255), nullable=False)
    action_type = Column(String(100))
    details = Column(JSON, nullable=False)

    severity = Column(String(50))
    status = Column(String(50))

    created_by = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    ip_address = Column(String(45))
    user_agent = Column(String(500))

    # Relationships
    incident = relationship("SecurityIncident", back_populates="audit_logs")


# ============================================================================
# Caching & Optimization
# ============================================================================

class SimilarityCache(Base):
    __tablename__ = "similarity_cache"

    id = Column(SQL_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id = Column(SQL_UUID(as_uuid=True), ForeignKey("security_incidents.id"), nullable=False)

    similar_incidents = Column(JSON, nullable=False)
    cache_key = Column(String(255), nullable=False, unique=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
