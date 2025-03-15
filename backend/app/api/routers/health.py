import logging
from datetime import datetime
import time
import psutil
import os

from fastapi import APIRouter, HTTPException

from app.models.schemas import HealthResponse
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

# Track when the service started
start_time = time.time()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Check the health of the service.
    
    Returns basic health information including:
    - Status: Healthy or unhealthy
    - Version: API version
    - Timestamp: Current timestamp
    
    This endpoint is useful for monitoring systems to check if the service is running correctly.
    """
    try:
        # Get memory usage
        memory_usage = psutil.Process(os.getpid()).memory_info().rss / 1024 / 1024  # in MB
        
        # Calculate uptime
        uptime_seconds = time.time() - start_time
        
        response = HealthResponse(
            status="healthy",
            version="1.0.0",
            timestamp=datetime.now()
        )
        
        # Add additional data (not in the schema, but will be included in the response)
        response_dict = response.dict()
        response_dict["uptime_seconds"] = uptime_seconds
        response_dict["memory_usage_mb"] = round(memory_usage, 2)
        
        # Check if all required API keys are available
        api_keys_available = all([
            settings.OPENAI_API_KEY,
            settings.PERPLEXITY_API_KEY,
            settings.ANTHROPIC_API_KEY
        ])
        response_dict["api_keys_available"] = api_keys_available
        
        return response_dict
    
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthResponse(
            status="unhealthy",
            version="1.0.0",
            timestamp=datetime.now()
        ) 