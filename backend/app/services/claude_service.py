import logging
import json
from typing import List, Dict, Any, Optional
import httpx
import asyncio

from app.core.config import settings
from app.services.cache import cached

logger = logging.getLogger(__name__)

class ClaudeService:
    """Service for interacting with Anthropic's Claude API."""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize Claude service."""
        self.api_key = api_key or settings.CLAUDE_API_KEY
        if not self.api_key:
            logger.warning("Claude API key not provided. This service will not function.")
        self.model = settings.CLAUDE_MODEL
        self.api_url = "https://api.anthropic.com/v1/messages"
        self.timeout = httpx.Timeout(settings.REQUEST_TIMEOUT)
        
        # Import anthropic here to avoid errors if the package is not installed
        try:
            import anthropic
            self.client = anthropic.Anthropic(api_key=self.api_key)
            logger.info("Claude client initialized successfully.")
        except ImportError:
            logger.error("Anthropic package not installed. Install it with 'pip install anthropic'.")
            self.client = None
    
    @cached("claude_contextual_insights")
    async def generate_contextual_insights(self, search_term: str, book_items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate contextual insights for book recommendations.
        
        Args:
            search_term: The search term.
            book_items: List of book items.
            
        Returns:
            Dictionary with contextual insights.
        """
        if not self.client:
            logger.error("Claude client not initialized. Cannot generate contextual insights.")
            return {}
        
        try:
            # Format book items for prompt
            books_text = "\n\n".join([
                f"Title: {item.get('title', '')}\n"
                f"Author: {item.get('author', '')}\n"
                f"Category: {item.get('category', '')}\n"
                f"Summary: {item.get('summary', '')}"
                for item in book_items[:5]  # Limit to top 5 books for manageable prompt size
            ])
            
            response = await self._call_claude(f"""
            Based on the search term "{search_term}" and the following book recommendations:
            
            {books_text}
            
            Provide contextual insights in JSON format with the following structure:
            
            {{
                "thematic_connections": [3-5 thematic connections between the recommended books],
                "cultural_context": [2-3 cultural or historical contexts relevant to these recommendations],
                "reading_pathways": [2-3 suggested reading orders or pathways through these books],
                "critical_reception": [2-3 points about how these works have been received critically],
                "academic_relevance": [1-2 points about the academic or scholarly relevance of these works],
                "analysis": "A 2-3 sentence critical analysis of these recommendations as a collection"
            }}
            
            Respond with ONLY the JSON object, no additional text.
            """)
            
            try:
                insights = json.loads(response)
                logger.info(f"Generated contextual insights for {search_term}")
                return insights
            except json.JSONDecodeError:
                logger.error("Failed to parse Claude response as JSON")
                return {}
        
        except Exception as e:
            logger.error(f"Error generating contextual insights: {e}")
            return {}
    
    @cached("claude_categorization")
    async def infer_categories(self, book_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Infer categories for book items.
        
        Args:
            book_items: List of book items.
            
        Returns:
            List of book items with inferred categories.
        """
        if not self.client:
            logger.error("Claude client not initialized. Cannot infer categories.")
            return book_items
        
        # Filter out books that already have detailed categories
        books_to_categorize = []
        for i, item in enumerate(book_items):
            category = item.get("category", "").strip().lower()
            if not category or category in ["book", "unknown", "other"]:
                books_to_categorize.append((i, item))
        
        if not books_to_categorize:
            logger.info("No books need category inference.")
            return book_items
        
        try:
            # Format book items for prompting
            batched_results = []
            batch_size = 3  # Process in smaller batches
            
            for i in range(0, len(books_to_categorize), batch_size):
                batch = books_to_categorize[i:i+batch_size]
                
                books_text = "\n\n".join([
                    f"Book {j+1}:\n"
                    f"Title: {item.get('title', '')}\n"
                    f"Author: {item.get('author', '')}\n"
                    f"Summary: {item.get('summary', '')}"
                    for j, (_, item) in enumerate(batch)
                ])
                
                response = await self._call_claude(f"""
                For each of the following books, infer the most appropriate literary category based on the title, author, and summary.
                
                {books_text}
                
                For each book, provide the category in JSON format with the following structure:
                
                [
                    {{
                        "book_index": 1,
                        "category": "The inferred category (e.g., Novel, Short Story, Poetry, Essay, Academic Paper, Biography, etc.)",
                        "genre": "The primary genre (e.g., Science Fiction, Literary Fiction, Mystery, Romance, etc.)",
                        "explanation": "Brief explanation for this categorization"
                    }},
                    ...
                ]
                
                Be specific and accurate in your categorization. If the book fits multiple categories, choose the most dominant one.
                Respond with ONLY the JSON array, no additional text.
                """)
                
                try:
                    categorizations = json.loads(response)
                    batched_results.extend(categorizations)
                except json.JSONDecodeError:
                    logger.error(f"Failed to parse Claude response as JSON for batch {i}")
            
            # Update the original book items with inferred categories
            updated_book_items = book_items.copy()
            
            for result in batched_results:
                try:
                    book_index = result.get("book_index") - 1  # Adjust for 0-based indexing
                    if 0 <= book_index < len(books_to_categorize):
                        original_index, _ = books_to_categorize[book_index]
                        category = result.get("category", "")
                        genre = result.get("genre", "")
                        
                        updated_item = updated_book_items[original_index].copy()
                        updated_item["category"] = category
                        updated_item["genre"] = genre
                        updated_item["category_explanation"] = result.get("explanation", "")
                        
                        updated_book_items[original_index] = updated_item
                except (KeyError, IndexError, TypeError) as e:
                    logger.error(f"Error updating book with inferred category: {e}")
            
            logger.info(f"Inferred categories for {len(batched_results)} books")
            return updated_book_items
        
        except Exception as e:
            logger.error(f"Error inferring book categories: {e}")
            return book_items
    
    @cached("claude_validation")
    async def cross_validate_recommendations(self, search_term: str, book_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Cross-validate book recommendations for accuracy and relevance.
        
        Args:
            search_term: The search term.
            book_items: List of book items to validate.
            
        Returns:
            List of validated book items with adjusted match scores.
        """
        if not self.client:
            logger.error("Claude client not initialized. Cannot validate recommendations.")
            return book_items
        
        if not book_items:
            return []
        
        try:
            # Format book items for validation
            books_json = json.dumps(book_items, indent=2)
            
            response = await self._call_claude(f"""
            Validate the accuracy and relevance of the following book recommendations for the search term: "{search_term}"
            
            Book recommendations (in JSON format):
            {books_json}
            
            For each book, verify its accuracy (if it's a real book with correct author) and its relevance to the search term.
            Then provide an adjusted match score and validation results in JSON format.
            
            Return a JSON array where each element has the structure:
            
            {{
                "title": "Original book title",
                "author": "Original author name",
                "is_accurate": true/false (is this a real book with correct information?),
                "is_relevant": true/false (is this book relevant to the search term?),
                "adjusted_match_score": float between 0.0-1.0 (adjusted based on validation),
                "validation_notes": "Brief explanation of validation and score adjustment"
            }}
            
            Respond with ONLY the JSON array, no additional text.
            """)
            
            try:
                validation_results = json.loads(response)
                logger.info(f"Cross-validated {len(validation_results)} book recommendations")
                
                # Update the original book items with validation results
                updated_book_items = []
                
                for item in book_items:
                    # Find the corresponding validation result
                    validation = next(
                        (v for v in validation_results 
                         if v.get("title") == item.get("title") and v.get("author") == item.get("author")),
                        None
                    )
                    
                    if validation:
                        updated_item = item.copy()
                        # Update match score if validation provides an adjusted score
                        if "adjusted_match_score" in validation:
                            updated_item["match_score"] = validation["adjusted_match_score"]
                        
                        # Add validation metadata
                        updated_item["is_accurate"] = validation.get("is_accurate", True)
                        updated_item["is_relevant"] = validation.get("is_relevant", True)
                        updated_item["validation_notes"] = validation.get("validation_notes", "")
                        
                        updated_book_items.append(updated_item)
                    else:
                        # If no validation result found, keep the original item
                        updated_book_items.append(item)
                
                return updated_book_items
            
            except json.JSONDecodeError:
                logger.error("Failed to parse Claude validation response as JSON")
                return book_items
        
        except Exception as e:
            logger.error(f"Error validating recommendations: {e}")
            return book_items
    
    async def _call_claude(self, prompt: str) -> str:
        """Call Claude API with a prompt."""
        if not self.client:
            raise ValueError("Claude client not initialized")
        
        try:
            # Use the anthropic client
            response = await asyncio.to_thread(
                self.client.messages.create,
                model=self.model,
                max_tokens=1500,
                temperature=0.2,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            return response.content[0].text
        except Exception as e:
            logger.error(f"Error calling Claude API: {e}")
            raise e 