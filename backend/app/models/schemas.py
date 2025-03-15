from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class Rating(str, Enum):
    """Rating classification for user feedback."""
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


class FeedbackItem(BaseModel):
    """User feedback item with category and rating."""
    category: str = Field(..., min_length=1, description="Category for feedback (e.g., 'science fiction')")
    rating: Rating = Field(..., description="Rating for this category")


class RecommendationRequest(BaseModel):
    """Request model for recommendations API."""
    user_id: str = Field(..., min_length=1, description="Unique identifier for the user")
    search_term: str = Field(..., min_length=1, description="User input search term")
    history: Optional[List[str]] = Field(default=None, description="Previous search terms or interactions")
    feedback: Optional[List[FeedbackItem]] = Field(default=None, description="User feedback with categories and ratings")


class BookItem(BaseModel):
    """Model for a book recommendation."""
    title: str = Field(..., min_length=1, description="Book title")
    author: str = Field(..., min_length=1, description="Book author")
    match_score: float = Field(..., ge=0.0, le=1.0, description="Match score between 0 and 1")
    summary: str = Field(..., min_length=1, description="Book summary")
    category: str = Field(..., min_length=1, description="Book category (e.g., Novel, Paper)")
    id: str = Field(..., min_length=1, description="Unique identifier (e.g., Goodreads ID)")
    
    class Config:
        schema_extra = {
            "example": {
                "title": "The Three-Body Problem",
                "author": "Liu Cixin",
                "match_score": 0.95,
                "summary": "Set against the backdrop of China's Cultural Revolution...",
                "category": "Novel",
                "id": "goodreads:7113284"
            }
        }


class ReviewItem(BaseModel):
    """Model for a review recommendation."""
    title: str = Field(..., min_length=1, description="Review title")
    source: str = Field(..., min_length=1, description="Source of the review")
    date: str = Field(..., min_length=1, description="Publication date of the review")
    summary: str = Field(..., min_length=1, description="Review summary")
    url: HttpUrl = Field(..., description="URL to the review")
    
    class Config:
        schema_extra = {
            "example": {
                "title": "The Three-Body Problem: A Game-Changing Sci-Fi Novel",
                "source": "The New York Times",
                "date": "2023-09-15",
                "summary": "An excellent review of Liu Cixin's groundbreaking novel...",
                "url": "https://nytimes.com/review/three-body-problem"
            }
        }


class SocialItem(BaseModel):
    """Model for a social media recommendation."""
    title: str = Field(..., min_length=1, description="Social media post title/description")
    source: str = Field(..., min_length=1, description="Source platform (e.g., X, Reddit)")
    date: str = Field(..., min_length=1, description="Date of the post")
    summary: str = Field(..., min_length=1, description="Summary of the post")
    url: HttpUrl = Field(..., description="URL to the post")
    
    class Config:
        schema_extra = {
            "example": {
                "title": "Thread on Three-Body Problem's Scientific Concepts",
                "source": "X (Twitter)",
                "date": "2025-02-28",
                "summary": "An insightful thread discussing the scientific concepts in The Three-Body Problem...",
                "url": "https://x.com/sciencefiction/status/123456789"
            }
        }


class RecommendationResponse(BaseModel):
    """Response model for recommendations API."""
    top_book: Optional[BookItem] = Field(None, description="Top book recommendation")
    top_review: Optional[ReviewItem] = Field(None, description="Top review recommendation")
    top_social: Optional[SocialItem] = Field(None, description="Top social media recommendation")
    recommendations: List[BookItem] = Field(default_factory=list, description="List of book recommendations", max_items=10)
    
    class Config:
        schema_extra = {
            "example": {
                "top_book": {
                    "title": "The Three-Body Problem",
                    "author": "Liu Cixin",
                    "match_score": 0.95,
                    "summary": "Set against the backdrop of China's Cultural Revolution...",
                    "category": "Novel",
                    "id": "goodreads:7113284"
                },
                "top_review": {
                    "title": "The Three-Body Problem: A Game-Changing Sci-Fi Novel",
                    "source": "The New York Times",
                    "date": "2023-09-15",
                    "summary": "An excellent review of Liu Cixin's groundbreaking novel...",
                    "url": "https://nytimes.com/review/three-body-problem"
                },
                "top_social": {
                    "title": "Thread on Three-Body Problem's Scientific Concepts",
                    "source": "X (Twitter)",
                    "date": "2025-02-28",
                    "summary": "An insightful thread discussing the scientific concepts in The Three-Body Problem...",
                    "url": "https://x.com/sciencefiction/status/123456789"
                },
                "recommendations": []  # Abbreviated for clarity
            }
        }


class StatsResponse(BaseModel):
    """Response model for stats API."""
    user_id: str = Field(..., description="User ID for which stats are being returned")
    total_requests: int = Field(..., ge=0, description="Total number of requests made by this user")
    avg_response_time: float = Field(..., ge=0.0, description="Average response time in seconds")
    last_request: Optional[datetime] = Field(None, description="Timestamp of last request")
    top_searches: List[str] = Field([], description="Top search terms used by this user")
    
    class Config:
        schema_extra = {
            "example": {
                "user_id": "user123",
                "total_requests": 42,
                "avg_response_time": 0.328,
                "last_request": "2025-03-15T12:34:56",
                "top_searches": ["three body problem", "cosmic horror", "science fiction"]
            }
        }


class HealthResponse(BaseModel):
    """Response model for health API."""
    status: str = Field(..., description="Service status (healthy/unhealthy)")
    version: str = Field(..., description="API version")
    timestamp: datetime = Field(..., description="Current timestamp")
    
    class Config:
        schema_extra = {
            "example": {
                "status": "healthy",
                "version": "1.0.0",
                "timestamp": "2025-03-15T12:34:56"
            }
        }


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str = Field(..., description="Error message")
    code: int = Field(..., description="HTTP status code")
    timestamp: datetime = Field(..., description="Error timestamp")
    
    class Config:
        schema_extra = {
            "example": {
                "error": "Invalid search term provided",
                "code": 400,
                "timestamp": "2025-03-15T12:34:56"
            }
        } 