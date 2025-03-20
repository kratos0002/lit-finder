import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
import time
import asyncio
from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
import json
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

@router.post("/recommendations", response_model=RecommendationResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def get_recommendations(
    request: Request,
    recommendation_request: RecommendationRequest, 
    background_tasks: BackgroundTasks,
    tier: str = Query("standard", description="Service tier (fast, standard, or comprehensive)"),
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
    - **tier**: Service tier (fast, standard, or comprehensive)
    
    Returns top book, review, and social media recommendations, along with a list of additional
    book recommendations.
    """
    try:
        logger.info(f"Recommendation request received: {recommendation_request.search_term}, tier: {tier}")
        start_time = time.time()
        
        # Get recommendations with specified tier
        recommendations = await recommendation_engine.get_recommendations(
            user_id=recommendation_request.user_id,
            search_term=recommendation_request.search_term,
            history=recommendation_request.history,
            feedback=recommendation_request.feedback,
            tier=tier
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
            recommendations=recommendations.get("recommendations", []),
            insights=recommendations.get("insights", {}),
            literary_analysis=recommendations.get("literary_analysis")
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

@router.post("/recommendations/stream")
async def get_recommendations_streaming(
    request: Request,
    recommendation_request: RecommendationRequest,
    tier: str = Query("comprehensive", description="Service tier (standard or comprehensive)"),
    recommendation_engine: RecommendationEngine = Depends(get_recommendation_engine),
    stats_service: StatsService = Depends(get_stats_service)
):
    """
    Get recommendations with progressive loading using server-sent events (SSE).
    
    This endpoint streams the recommendations as they become available, starting with
    the fastest results first and then enhancing with additional information.
    
    - **user_id**: Unique identifier for the user
    - **search_term**: User input search term
    - **history** (optional): Previous search terms or interactions
    - **feedback** (optional): User feedback with categories and ratings
    - **tier**: Service tier (standard or comprehensive)
    
    Returns a stream of recommendation results, with each event adding more information.
    """
    start_time = time.time()
    
    async def event_generator():
        try:
            # Create a queue to receive progressive updates
            queue = asyncio.Queue()
            
            # Define callback for progressive updates
            async def progress_callback(data, final=False):
                await queue.put((data, final))
            
            # Attach the callback to the current task
            current_task = asyncio.current_task()
            setattr(current_task, "progressive_handler", progress_callback)
            
            # Start the recommendation process
            logger.info(f"Starting streaming recommendations for: {recommendation_request.search_term}")
            
            # Launch the recommendation process in a separate task
            recommendation_task = asyncio.create_task(
                recommendation_engine.get_recommendations(
                    user_id=recommendation_request.user_id,
                    search_term=recommendation_request.search_term,
                    history=recommendation_request.history,
                    feedback=recommendation_request.feedback,
                    tier=tier,
                    progressive=True
                )
            )
            
            # Stream results as they become available
            while True:
                data, final = await queue.get()
                
                # Prepare the event data
                event_data = {
                    "data": data,
                    "metadata": {
                        "timestamp": datetime.now().isoformat(),
                        "final": final
                    }
                }
                
                # Send the event
                yield json.dumps(event_data)
                
                # If this is the final event, break the loop
                if final:
                    break
            
            # Log completion
            processing_time = time.time() - start_time
            logger.info(f"Streaming recommendation completed in {processing_time:.2f}s")
            
            # Record stats
            await stats_service.record_request(
                recommendation_request.user_id,
                recommendation_request.search_term,
                processing_time
            )
            
        except Exception as e:
            logger.error(f"Error in streaming recommendations: {e}")
            # Send error event
            yield json.dumps({
                "error": str(e),
                "metadata": {
                    "timestamp": datetime.now().isoformat(),
                    "final": True
                }
            })
    
    return EventSourceResponse(event_generator())

# Update the existing get_recommendations endpoint to use personalization
@router.post("/")
async def get_recommendations_v1(
    user_id: str,
    search_term: str,
    max_results: int = 10,
    tier: str = Query("standard", description="Service tier (fast, standard, or comprehensive)")
) -> List[Dict[str, Any]]:
    """Get personalized book recommendations"""
    try:
        # Get base recommendations
        recommendations = await recommendation_engine.get_recommendations(
            user_id=user_id,
            search_term=search_term,
            tier=tier
        )

        # Extract just the recommendations array for backwards compatibility
        return recommendations.get("recommendations", [])[:max_results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 