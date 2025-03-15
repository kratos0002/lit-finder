import os
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock

from app.services.openai_service import OpenAIService
from app.services.perplexity_service import PerplexityService


@pytest.fixture
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


def using_real_apis():
    """Check if real APIs should be used for testing."""
    return os.environ.get("USE_REAL_APIS", "false").lower() == "true"


@pytest.fixture
def openai_service():
    """Provide an OpenAI service, either real or mocked based on environment."""
    if using_real_apis():
        # Use real API
        return OpenAIService()
    else:
        # Use mock
        mock_service = AsyncMock(spec=OpenAIService)
        mock_service.analyze_semantic_match.return_value = [
            {
                "title": "The Three-Body Problem",
                "author": "Liu Cixin",
                "match_score": 0.95,
                "summary": "Set against the backdrop of China's Cultural Revolution...",
                "category": "Novel",
                "id": "goodreads:7113284"
            }
        ]
        return mock_service


@pytest.fixture
def perplexity_service():
    """Provide a Perplexity service, either real or mocked based on environment."""
    if using_real_apis():
        # Use real API
        return PerplexityService()
    else:
        # Use mock
        mock_service = AsyncMock(spec=PerplexityService)
        
        # Sample book, review, and social items for mock response
        sample_book = {
            "title": "The Three-Body Problem",
            "author": "Liu Cixin",
            "match_score": 0.95,
            "summary": "Set against the backdrop of China's Cultural Revolution...",
            "category": "Novel",
            "id": "goodreads:7113284"
        }
        
        sample_review = {
            "title": "The Three-Body Problem: A Game-Changing Sci-Fi Novel",
            "source": "The New York Times",
            "date": "2023-09-15",
            "summary": "An excellent review of Liu Cixin's groundbreaking novel...",
            "url": "https://nytimes.com/review/three-body-problem"
        }
        
        sample_social = {
            "title": "Thread on Three-Body Problem's Scientific Concepts",
            "source": "X (Twitter)",
            "date": "2025-02-28",
            "summary": "An insightful thread discussing the scientific concepts in The Three-Body Problem...",
            "url": "https://x.com/sciencefiction/status/123456789"
        }
        
        mock_service.get_initial_recommendations.return_value = (
            [sample_book], [sample_review], [sample_social]
        )
        
        return mock_service


# Sample data fixtures
@pytest.fixture
def sample_book_items():
    return [
        {
            "title": "The Three-Body Problem",
            "author": "Liu Cixin",
            "match_score": 0.8,
            "summary": "Set against the backdrop of China's Cultural Revolution...",
            "category": "Science Fiction",
            "id": "goodreads:7113284"
        },
        {
            "title": "Project Hail Mary",
            "author": "Andy Weir",
            "match_score": 0.75,
            "summary": "A lone astronaut must save the earth from disaster...",
            "category": "Science Fiction",
            "id": "goodreads:54493401"
        }
    ]


@pytest.fixture
def sample_recommendation_request():
    return {
        "user_id": "test_user_123",
        "search_term": "hard science fiction",
        "history": ["science fiction", "cosmic horror"],
        "feedback": [
            {"category": "science fiction", "rating": "positive"},
            {"category": "romance", "rating": "negative"}
        ]
    } 