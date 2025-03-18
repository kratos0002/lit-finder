import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
import time

from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
from pydantic import ValidationError, BaseModel

from app.models.schemas import RecommendationRequest, RecommendationResponse, ErrorResponse
from app.services.recommendation_engine import RecommendationEngine, recommendation_engine
from app.services.stats_service import StatsService
from app.core.config import settings

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

class SaveBookRequest(BaseModel):
    user_id: str
    book_id: str

class UserFeedbackRequest(BaseModel):
    user_id: str
    feedback_type: str
    message: str
    book_id: str = None

@router.get("/saved/{user_id}")
async def get_saved_books(user_id: str) -> List[Dict[str, Any]]:
    """Get all books saved by a user"""
    try:
        saved_books = await recommendation_engine.get_user_saved_books(user_id)
        return saved_books
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save")
async def save_book(request: SaveBookRequest) -> Dict[str, Any]:
    """Save a book to a user's collection"""
    try:
        success = await recommendation_engine.save_book_for_user(
            user_id=request.user_id,
            book_id=request.book_id
        )
        if success:
            return {"status": "success", "message": "Book saved successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to save book")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/feedback")
async def save_feedback(request: UserFeedbackRequest) -> Dict[str, Any]:
    """Save user feedback for improving recommendations"""
    try:
        success = await recommendation_engine.save_user_feedback(
            user_id=request.user_id,
            feedback_type=request.feedback_type,
            message=request.message,
            book_id=request.book_id
        )
        if success:
            return {"status": "success", "message": "Feedback saved successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to save feedback")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Update the existing get_recommendations endpoint to use personalization
@router.post("/")
async def get_recommendations(
    user_id: str,
    search_term: str,
    max_results: int = 10
) -> List[Dict[str, Any]]:
    """Get personalized book recommendations"""
    try:
        # Get base recommendations
        base_results = await recommendation_engine.get_recommendations(
            search_term=search_term,
            max_results=max_results
        )

        # Store search results for personalization
        await recommendation_engine.store_search_results(
            user_id=user_id,
            search_term=search_term,
            results=base_results
        )

        # Get personalized recommendations
        personalized_results = await recommendation_engine.get_personalized_recommendations(
            user_id=user_id,
            search_term=search_term,
            base_results=base_results
        )

        return personalized_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recommendations", response_model=RecommendationResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def get_recommendations_old(
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