"""
Main FastAPI application for VERSE - Virtual Experience Reactive Story Engine
"""

import os
import sys
import uvicorn
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from contextlib import asynccontextmanager
import logging
from datetime import datetime
import json

# Add backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

# Import API routers
from api import (
    auth_router,
    stories_router,
    characters_router,
    choices_router,
    progress_router,
    generate_router
)
from create_db import create_database

# Import core components for initialization
from core import (
    get_story_generator,
    get_character_manager,
    get_choice_processor,
    get_story_validator,
    get_ai_client
)

# Import utilities
from utils.helpers import get_config_value, setup_logging, get_database_connection
from utils.auth_utils import get_current_user

# Configure logging
setup_logging()
logger = logging.getLogger(__name__)
create_database()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager for startup and shutdown events
    """
    # Startup
    logger.info("Starting VERSE application...")
    
    try:
        # Initialize database connection
        conn = get_database_connection()
        conn.close()
        logger.info("Database connection verified")
        
        # Initialize core components
        ai_client = get_ai_client()
        logger.info("AI client initialized")
        
        story_validator = get_story_validator()
        logger.info("Story validator initialized")
        
        character_manager = get_character_manager()
        logger.info("Character manager initialized")
        
        choice_processor = get_choice_processor()
        logger.info("Choice processor initialized")
        
        story_generator = get_story_generator()
        logger.info("Story generator initialized")
        
        logger.info("All core components initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize application: {str(e)}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down VERSE application...")
    # Add any cleanup tasks here if needed

# Create FastAPI application
app = FastAPI(
    title="VERSE - Virtual Experience Reactive Story Engine",
    description="""
    **VERSE** is an advanced AI-powered interactive storytelling platform that creates 
    personalized, dynamic narratives based on user choices and preferences.
    
    ## Features
    
    * **Dynamic Story Generation**: AI-powered story creation with multiple genres and themes
    * **Character Management**: Deep character development with personality tracking
    * **Interactive Choices**: Meaningful decisions that impact story progression
    * **Progress Tracking**: Comprehensive user analytics and achievement system
    * **AI Generation Tools**: Quick story ideas, character concepts, and dialogue generation
    
    ## Authentication
    
    Most endpoints require authentication. Use `/auth/register` to create an account 
    and `/auth/login` to get an access token.
    """,
    version="1.0.0",
    contact={
        "name": "VERSE Development Team",
        "email": "support@verse-stories.com",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    # lifespan=lifespan
)

# CORS Configuration
cors_origins = get_config_value("api.cors_origins", ["http://localhost:3000", "http://localhost:8080"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Trusted Host Middleware
trusted_hosts = get_config_value("api.trusted_hosts", ["localhost", "127.0.0.1"])
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=trusted_hosts
)

# Custom exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Custom HTTP exception handler
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.detail,
            "status_code": exc.status_code,
            "timestamp": datetime.now().isoformat(),
            "path": str(request.url.path)
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    General exception handler for unhandled exceptions
    """
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "message": "Internal server error occurred",
            "status_code": 500,
            "timestamp": datetime.now().isoformat(),
            "path": str(request.url.path)
        }
    )


# Replace the log_requests middleware with this enhanced version:

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Log all incoming requests with full request/response details
    """
    start_time = datetime.now()

    # Capture request body
    request_body = None
    try:
        if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
            request_body = await request.body()

            # Recreate request with body for downstream processing
            async def receive():
                return {"type": "http.request", "body": request_body}

            request._receive = receive
    except Exception as e:
        logger.error(f"Failed to capture request body: {e}")
        request_body = b"<Failed to capture>"

    # Process request
    response = await call_next(request)

    # Capture response body
    response_body = None
    response_text = None
    try:
        # Collect response body
        body_parts = []
        async for chunk in response.body_iterator:
            body_parts.append(chunk)

        response_body = b''.join(body_parts)

        # Try to decode as text
        try:
            response_text = response_body.decode('utf-8')
        except UnicodeDecodeError:
            response_text = f"<Binary content: {len(response_body)} bytes>"

        # Recreate the response with the body
        from fastapi.responses import Response
        new_response = Response(
            content=response_body,
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.headers.get("content-type")
        )
        response = new_response

    except Exception as e:
        logger.error(f"Failed to capture response body: {e}")
        response_text = f"<Failed to capture response: {e}>"

    # Calculate processing time
    process_time = (datetime.now() - start_time).total_seconds()

    # Prepare request details
    request_details = {
        "method": request.method,
        "url": str(request.url),
        "path": request.url.path,
        "query_params": str(request.query_params),
        "headers": dict(request.headers),
        "client": getattr(request.client, 'host', 'unknown') if request.client else 'unknown'
    }

    # Add request body if present
    if request_body:
        try:
            if request.headers.get("content-type", "").startswith("application/json"):
                request_details["body"] = json.loads(request_body.decode('utf-8'))
            else:
                request_details["body"] = request_body.decode('utf-8')[:1000]  # Limit size
        except Exception:
            request_details["body"] = f"<Binary content: {len(request_body)} bytes>"

    # Prepare response details
    response_details = {
        "status_code": response.status_code,
        "headers": dict(response.headers),
        "body": response_text[:2000] if response_text else None,  # Limit size for logging
        "body_size": len(response_body) if response_body else 0
    }

    # Log based on status code
    if response.status_code >= 400:
        # Error responses - log as ERROR with full details
        logger.error(
            f"API Error - {request.method} {request.url.path}\n"
            f"Status: {response.status_code}\n"
            f"Time: {process_time:.4f}s\n"
            # f"Request Details: {json.dumps(request_details, indent=2, default=str)}\n"
            f"Response Details: {json.dumps(response_details, indent=2, default=str)}"
        )
    elif response.status_code >= 300:
        # Redirect responses - log as WARNING
        logger.warning(
            f"API Redirect - {request.method} {request.url.path} - "
            f"Status: {response.status_code} - Time: {process_time:.4f}s"
        )
    else:
        # Success responses - log as INFO (condensed)
        logger.info(
            f"API Success - {request.method} {request.url.path} - "
            f"Status: {response.status_code} - Time: {process_time:.4f}s - "
            f"Response Size: {len(response_body) if response_body else 0} bytes"
        )

    # Debug logging for development
    if get_config_value("app.debug", False):
        logger.debug(
            f"Full Request/Response Debug:\n"
            f"Request: {json.dumps(request_details, indent=2, default=str)}\n"
            f"Response: {json.dumps(response_details, indent=2, default=str)}"
        )

    # Add custom headers
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-API-Version"] = "1.0.0"

    return response


# Include API routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(stories_router, prefix="/api/v1")
app.include_router(characters_router, prefix="/api/v1")
app.include_router(choices_router, prefix="/api/v1")
app.include_router(progress_router, prefix="/api/v1")
app.include_router(generate_router, prefix="/api/v1")

# Root endpoint
@app.get("/", tags=["root"])
async def root():
    """
    Root endpoint - API information
    """
    return {
        "message": "Welcome to VERSE - Virtual Experience Reactive Story Engine",
        "version": "1.0.0",
        "status": "active",
        "timestamp": datetime.now().isoformat(),
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "api_prefix": "/api/v1"
    }

# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    """
    Health check endpoint for monitoring
    """
    try:
        # Test database connection
        conn = get_database_connection()
        conn.execute("SELECT 1")
        conn.close()
        db_status = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        db_status = "unhealthy"
    
    # Test core components
    try:
        story_generator = get_story_generator()
        core_status = "healthy"
    except Exception as e:
        logger.error(f"Core components health check failed: {str(e)}")
        core_status = "unhealthy"
    
    overall_status = "healthy" if db_status == "healthy" and core_status == "healthy" else "unhealthy"
    
    return {
        "status": overall_status,
        "timestamp": datetime.now().isoformat(),
        "components": {
            "database": db_status,
            "core_services": core_status
        },
        "version": "1.0.0"
    }

# API status endpoint
@app.get("/api/v1/status", tags=["status"])
async def api_status():
    """
    Detailed API status information
    """
    try:
        # Get core component statistics
        story_generator = get_story_generator()
        analytics = story_generator.get_story_analytics()
        
        # Get database statistics
        conn = get_database_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM stories")
        story_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM characters")
        character_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM user_choices")
        choice_count = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            "api_version": "1.0.0",
            "status": "operational",
            "timestamp": datetime.now().isoformat(),
            "statistics": {
                "total_users": user_count,
                "total_stories": story_count,
                "total_characters": character_count,
                "total_choices": choice_count,
                "active_sessions": analytics.get("total_sessions", 0)
            },
            "core_analytics": analytics
        }
        
    except Exception as e:
        logger.error(f"Failed to get API status: {str(e)}")
        return {
            "api_version": "1.0.0",
            "status": "error",
            "timestamp": datetime.now().isoformat(),
            "error": "Failed to retrieve status information"
        }

# Custom OpenAPI schema
def custom_openapi():
    """
    Custom OpenAPI schema with additional metadata
    """
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="VERSE API",
        version="1.0.0",
        description=app.description,
        routes=app.routes,
    )
    
    # Add custom schema information
    openapi_schema["info"]["x-logo"] = {
        "url": "https://verse-stories.com/logo.png"
    }
    
    # Add server information
    openapi_schema["servers"] = [
        {
            "url": "http://localhost:8000",
            "description": "Development server"
        },
        {
            "url": "https://api.verse-stories.com",
            "description": "Production server"
        }
    ]
    
    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "HTTPBearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Development endpoints (only available in development mode)
if get_config_value("app.debug", False):
    
    @app.get("/dev/reset-data", tags=["development"])
    async def reset_development_data():
        """
        Reset all data for development (DEBUG MODE ONLY)
        """
        try:
            # Reset core components
            from core import (
                reset_story_generator,
                reset_character_manager,
                reset_choice_processor
            )
            
            reset_story_generator()
            reset_character_manager()
            reset_choice_processor()
            
            # Clear database (keep structure)
            conn = get_database_connection()
            cursor = conn.cursor()
            
            cursor.execute("DELETE FROM user_choices")
            cursor.execute("DELETE FROM characters")
            cursor.execute("DELETE FROM stories")
            cursor.execute("DELETE FROM generation_log")
            # Don't delete users in case there are test accounts
            
            conn.commit()
            conn.close()
            
            logger.warning("Development data reset performed")
            
            return {
                "message": "Development data reset successfully",
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to reset development data: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Data reset failed: {str(e)}"
            )
    
    @app.get("/dev/test-ai", tags=["development"])
    async def test_ai_connection():
        """
        Test AI client connection (DEBUG MODE ONLY)
        """
        try:
            ai_client = get_ai_client()
            # Add AI connection test here
            
            return {
                "message": "AI client connection test",
                "status": "available",
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"AI connection test failed: {str(e)}")
            return {
                "message": "AI client connection test",
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

# Main execution
if __name__ == "__main__":
    # Get configuration
    host = get_config_value("api.host", "localhost")
    port = get_config_value("api.port", 8000)
    debug = get_config_value("app.debug", False)
    reload = get_config_value("app.reload", False)
    
    logger.info(f"Starting VERSE API server on {host}:{port}")
    logger.info(f"Debug mode: {debug}")
    logger.info(f"Auto-reload: {reload}")
    
    # Run the application
    uvicorn.run(
        app,
        host=host,
        port=port,
        reload=reload,
        log_level="info" if not debug else "debug",
        access_log=True
    )