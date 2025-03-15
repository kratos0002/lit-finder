import logging
import json
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import hashlib
import random

from app.core.config import settings
from app.services.perplexity_service import PerplexityService
from app.services.openai_service import OpenAIService
from app.services.claude_service import ClaudeService
from app.services.database_service import DatabaseService
from app.services.cache import cached

logger = logging.getLogger(__name__)

class RecommendationEngine:
    """Core recommendation engine that combines all services."""
    
    def __init__(self):
        """Initialize the recommendation engine."""
        self.perplexity_service = PerplexityService()
        self.openai_service = OpenAIService()
        self.claude_service = ClaudeService()
        self.database_service = DatabaseService()
    
    @cached("recommendation_engine")
    async def get_recommendations(
        self, 
        user_id: str, 
        search_term: str, 
        history: Optional[List[str]] = None, 
        feedback: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Get recommendations using the hybrid approach.
        
        Args:
            user_id: The user ID.
            search_term: The search term.
            history: Optional list of previous search terms.
            feedback: Optional list of user feedback items.
            
        Returns:
            Dictionary with recommendations.
        """
        logger.info(f"Getting recommendations for user {user_id} with search term: {search_term}")
        start_time = datetime.now()
        
        try:
            # Step 1: Get initial recommendations from Perplexity
            book_items, review_items, social_items = await self.perplexity_service.get_initial_recommendations(search_term)
            logger.info(f"Retrieved initial recommendations: {len(book_items)} books, {len(review_items)} reviews, {len(social_items)} social posts")
            
            # Step 2: Search additional books from databases
            additional_books = await self.database_service.search_additional_books(search_term)
            logger.info(f"Retrieved {len(additional_books)} additional books from databases")
            
            # Combine all book items
            all_book_items = book_items + additional_books
            
            # Step 3: Deduplicate books
            deduplicated_books, removed_count = self._deduplicate_items(all_book_items)
            logger.info(f"Deduplicated books: {len(deduplicated_books)} unique items, {removed_count} duplicates removed")
            
            # Step 4: Enhance with Claude to infer categories
            categorized_books = await self.claude_service.infer_categories(deduplicated_books)
            logger.info(f"Inferred categories for books")
            
            # Step 5: Refine with OpenAI semantic analysis
            refined_books = await self.openai_service.analyze_semantic_match(search_term, categorized_books)
            logger.info(f"Refined books with semantic analysis")
            
            # Step 6: Cross-validate with user feedback if available
            if feedback:
                validated_books = await self.openai_service.cross_validate_with_user_feedback(
                    search_term, refined_books, feedback
                )
                logger.info(f"Cross-validated books with user feedback")
            else:
                validated_books = refined_books
            
            # Step 7: Cross-validate with Claude for accuracy
            final_books = await self.claude_service.cross_validate_recommendations(search_term, validated_books)
            logger.info(f"Cross-validated books for accuracy")
            
            # Step 8: Enrich with database metadata
            enriched_books = await self.database_service.enrich_recommendations(search_term, final_books)
            logger.info(f"Enriched books with database metadata")
            
            # Step 9: Ensure diversity
            diverse_books = self._ensure_diversity(enriched_books)
            logger.info(f"Ensured diversity: final recommendation set has {len(diverse_books)} books")
            
            # Step 10: Get contextual insights from Claude
            insights = await self.claude_service.generate_contextual_insights(search_term, diverse_books[:5])
            logger.info(f"Generated contextual insights for recommendations")
            
            # Step 11: Rank and select top items
            sorted_books = sorted(diverse_books, key=lambda x: x.get("match_score", 0), reverse=True)
            top_book = sorted_books[0] if sorted_books else None
            
            # Sort reviews and social items by relevance
            sorted_reviews = sorted(review_items, key=lambda x: random.random(), reverse=True)  # Randomize for now (would use a proper scoring model)
            sorted_social = sorted(social_items, key=lambda x: random.random(), reverse=True)
            
            top_review = sorted_reviews[0] if sorted_reviews else None
            top_social = sorted_social[0] if sorted_social else None
            
            # Step 12: Get literary analysis
            literary_analysis = await self.perplexity_service.get_literary_analysis(search_term)
            logger.info(f"Retrieved literary analysis")
            
            # Build final response
            response = {
                "top_book": top_book,
                "top_review": top_review,
                "top_social": top_social,
                "recommendations": sorted_books[:settings.MAX_RECOMMENDATIONS],
                "insights": insights,
                "literary_analysis": literary_analysis,
                "metadata": {
                    "search_term": search_term,
                    "total_results": len(sorted_books),
                    "processing_time_ms": (datetime.now() - start_time).total_seconds() * 1000,
                    "timestamp": datetime.now().isoformat(),
                    "duplicates_removed": removed_count
                }
            }
            
            logger.info(f"Recommendations generated in {(datetime.now() - start_time).total_seconds():.2f} seconds")
            return response
        
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            # Return a minimal response in case of error
            return {
                "top_book": None,
                "top_review": None,
                "top_social": None,
                "recommendations": [],
                "metadata": {
                    "error": str(e),
                    "search_term": search_term,
                    "processing_time_ms": (datetime.now() - start_time).total_seconds() * 1000,
                    "timestamp": datetime.now().isoformat()
                }
            }
    
    def _deduplicate_items(self, items: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], int]:
        """
        Deduplicate items based on title and author or unique IDs.
        
        Args:
            items: List of items to deduplicate.
            
        Returns:
            Tuple of (deduplicated_items, removed_count).
        """
        if not items:
            return [], 0
        
        deduplicated = {}
        unique_keys = set()
        removed_count = 0
        
        for item in items:
            # Try to use the ID if available
            item_id = item.get("id")
            
            # If no ID, use title and author
            if not item_id:
                title = item.get("title", "").lower().strip()
                author = item.get("author", "").lower().strip()
                item_key = f"{title}|{author}"
            else:
                item_key = item_id
            
            # Create a hash for keys that might be too long
            if len(item_key) > 100:
                item_key = hashlib.md5(item_key.encode()).hexdigest()
            
            if item_key not in unique_keys:
                unique_keys.add(item_key)
                deduplicated[item_key] = item
            else:
                # If duplicate has a higher match score, replace the existing one
                if item.get("match_score", 0) > deduplicated[item_key].get("match_score", 0):
                    deduplicated[item_key] = item
                removed_count += 1
        
        return list(deduplicated.values()), removed_count
    
    def _ensure_diversity(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Ensure diversity in recommendations by limiting items per author and genre.
        
        Args:
            items: List of items to diversify.
            
        Returns:
            List of diverse items.
        """
        if not items:
            return []
        
        # Sort items by match score
        sorted_items = sorted(items, key=lambda x: x.get("match_score", 0), reverse=True)
        
        # Track authors and genres
        author_counts = {}
        genre_counts = {}
        diverse_items = []
        
        for item in sorted_items:
            # Extract author and genre
            author = item.get("author", "").lower().strip()
            genre = item.get("genre", "unknown").lower().strip()
            
            # Initialize counts if needed
            author_counts[author] = author_counts.get(author, 0)
            genre_counts[genre] = genre_counts.get(genre, 0)
            
            # Check if we should include this item
            if (author_counts[author] < settings.MAX_ITEMS_PER_AUTHOR and 
                genre_counts[genre] < settings.MAX_ITEMS_PER_GENRE):
                diverse_items.append(item)
                author_counts[author] += 1
                genre_counts[genre] += 1
            
            # Stop once we have enough items
            if len(diverse_items) >= settings.MAX_RECOMMENDATIONS:
                break
        
        return diverse_items 