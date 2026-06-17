# backend/app/main.py
# MemoryShield AI - FastAPI Backend

from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from typing import Optional

from app.config import settings
from app.database.connection import init_db, get_db_session
from app.routes import (
    security,
    incidents,
    threat_families,
    agents,
    policies,
    metrics,
    analyst,
    health
)
from app.utils.logger import setup_logging

# Setup logging
logger = setup_logging(__name__)

# ============================================================================
# Lifecycle Management
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown"""
    # Startup
    logger.info("Starting MemoryShield AI")
    await init_db()
    logger.info("Database initialized")

    yield

    # Shutdown
    logger.info("Shutting down MemoryShield AI")


# ============================================================================
# Application Setup
# ============================================================================

app = FastAPI(
    title="MemoryShield AI",
    description="AI agents that learn from security incidents",
    version="1.0.0",
    lifespan=lifespan,
)

# ============================================================================
# CORS Configuration
# ============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Custom Middleware
# ============================================================================

@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add request ID to all requests"""
    request_id = request.headers.get("X-Request-ID", None)
    if not request_id:
        import uuid
        request_id = str(uuid.uuid4())

    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests"""
    logger.info(f"{request.method} {request.url.path}")
    try:
        response = await call_next(request)
        logger.info(f"Response: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Request failed: {str(e)}")
        raise


# ============================================================================
# Exception Handlers
# ============================================================================

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "An error occurred"
        }
    )


# ============================================================================
# Route Registration
# ============================================================================

# Health check (no auth required)
app.include_router(health.router, prefix="/api/v1")

# Core security check endpoint
app.include_router(security.router, prefix="/api/v1")

# Incident management
app.include_router(incidents.router, prefix="/api/v1")

# Threat family management
app.include_router(threat_families.router, prefix="/api/v1")

# Agent management
app.include_router(agents.router, prefix="/api/v1")

# Policy management
app.include_router(policies.router, prefix="/api/v1")

# Metrics and analytics
app.include_router(metrics.router, prefix="/api/v1")

# AI Security Analyst
app.include_router(analyst.router, prefix="/api/v1")


# ============================================================================
# Root Endpoint
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "MemoryShield AI",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
        "health": "/api/v1/health"
    }


# ============================================================================
# OpenAPI Schema Customization
# ============================================================================

def custom_openapi():
    """Customize OpenAPI schema"""
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = {
        "openapi": "3.0.2",
        "info": {
            "title": "MemoryShield AI",
            "description": "Enterprise AI security memory layer",
            "version": "1.0.0",
            "x-logo": {
                "url": "/logo.png"
            }
        },
        "servers": [
            {"url": "http://localhost:8000", "description": "Development"},
            {"url": "https://api.memoryshield.ai", "description": "Production"}
        ],
        "tags": [
            {
                "name": "Security",
                "description": "Core security check and incident management"
            },
            {
                "name": "Incidents",
                "description": "Incident query and analysis"
            },
            {
                "name": "Threats",
                "description": "Threat family management"
            },
            {
                "name": "Agents",
                "description": "Agent management and metrics"
            },
            {
                "name": "Policies",
                "description": "Security policy management"
            },
            {
                "name": "Analyst",
                "description": "AI-powered security analysis"
            }
        ]
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


# ============================================================================
# Startup/Shutdown Events (Legacy)
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Startup event"""
    logger.info("MemoryShield AI starting up")


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event"""
    logger.info("MemoryShield AI shutting down")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
