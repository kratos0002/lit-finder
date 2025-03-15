import pytest
from fastapi.testclient import TestClient
import json
from unittest.mock import patch, MagicMock

from app.main import app
from app.models.schemas import RecommendationRequest

client = TestClient(app)

# Mark all tests in this file as unit tests
pytestmark = pytest.mark.unit

# Sample test data
sample_recommendation_request = {
    "user_id": "test_user_123",
    "search_term": "three body problem",
    "history": ["science fiction", "cosmic horror"],
    "feedback": [
        {"category": "science fiction", "rating": "positive"},
        {"category": "romance", "rating": "negative"}
    ]
}

sample_book = {
    "title": "The Three-Body Problem",
    "author": "Liu Cixin",
    "match_score": 0.95,
    "summary": "Set against the backdrop of China's Cultural Revolution, a secret military project sends signals into space to establish contact with aliens.",
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

# Mock response from recommendation engine
mock_recommendation_response = {
    "top_book": sample_book,
    "top_review": sample_review,
    "top_social": sample_social,
    "recommendations": [sample_book],
    "insights": {},
    "literary_analysis": {},
    "metadata": {
        "search_term": "three body problem",
        "total_results": 1,
        "processing_time_ms": 1234.56,
        "timestamp": "2025-03-15T12:34:56.789",
        "duplicates_removed": 0
    }
}

@pytest.mark.asyncio
@patch('app.services.recommendation_engine.RecommendationEngine.get_recommendations')
@patch('app.services.stats_service.StatsService.record_request')
async def test_recommendations_endpoint(mock_record_request, mock_get_recommendations):
    """Test the recommendations endpoint with valid data."""
    # Set up mocks
    mock_get_recommendations.return_value = mock_recommendation_response
    mock_record_request.return_value = None
    
    # Make request
    response = client.post("/api/recommendations", json=sample_recommendation_request)
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    
    # Verify expected structure
    assert "top_book" in data
    assert "top_review" in data
    assert "top_social" in data
    assert "recommendations" in data
    
    # Verify content
    assert data["top_book"]["title"] == "The Three-Body Problem"
    assert data["top_review"]["source"] == "The New York Times"
    assert data["top_social"]["source"] == "X (Twitter)"
    
    # Verify mock was called
    mock_get_recommendations.assert_called_once()
    args, kwargs = mock_get_recommendations.call_args
    assert kwargs["user_id"] == "test_user_123"
    assert kwargs["search_term"] == "three body problem"

@pytest.mark.asyncio
async def test_recommendations_endpoint_invalid_data():
    """Test the recommendations endpoint with invalid data."""
    # Missing required fields
    invalid_request = {
        "search_term": "three body problem"
        # Missing user_id
    }
    
    response = client.post("/api/recommendations", json=invalid_request)
    
    # Check response
    assert response.status_code == 422  # Validation error
    data = response.json()
    assert "detail" in data

@pytest.mark.asyncio
@patch('app.services.recommendation_engine.RecommendationEngine.get_recommendations')
async def test_recommendations_endpoint_error_handling(mock_get_recommendations):
    """Test error handling in the recommendations endpoint."""
    # Set up mock to raise exception
    mock_get_recommendations.side_effect = Exception("Test error")
    
    # Make request
    response = client.post("/api/recommendations", json=sample_recommendation_request)
    
    # Check response
    assert response.status_code == 500
    data = response.json()
    assert "detail" in data
    assert "Test error" in data["detail"] 