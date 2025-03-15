import logging
import json
from typing import List, Dict, Any, Optional, Tuple
import httpx
import asyncio

from app.core.config import settings
from app.services.cache import cached

logger = logging.getLogger(__name__)

class PerplexityService:
    """Service for interacting with Perplexity API (sonar model)."""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize Perplexity service."""
        self.api_key = api_key or settings.PERPLEXITY_API_KEY
        if not self.api_key:
            logger.warning("Perplexity API key not provided. This service will not function.")
        self.model = settings.PERPLEXITY_MODEL
        self.api_url = "https://api.perplexity.ai/chat/completions"
        self.timeout = httpx.Timeout(settings.REQUEST_TIMEOUT)
    
    @cached("perplexity_recommendations")
    async def get_initial_recommendations(self, search_term: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Get initial book recommendations from Perplexity API.
        
        Args:
            search_term: The search term to search for.
            
        Returns:
            Tuple of (book_items, review_items, social_items)
        """
        if not self.api_key:
            logger.error("Perplexity API key not set. Cannot get recommendations.")
            return [], [], []
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                
                # First, get book recommendations
                books_prompt = {
                    "model": self.model,
                    "messages": [
                        {
                            "role": "system",
                            "content": """You are a literary recommendation expert providing detailed, specific book recommendations. 
                            Return a JSON array of 5-8 relevant books, including less-known and newer books when possible.
                            For each book include:
                            - title (string): The book title
                            - author (string): The author's name
                            - match_score (float between 0.0-1.0): How well it matches the query
                            - summary (string): 2-3 sentence description
                            - category (string): The category (Novel, Short Story, Academic Paper, etc.)
                            - id (string): A made-up but realistic identifier (e.g., "goodreads:7113284")
                            
                            Ensure recommendations are diverse in theme and style while remaining relevant.
                            Your response should be a valid JSON array only, with no additional text."""
                        },
                        {
                            "role": "user",
                            "content": f"Recommend books related to: {search_term}"
                        }
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1500
                }
                
                # Second, get review recommendations
                reviews_prompt = {
                    "model": self.model,
                    "messages": [
                        {
                            "role": "system",
                            "content": """You are a literary recommendation expert providing detailed, specific article or review recommendations.
                            Return a JSON array of 3-5 relevant reviews or articles from reputable sources.
                            For each review include:
                            - title (string): The review title
                            - source (string): Where it was published (e.g., "New York Times")
                            - date (string): Publication date in YYYY-MM-DD format
                            - summary (string): 2-3 sentence description of the review
                            - url (string): A realistic URL to the review
                            
                            Ensure the reviews are diverse in perspective while remaining relevant.
                            Your response should be a valid JSON array only, with no additional text."""
                        },
                        {
                            "role": "user",
                            "content": f"Find reviews or articles related to: {search_term}"
                        }
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1000
                }
                
                # Third, get social media recommendations
                social_prompt = {
                    "model": self.model,
                    "messages": [
                        {
                            "role": "system",
                            "content": """You are a social media expert providing detailed, specific social media post recommendations.
                            Return a JSON array of 3-5 relevant social media posts from platforms like X (Twitter), Reddit, etc.
                            For each post include:
                            - title (string): A descriptive title for the post
                            - source (string): The platform (e.g., "X (Twitter)", "Reddit")
                            - date (string): Publication date in YYYY-MM-DD format (within the last year)
                            - summary (string): 2-3 sentence description of the post
                            - url (string): A realistic URL to the post
                            
                            Ensure the posts are insightful and from different platforms.
                            Your response should be a valid JSON array only, with no additional text."""
                        },
                        {
                            "role": "user",
                            "content": f"Find social media posts about: {search_term}"
                        }
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1000
                }
                
                # Execute all requests concurrently
                responses = await asyncio.gather(
                    self._make_api_request(client, headers, books_prompt),
                    self._make_api_request(client, headers, reviews_prompt),
                    self._make_api_request(client, headers, social_prompt),
                    return_exceptions=True
                )
                
                # Process responses
                book_items = []
                review_items = []
                social_items = []
                
                # Process book recommendations
                if isinstance(responses[0], Exception):
                    logger.error(f"Error getting book recommendations: {responses[0]}")
                else:
                    try:
                        content = responses[0].get("choices", [{}])[0].get("message", {}).get("content", "[]")
                        book_items = json.loads(content)
                        logger.info(f"Retrieved {len(book_items)} book recommendations from Perplexity")
                    except (json.JSONDecodeError, KeyError, IndexError) as e:
                        logger.error(f"Error parsing book recommendations: {e}")
                
                # Process review recommendations
                if isinstance(responses[1], Exception):
                    logger.error(f"Error getting review recommendations: {responses[1]}")
                else:
                    try:
                        content = responses[1].get("choices", [{}])[0].get("message", {}).get("content", "[]")
                        review_items = json.loads(content)
                        logger.info(f"Retrieved {len(review_items)} review recommendations from Perplexity")
                    except (json.JSONDecodeError, KeyError, IndexError) as e:
                        logger.error(f"Error parsing review recommendations: {e}")
                
                # Process social media recommendations
                if isinstance(responses[2], Exception):
                    logger.error(f"Error getting social media recommendations: {responses[2]}")
                else:
                    try:
                        content = responses[2].get("choices", [{}])[0].get("message", {}).get("content", "[]")
                        social_items = json.loads(content)
                        logger.info(f"Retrieved {len(social_items)} social media recommendations from Perplexity")
                    except (json.JSONDecodeError, KeyError, IndexError) as e:
                        logger.error(f"Error parsing social media recommendations: {e}")
                
                return book_items, review_items, social_items
        
        except Exception as e:
            logger.error(f"Error in Perplexity API service: {e}")
            return [], [], []
    
    @cached("perplexity_literary_analysis")
    async def get_literary_analysis(self, search_term: str) -> Dict[str, Any]:
        """
        Get literary analysis for a search term.
        
        Args:
            search_term: The search term to analyze.
            
        Returns:
            Dictionary with literary analysis information.
        """
        if not self.api_key:
            logger.error("Perplexity API key not set. Cannot get literary analysis.")
            return {}
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                
                analysis_prompt = {
                    "model": self.model,
                    "messages": [
                        {
                            "role": "system",
                            "content": """You are a literary analysis expert providing detailed thematic and stylistic analysis.
                            Analyze the literary work, theme, or subject in the query and return a JSON object with:
                            - themes (array of strings): 3-5 key themes 
                            - genres (array of strings): 2-3 primary genres
                            - related_subjects (array of strings): 3-5 related literary subjects
                            - key_authors (array of strings): 3-5 key authors in this area
                            - time_periods (array of strings): Relevant literary time periods
                            - analysis (string): 3-4 sentence critical analysis
                            
                            Your response should be a valid JSON object only, with no additional text."""
                        },
                        {
                            "role": "user",
                            "content": f"Provide literary analysis for: {search_term}"
                        }
                    ],
                    "temperature": 0.5,
                    "max_tokens": 1000
                }
                
                response = await self._make_api_request(client, headers, analysis_prompt)
                
                if response:
                    try:
                        content = response.get("choices", [{}])[0].get("message", {}).get("content", "{}")
                        analysis_data = json.loads(content)
                        logger.info(f"Retrieved literary analysis for {search_term}")
                        return analysis_data
                    except (json.JSONDecodeError, KeyError, IndexError) as e:
                        logger.error(f"Error parsing literary analysis: {e}")
                
                return {}
        
        except Exception as e:
            logger.error(f"Error getting literary analysis: {e}")
            return {}
    
    async def _make_api_request(self, client: httpx.AsyncClient, headers: Dict[str, str], data: Dict[str, Any]) -> Dict[str, Any]:
        """Make a request to the Perplexity API."""
        try:
            response = await client.post(self.api_url, headers=headers, json=data)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error from Perplexity API: {e}")
            raise e
        except Exception as e:
            logger.error(f"Error making Perplexity API request: {e}")
            raise e 