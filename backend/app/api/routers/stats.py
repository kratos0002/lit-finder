import logging
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, Query

from app.models.schemas import StatsResponse, ErrorResponse
from app.services.stats_service import StatsService

logger = logging.getLogger(__name__)

router = APIRouter()

# Dependency to get stats service
def get_stats_service():
    """Dependency to get stats service."""
    return StatsService()

@router.get("/stats", response_model=StatsResponse, responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def get_user_stats(
    user_id: str = Query(..., description="User ID to get stats for"),
    stats_service: StatsService = Depends(get_stats_service)
):
    """
    Get usage statistics for a specific user.
    
    Returns information including:
    - Total number of requests made by this user
    - Average response time
    - Timestamp of last request
    - Top search terms used by this user
    
    This endpoint is useful for analytics and providing personalized experiences.
    """
    try:
        stats = await stats_service.get_user_stats(user_id)
        
        if not stats:
            raise HTTPException(
                status_code=404,
                detail=f"No stats found for user ID: {user_id}"
            )
        
        # Convert last_request string to datetime if it exists
        if stats.get("last_request"):
            try:
                last_request = datetime.fromisoformat(stats["last_request"])
                stats["last_request"] = last_request
            except (ValueError, TypeError):
                stats["last_request"] = None
        
        return stats
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error retrieving stats for user {user_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving stats: {str(e)}"
        )

@router.get("/stats/global", responses={500: {"model": ErrorResponse}})
async def get_global_stats(
    stats_service: StatsService = Depends(get_stats_service)
):
    """
    Get global service statistics.
    
    Returns information about overall service usage, including:
    - Total number of users
    - Total number of requests
    - Average response time across all requests
    - Service uptime
    
    This endpoint is useful for monitoring overall service usage and performance.
    """
    try:
        stats = await stats_service.get_global_stats()
        return stats
    
    except Exception as e:
        logger.error(f"Error retrieving global stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving global stats: {str(e)}"
        ) 