import logging
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.routers import recommendations, health, stats
from app.services.recommendation_engine import RecommendationEngine
from app.services.recommendation_service import RecommendationService
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create global instances of services
recommendation_engine = RecommendationEngine()
recommendation_service = RecommendationService(recommendation_engine=recommendation_engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan event handler for FastAPI app.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("Starting application")
    
    # Shutdown
    yield
    logger.info("Shutting down application")

# Create FastAPI application
app = FastAPI(
    title="Alexandria Library API",
    description="AI-powered book recommendation service",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get recommendation service
def get_recommendation_service():
    """Dependency to get recommendation service."""
    return recommendation_service

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(stats.router, prefix="/api", tags=["stats"])
app.include_router(
    recommendations.router, 
    prefix="/api", 
    tags=["recommendations"],
    dependencies=[Depends(get_recommendation_service)]
)

@app.get("/")
async def root():
    """Root endpoint that redirects to documentation."""
    return {"message": "Welcome to Alexandria Library API! See /docs for documentation."}

# Handle exceptions
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions."""
    return {"detail": exc.detail, "status_code": exc.status_code}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 