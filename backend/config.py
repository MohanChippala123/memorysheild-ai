# backend/app/config.py
# Configuration management for MemoryShield AI

from pydantic_settings import BaseSettings
from typing import Optional, List
import os
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings from environment variables"""

    # ========================================================================
    # Application
    # ========================================================================
    APP_NAME: str = "MemoryShield AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # ========================================================================
    # Database
    # ========================================================================
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://memoryshield:password@localhost:5432/memoryshield"
    )
    DATABASE_POOL_SIZE: int = int(os.getenv("DATABASE_POOL_SIZE", "20"))
    DATABASE_MAX_OVERFLOW: int = int(os.getenv("DATABASE_MAX_OVERFLOW", "10"))

    # ========================================================================
    # Redis Caching
    # ========================================================================
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "3600"))  # 1 hour
    SIMILARITY_CACHE_TTL: int = int(os.getenv("SIMILARITY_CACHE_TTL", "86400"))  # 24 hours

    # ========================================================================
    # OpenAI (Embeddings)
    # ========================================================================
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_EMBEDDING_MODEL: str = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
    OPENAI_EMBEDDING_DIMENSIONS: int = 1536

    # ========================================================================
    # Anthropic (Optional)
    # ========================================================================
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    USE_ANTHROPIC_FOR_ANALYSIS: bool = os.getenv("USE_ANTHROPIC_FOR_ANALYSIS", "False") == "True"

    # ========================================================================
    # Authentication
    # ========================================================================
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "dev-secret-key-change-in-production"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

    # ========================================================================
    # CORS
    # ========================================================================
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
    ]
    if os.getenv("CORS_ORIGINS"):
        CORS_ORIGINS = os.getenv("CORS_ORIGINS").split(",")

    # ========================================================================
    # Security
    # ========================================================================
    ALLOWED_THREAT_TYPES: List[str] = [
        "Prompt Injection",
        "Data Exfiltration",
        "Credential Extraction",
        "Tool Abuse",
        "Jailbreak Attempt",
        "Policy Violation",
        "Unsafe Operation",
        "Social Engineering",
    ]

    SEVERITY_LEVELS: List[str] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]

    DEFAULT_POLICIES: dict = {
        "NO_SYSTEM_PROMPT_DISCLOSURE": {
            "description": "Block attempts to reveal system prompts",
            "patterns": ["ignore previous", "reveal prompt", "show instructions"],
            "keywords": ["system prompt", "hidden instructions"],
            "severity": "CRITICAL",
            "action": "BLOCK"
        },
        "NO_CREDENTIAL_EXPOSURE": {
            "description": "Block credential disclosure attempts",
            "patterns": ["password", "api key", "secret", "token"],
            "keywords": ["credentials", "authentication token", "api_key"],
            "severity": "CRITICAL",
            "action": "BLOCK"
        },
        "NO_UNSAFE_SHELL": {
            "description": "Block unsafe shell commands",
            "patterns": ["rm -rf", "drop database", "delete from"],
            "keywords": ["dangerous command", "destructive operation"],
            "severity": "CRITICAL",
            "action": "BLOCK"
        },
        "NO_DATA_EXFILTRATION": {
            "description": "Block data exfiltration attempts",
            "patterns": ["export", "download all", "retrieve database"],
            "keywords": ["sensitive data", "pii", "confidential"],
            "severity": "HIGH",
            "action": "BLOCK"
        },
    }

    # ========================================================================
    # Similarity Engine
    # ========================================================================
    SIMILARITY_THRESHOLD: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.85"))
    TOP_K_SIMILAR_INCIDENTS: int = int(os.getenv("TOP_K_SIMILAR_INCIDENTS", "5"))
    VECTOR_SEARCH_LIMIT: int = int(os.getenv("VECTOR_SEARCH_LIMIT", "50"))

    # ========================================================================
    # Risk Scoring
    # ========================================================================
    RISK_ALLOW_THRESHOLD: float = float(os.getenv("RISK_ALLOW_THRESHOLD", "25"))
    RISK_WARN_THRESHOLD: float = float(os.getenv("RISK_WARN_THRESHOLD", "60"))
    RISK_BLOCK_THRESHOLD: float = float(os.getenv("RISK_BLOCK_THRESHOLD", "100"))

    # ========================================================================
    # Rate Limiting
    # ========================================================================
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "True") == "True"
    RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    RATE_LIMIT_PERIOD: int = int(os.getenv("RATE_LIMIT_PERIOD", "60"))  # seconds

    # ========================================================================
    # Logging
    # ========================================================================
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = "json"  # json or text

    # ========================================================================
    # Data Retention
    # ========================================================================
    INCIDENT_RETENTION_DAYS: int = int(os.getenv("INCIDENT_RETENTION_DAYS", "365"))
    AUDIT_LOG_RETENTION_DAYS: int = int(os.getenv("AUDIT_LOG_RETENTION_DAYS", "730"))

    # ========================================================================
    # Feature Flags
    # ========================================================================
    ENABLE_AI_ANALYST: bool = os.getenv("ENABLE_AI_ANALYST", "True") == "True"
    ENABLE_THREAT_FAMILIES: bool = os.getenv("ENABLE_THREAT_FAMILIES", "True") == "True"
    ENABLE_AUTOMATED_RESPONSES: bool = os.getenv("ENABLE_AUTOMATED_RESPONSES", "False") == "True"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Expose settings instance for imports
settings = get_settings()
