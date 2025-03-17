import json
from typing import List, Dict, Tuple, Any, Optional
import httpx
import logging
import asyncio

logger = logging.getLogger(__name__)

class PerplexityService:
    def __init__(self, api_key: str = None, timeout: int = 30):
        self.api_key = api_key
        self.timeout = timeout
        self.api_url = "https://api.perplexity.ai/chat/completions"

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
                
                # Define prompts for books, reviews, and social recommendations
                book_prompt = {
                    "model": "sonar",  # Use sonar, not sonar-2
                    "messages": [
                        {
                            "role": "system",
                            "content": """You are a book recommendation expert. Provide detailed book recommendations related to the user's query.
                            Return a JSON array of books with these fields for each book:
                            - title: The book title
                            - author: The author's name
                            - summary: A brief summary of the book
                            - category: The book's main category/genre
                            - match_score: A number between 0 and 1 indicating relevance
                            - id: A unique identifier (can be made up for mock data, e.g. 'book-1')
                            
                            Return 3-5 books. Format as a valid JSON array only, with no additional text."""
                        },
                        {
                            "role": "user",
                            "content": f"Recommend books related to: {search_term}"
                        }
                    ],
                    "temperature": 0.5,
                    "max_tokens": 1500
                }
                
                review_prompt = {
                    "model": "sonar",  # Use sonar, not sonar-2
                    "messages": [
                        {
                            "role": "system",
                            "content": """You are a literary review expert. Provide book review recommendations related to the user's query.
                            Return a JSON array of reviews with these fields for each review:
                            - title: The review title
                            - source: The source of the review (publication name)
                            - date: Publication date of the review
                            - summary: A brief summary of the review content
                            - link: A link to the review (can be fictional for mock data)
                            
                            Return 2-3 reviews. Format as a valid JSON array only, with no additional text."""
                        },
                        {
                            "role": "user",
                            "content": f"Find reviews related to: {search_term}"
                        }
                    ],
                    "temperature": 0.5,
                    "max_tokens": 1000
                }
                
                social_prompt = {
                    "model": "sonar",  # Use sonar, not sonar-2
                    "messages": [
                        {
                            "role": "system",
                            "content": """You are a social media expert. Provide social media discussions related to the user's literary query.
                            Return a JSON array of social media posts with these fields for each post:
                            - title: The post title or main topic
                            - source: The platform (X, Reddit, etc.)
                            - date: Post date
                            - summary: A brief summary of the post content
                            - link: A link to the post (can be fictional for mock data)
                            
                            Return 2-3 posts. Format as a valid JSON array only, with no additional text."""
                        },
                        {
                            "role": "user",
                            "content": f"Find social media discussions about: {search_term}"
                        }
                    ],
                    "temperature": 0.5,
                    "max_tokens": 1000
                }
                
                # Make concurrent API requests
                tasks = [
                    self._make_api_request(client, headers, book_prompt),
                    self._make_api_request(client, headers, review_prompt),
                    self._make_api_request(client, headers, social_prompt)
                ]
                
                responses = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Process responses
                book_items = []
                review_items = []
                social_items = []
                
                # Process book recommendations
                if isinstance(responses[0], Exception) or not responses[0]:
                    logger.error(f"Error getting book recommendations: {responses[0] if isinstance(responses[0], Exception) else 'Empty response'}")
                else:
                    try:
                        content = responses[0].get("choices", [{}])[0].get("message", {}).get("content", "[]")
                        book_items = json.loads(content)
                        logger.info(f"Retrieved {len(book_items)} book recommendations from Perplexity")
                    except (json.JSONDecodeError, KeyError, IndexError) as e:
                        logger.error(f"Error parsing book recommendations: {e}")
                
                # Process review recommendations
                if isinstance(responses[1], Exception) or not responses[1]:
                    logger.error(f"Error getting review recommendations: {responses[1] if isinstance(responses[1], Exception) else 'Empty response'}")
                else:
                    try:
                        content = responses[1].get("choices", [{}])[0].get("message", {}).get("content", "[]")
                        review_items = json.loads(content)
                        logger.info(f"Retrieved {len(review_items)} review recommendations from Perplexity")
                    except (json.JSONDecodeError, KeyError, IndexError) as e:
                        logger.error(f"Error parsing review recommendations: {e}")
                
                # Process social media recommendations
                if isinstance(responses[2], Exception) or not responses[2]:
                    logger.error(f"Error getting social media recommendations: {responses[2] if isinstance(responses[2], Exception) else 'Empty response'}")
                else:
                    try:
                        content = responses[2].get("choices", [{}])[0].get("message", {}).get("content", "[]")
                        social_items = json.loads(content)
                        logger.info(f"Retrieved {len(social_items)} social media recommendations from Perplexity")
                    except (json.JSONDecodeError, KeyError, IndexError) as e:
                        logger.error(f"Error parsing social media recommendations: {e}")
                
                # If any of the responses are empty, log a warning
                if not book_items:
                    logger.warning("No book recommendations retrieved from Perplexity API")
                if not review_items:
                    logger.warning("No review recommendations retrieved from Perplexity API")
                if not social_items:
                    logger.warning("No social media recommendations retrieved from Perplexity API")
                
                return book_items, review_items, social_items
        
        except Exception as e:
            logger.error(f"Error in Perplexity API service: {e}")
            return [], [], []

    async def _make_api_request(self, client: httpx.AsyncClient, headers: Dict[str, str], data: Dict[str, Any]) -> Dict[str, Any]:
        """Make a request to the Perplexity API."""
        try:
            # Log important details for debugging
            logger.info(f"Making API request to {self.api_url}")
            logger.info(f"API Key prefix: {self.api_key[:5]}... (length: {len(self.api_key)})")
            logger.info(f"Using model: {data.get('model', 'unknown')}")
            
            response = await client.post(self.api_url, headers=headers, json=data)
            logger.info(f"Response status: {response.status_code}")
            
            response.raise_for_status()
            json_data = response.json()
            
            # If we got a valid response, log a snippet of it
            if json_data:
                logger.info("Received valid JSON response from Perplexity API")
            
            return json_data
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error from Perplexity API: {e} - Status: {e.response.status_code}")
            logger.error(f"Response text: {e.response.text}")
            return {}  # Return empty dict instead of raising
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding JSON response: {e}")
            return {}
        except Exception as e:
            logger.error(f"Error making Perplexity API request: {e}")
            return {}  # Return empty dict instead of raising

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
            return self._generate_mock_literary_analysis(search_term)
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                
                analysis_prompt = {
                    "model": "sonar",  # Use sonar, not sonar-2
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
                        return self._generate_mock_literary_analysis(search_term)
                
                logger.warning(f"Empty response from literary analysis API for {search_term}, using mock data")
                return self._generate_mock_literary_analysis(search_term)
        
        except Exception as e:
            logger.error(f"Error getting literary analysis: {e}")
            return self._generate_mock_literary_analysis(search_term)

    def _generate_mock_literary_analysis(self, search_term: str) -> Dict[str, Any]:
        """Generate mock literary analysis for testing."""
        logger.info(f"Generating mock literary analysis for {search_term}")
        return {
            "themes": [
                f"Identity in {search_term}",
                f"Power dynamics in {search_term}",
                f"Transformation and {search_term}"
            ],
            "genres": [
                "Contemporary Fiction",
                "Literary Fiction"
            ],
            "related_subjects": [
                f"{search_term} and society",
                f"{search_term} in historical context",
                f"Modern perspectives on {search_term}"
            ],
            "key_authors": [
                "Classic Authors",
                "Contemporary Voices",
                "Emerging Writers"
            ],
            "time_periods": [
                "20th Century",
                "Contemporary"
            ],
            "analysis": f"{search_term} represents a rich area of literary exploration. The concept has evolved significantly over time, reflecting changing social and cultural contexts while maintaining core themes of human experience and understanding.",
            "source": "mock"
        } 