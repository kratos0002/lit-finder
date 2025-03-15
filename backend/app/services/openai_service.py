import logging
import json
from typing import List, Dict, Any, Optional
import asyncio
import httpx

from app.core.config import settings
from app.services.cache import cached

logger = logging.getLogger(__name__)

class OpenAIService:
    """Service for interacting with OpenAI API."""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize OpenAI service."""
        self.api_key = api_key or settings.OPENAI_API_KEY
        if not self.api_key:
            logger.warning("OpenAI API key not provided. This service will not function.")
        self.model = settings.OPENAI_MODEL
        self.timeout = httpx.Timeout(settings.REQUEST_TIMEOUT)
        
        # Import openai here to avoid errors if the package is not installed
        try:
            import openai
            self.client = openai.AsyncOpenAI(api_key=self.api_key)
            logger.info("OpenAI client initialized successfully.")
        except ImportError:
            logger.error("OpenAI package not installed. Install it with 'pip install openai'.")
            self.client = None
    
    @cached("openai_semantic_analysis")
    async def analyze_semantic_match(self, search_term: str, book_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyze book items for semantic relevance to the search term.
        
        Args:
            search_term: The search term to match against.
            book_items: List of book items to analyze.
            
        Returns:
            List of book items with updated match_scores.
        """
        if not self.client:
            logger.error("OpenAI client not initialized. Cannot perform semantic analysis.")
            return book_items
        
        try:
            # Format the input for the model
            prompts = []
            for item in book_items:
                prompt = {
                    "role": "system",
                    "content": f"""
                    You are a literary recommendation expert tasked with evaluating how well a book matches a search query.
                    You will analyze the semantic relevance of the book to the search term and adjust the match score.
                    
                    Given a search term: "{search_term}"
                    
                    Book information:
                    Title: {item.get('title', '')}
                    Author: {item.get('author', '')}
                    Summary: {item.get('summary', '')}
                    Category: {item.get('category', '')}
                    
                    Current match score: {item.get('match_score', 0.5)}
                    
                    Analyze how well this book matches the search term semantically:
                    1. Consider thematic relevance
                    2. Consider genre and style alignment
                    3. Consider if the book is directly or indirectly related to the search term
                    
                    Return a JSON object with:
                    1. "score_adjustment": A float between -0.3 and +0.3 to adjust the match score (positive for better matches)
                    2. "explanation": A brief explanation of your adjustment
                    
                    Respond with the JSON object only.
                    """
                }
                prompts.append(prompt)
            
            # Batch requests to the API
            batch_size = 5
            results = []
            
            for i in range(0, len(prompts), batch_size):
                batch_prompts = prompts[i:i+batch_size]
                batch_tasks = []
                
                for prompt in batch_prompts:
                    batch_tasks.append(self._call_openai(prompt))
                
                batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
                results.extend(batch_results)
            
            # Process results and update match scores
            updated_items = []
            for i, item in enumerate(book_items):
                result = results[i]
                if isinstance(result, Exception):
                    logger.error(f"Error analyzing book {item.get('title')}: {str(result)}")
                    updated_items.append(item)
                    continue
                
                try:
                    # Parse the response
                    adjustment_data = json.loads(result)
                    score_adjustment = float(adjustment_data.get("score_adjustment", 0))
                    
                    # Apply the adjustment (ensure it stays within 0-1 range)
                    new_score = item.get("match_score", 0.5) + score_adjustment
                    new_score = max(0.0, min(1.0, new_score))
                    
                    # Create updated item
                    updated_item = item.copy()
                    updated_item["match_score"] = new_score
                    updated_item["semantic_analysis"] = adjustment_data.get("explanation", "")
                    
                    updated_items.append(updated_item)
                    
                except (json.JSONDecodeError, ValueError, KeyError) as e:
                    logger.error(f"Error processing OpenAI response for {item.get('title')}: {e}")
                    updated_items.append(item)
            
            return updated_items
            
        except Exception as e:
            logger.error(f"Error in semantic analysis: {e}")
            return book_items
    
    async def _call_openai(self, prompt: Dict[str, str]) -> str:
        """Call OpenAI API with a prompt."""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[prompt],
                temperature=0.3,
                max_tokens=250,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {e}")
            raise e
    
    @cached("openai_cross_validation")
    async def cross_validate_with_user_feedback(
        self, search_term: str, book_items: List[Dict[str, Any]], user_feedback: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """
        Cross-validate recommendations with user feedback.
        
        Args:
            search_term: The search term to match against.
            book_items: List of book items to validate.
            user_feedback: Optional list of user feedback items.
            
        Returns:
            List of book items with updated match_scores.
        """
        if not user_feedback:
            return book_items
        
        if not self.client:
            logger.error("OpenAI client not initialized. Cannot perform cross-validation.")
            return book_items
        
        try:
            # Format feedback for prompt
            feedback_str = "\n".join([
                f"- {item.get('category', '')}: {item.get('rating', '')}"
                for item in user_feedback
            ])
            
            # Create system prompt
            system_prompt = {
                "role": "system",
                "content": f"""
                You are a literary recommendation expert tasked with cross-validating book recommendations based on user feedback.
                
                User search term: "{search_term}"
                
                User feedback:
                {feedback_str}
                
                Analyze each book and adjust its match score based on how well it aligns with user feedback.
                Consider:
                1. If the book matches categories the user likes (positive feedback)
                2. If the book avoids categories the user dislikes (negative feedback)
                
                For each book, return a JSON object with:
                1. "score_adjustment": A float between -0.3 and +0.3 to adjust the match score
                2. "explanation": A brief explanation of your adjustment
                
                Respond with the JSON object only.
                """
            }
            
            # Process each book
            updated_items = []
            
            for item in book_items:
                book_prompt = {
                    "role": "user",
                    "content": f"""
                    Book information:
                    Title: {item.get('title', '')}
                    Author: {item.get('author', '')}
                    Summary: {item.get('summary', '')}
                    Category: {item.get('category', '')}
                    """
                }
                
                try:
                    response = await self.client.chat.completions.create(
                        model=self.model,
                        messages=[system_prompt, book_prompt],
                        temperature=0.2,
                        max_tokens=250,
                    )
                    
                    response_text = response.choices[0].message.content
                    adjustment_data = json.loads(response_text)
                    
                    score_adjustment = float(adjustment_data.get("score_adjustment", 0))
                    
                    # Apply the adjustment (ensure it stays within 0-1 range)
                    new_score = item.get("match_score", 0.5) + score_adjustment
                    new_score = max(0.0, min(1.0, new_score))
                    
                    # Create updated item
                    updated_item = item.copy()
                    updated_item["match_score"] = new_score
                    updated_item["feedback_analysis"] = adjustment_data.get("explanation", "")
                    
                    updated_items.append(updated_item)
                    
                except Exception as e:
                    logger.error(f"Error cross-validating {item.get('title')}: {e}")
                    updated_items.append(item)
            
            return updated_items
        
        except Exception as e:
            logger.error(f"Error in cross validation: {e}")
            return book_items 