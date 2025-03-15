import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
import time

from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
from pydantic import ValidationError

from app.models.schemas import RecommendationRequest, RecommendationResponse, ErrorResponse
from app.services.recommendation_engine import RecommendationEngine
from app.services.stats_service import StatsService

logger = logging.getLogger(__name__)

router = APIRouter()

# Dependency to get recommendation engine
def get_recommendation_engine():
    """Dependency to get recommendation engine."""
    return RecommendationEngine()

# Dependency to get stats service
def get_stats_service():
    """Dependency to get stats service."""
    return StatsService()

@router.post("/recommendations", response_model=RecommendationResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def get_recommendations(
    request: Request,
    recommendation_request: RecommendationRequest, 
    background_tasks: BackgroundTasks,
    recommendation_engine: RecommendationEngine = Depends(get_recommendation_engine),
    stats_service: StatsService = Depends(get_stats_service)
):
    """
    Get book, literature, and reading recommendations based on search term.
    
    This endpoint combines recommendations from multiple AI models and databases to provide
    intelligent, diverse, and personalized recommendations.
    
    - **user_id**: Unique identifier for the user
    - **search_term**: User input search term
    - **history** (optional): Previous search terms or interactions
    - **feedback** (optional): User feedback with categories and ratings
    
    Returns top book, review, and social media recommendations, along with a list of additional
    book recommendations.
    """
    try:
        logger.info(f"Recommendation request received: {recommendation_request.search_term}")
        start_time = time.time()
        
        # Get recommendations
        recommendations = await recommendation_engine.get_recommendations(
            user_id=recommendation_request.user_id,
            search_term=recommendation_request.search_term,
            history=recommendation_request.history,
            feedback=recommendation_request.feedback
        )
        
        # Record stats in background
        processing_time = time.time() - start_time
        background_tasks.add_task(
            stats_service.record_request,
            recommendation_request.user_id,
            recommendation_request.search_term,
            processing_time
        )
        
        logger.info(f"Recommendation request completed in {processing_time:.2f}s")
        
        # Prepare response
        response = RecommendationResponse(
            top_book=recommendations.get("top_book"),
            top_review=recommendations.get("top_review"),
            top_social=recommendations.get("top_social"),
            recommendations=recommendations.get("recommendations", [])
        )
        
        return response
    
    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid request data: {str(e)}"
        )
    
    except Exception as e:
        logger.error(f"Error processing recommendation request: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing recommendation: {str(e)}"
        ) 