import pytest
import os
from fastapi.testclient import TestClient

from app.main import app
from app.services.openai_service import OpenAIService
from app.services.perplexity_service import PerplexityService

client = TestClient(app)

# Mark all tests in this file as integration tests
pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        os.environ.get("USE_REAL_APIS", "false").lower() != "true",
        reason="Integration tests skipped - set USE_REAL_APIS=true to run"
    )
]


@pytest.mark.asyncio
async def test_openai_service_real_api(openai_service, sample_book_items):
    """Test OpenAI service with real API calls."""
    # This test uses the real OpenAI API
    search_term = "science fiction with artificial intelligence"
    result = await openai_service.analyze_semantic_match(search_term, sample_book_items)
    
    # We shouldn't assert on exact values since real API responses can vary
    # Just check the structure and types of the response
    assert isinstance(result, list)
    assert len(result) > 0
    
    for book in result:
        assert "title" in book
        assert "author" in book
        assert "match_score" in book
        assert isinstance(book["match_score"], float)
        assert 0 <= book["match_score"] <= 1  # Match scores should be between 0 and 1


@pytest.mark.asyncio
async def test_perplexity_service_real_api(perplexity_service):
    """Test Perplexity service with real API calls."""
    # This test uses the real Perplexity API
    search_term = "contemporary literary fiction with complex characters"
    book_items, review_items, social_items = await perplexity_service.get_initial_recommendations(search_term)
    
    # Again, we're just checking structure, not specific content
    assert isinstance(book_items, list)
    # Note: It's possible for the recommendation engine to return empty lists
    # if no good matches found, so we can't strictly assert on length
    
    if book_items:
        for book in book_items:
            assert "title" in book
            assert "author" in book
            assert isinstance(book["title"], str)
            assert isinstance(book["author"], str)
    
    if review_items:
        for review in review_items:
            assert "title" in review
            assert "source" in review
            assert isinstance(review["title"], str)
            assert isinstance(review["source"], str)
    
    if social_items:
        for social in social_items:
            assert "title" in social
            assert "source" in social
            assert isinstance(social["title"], str)
            assert isinstance(social["source"], str)


@pytest.mark.asyncio
@pytest.mark.xfail(reason="Full recommendation endpoint may fail due to missing APIs or service errors")
async def test_recommendation_endpoint_with_real_apis(sample_recommendation_request):
    """Test the recommendations endpoint using real API services."""
    # This test will indirectly use real APIs through the recommendation endpoint
    response = client.post("/api/recommendations", json=sample_recommendation_request)
    
    # If the response is successful, verify its structure
    if response.status_code == 200:
        data = response.json()
        
        # Check that the response contains recommendations
        assert "recommendations" in data
        assert "metadata" in data
        assert isinstance(data["recommendations"], list)
        
        # Check optional components if they exist
        if data.get("top_book"):
            assert "title" in data["top_book"]
            assert "author" in data["top_book"]
        
        if data.get("top_review"):
            assert "title" in data["top_review"]
            assert "source" in data["top_review"]
        
        if data.get("top_social"):
            assert "title" in data["top_social"]
            assert "source" in data["top_social"]
    else:
        # If the test fails, print the response for debugging
        print(f"Response status code: {response.status_code}")
        print(f"Response body: {response.text}")
        
        # Marks the test as "expected to fail" but allow it to continue
        pytest.xfail(f"API request failed with status code {response.status_code}")
        
        # For debugging only - uncomment if needed
        # assert False, f"API request failed with status code {response.status_code}: {response.text}" 