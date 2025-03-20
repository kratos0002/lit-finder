import logging
import json
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import hashlib
import random

from app.core.config import settings
from app.services.perplexity_service import PerplexityService
from app.services.openai_service import OpenAIService
from app.services.claude_service import ClaudeService
from app.services.database_service import DatabaseService
from app.services.cache import cached
from .supabase_service import supabase_service

logger = logging.getLogger(__name__)

class RecommendationEngine:
    """Core recommendation engine that combines all services."""
    
    def __init__(self):
        """Initialize the recommendation engine."""
        self.perplexity_service = PerplexityService(api_key=settings.PERPLEXITY_API_KEY)
        self.openai_service = OpenAIService()
        self.claude_service = ClaudeService()
        self.database_service = DatabaseService()
        self.supabase = supabase_service
    
    @cached("recommendation_engine")
    async def get_recommendations(
        self, 
        user_id: str, 
        search_term: str, 
        history: Optional[List[str]] = None, 
        feedback: Optional[List[Dict[str, Any]]] = None,
        tier: str = "standard",  # Add tier parameter with default "standard"
        progressive: bool = False  # Add progressive loading parameter
    ) -> Dict[str, Any]:
        """
        Get recommendations using the hybrid approach with tiered response strategy.
        
        Args:
            user_id: The user ID.
            search_term: The search term.
            history: Optional list of previous search terms.
            feedback: Optional list of user feedback items.
            tier: Service tier ("fast", "standard", or "comprehensive")
            progressive: Whether to support progressive loading
            
        Returns:
            Dictionary with recommendations.
        """
        logger.info(f"Getting recommendations for user {user_id} with search term: {search_term}, tier: {tier}")
        start_time = datetime.now()
        
        # Cache key should incorporate user preferences and tier for personalization
        cache_key = f"recommendations:{search_term}:{user_id}:{tier}"
        
        try:
            # Set timeout thresholds based on tier
            timeouts = {
                "fast": 5.0,
                "standard": 15.0, 
                "comprehensive": 40.0
            }.get(tier, 15.0)
            
            # Keep track of the progressive response handler if provided
            self.progressive_handler = getattr(asyncio.current_task(), "progressive_handler", None)
            
            # FAST TIER PROCESSING - Basic book recommendations only
            basic_results = await self._get_basic_recommendations(search_term, user_id)
            
            # If we're in fast tier or have progressive loading, return/send basic results
            if tier == "fast":
                processing_time = (datetime.now() - start_time).total_seconds()
                logger.info(f"Fast tier recommendations generated in {processing_time:.2f} seconds")
                return basic_results
            
            # If progressive loading enabled, send basic results while continuing processing
            if progressive and self.progressive_handler:
                await self.progressive_handler(basic_results, final=False)
                logger.info("Sent progressive partial results")
                
            # STANDARD TIER PROCESSING - Add reviews, social content, basic insights
            if tier in ["standard", "comprehensive"]:
                standard_results = await self._enhance_with_standard_features(
                    basic_results, search_term, user_id, timeouts["standard"]
                )
                
                # If we're in standard tier, return results here
                if tier == "standard":
                    processing_time = (datetime.now() - start_time).total_seconds()
                    logger.info(f"Standard tier recommendations generated in {processing_time:.2f} seconds")
                    return standard_results
                    
                # If progressive loading enabled, send standard results while continuing
                if progressive and self.progressive_handler:
                    await self.progressive_handler(standard_results, final=False)
                    logger.info("Sent progressive standard results")
            
            # COMPREHENSIVE TIER PROCESSING - Add literary analysis and full enrichment
            if tier == "comprehensive":
                comprehensive_results = await self._enhance_with_comprehensive_features(
                    standard_results, search_term, user_id, timeouts["comprehensive"]
                )
                
                processing_time = (datetime.now() - start_time).total_seconds()
                logger.info(f"Comprehensive tier recommendations generated in {processing_time:.2f} seconds")
                return comprehensive_results
                
            # Default return the standard results if we get here
            return standard_results
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            # Return a minimal response in case of error
            error_response = {
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
            
            # If progressive, send error response
            if progressive and self.progressive_handler:
                await self.progressive_handler(error_response, final=True)
                
            return error_response

    @cached("recommendations_basic", ttl=3600)
    async def _get_basic_recommendations(self, search_term: str, user_id: str) -> Dict[str, Any]:
        """
        Get basic book recommendations (fast tier).
        
        Args:
            search_term: The search term.
            user_id: The user ID.
            
        Returns:
            Dictionary with basic recommendations.
        """
        start_time = datetime.now()
        
        try:
            # Setup circuit breaker
            circuit_open = self._check_circuit_breaker("perplexity_api")
            
            # Step 1: Get initial recommendations with timeout
            if not circuit_open:
                try:
                    # Set a shorter timeout for the fast path
                    book_items, _, _ = await asyncio.wait_for(
                        self.perplexity_service.get_initial_recommendations(search_term),
                        timeout=3.0  # Short timeout for fast path
                    )
                    logger.info(f"Retrieved {len(book_items)} initial book recommendations")
                except (asyncio.TimeoutError, Exception) as e:
                    logger.error(f"Error or timeout getting initial recommendations: {e}")
                    self._record_circuit_breaker_failure("perplexity_api")
                    book_items = []
            else:
                logger.warning("Circuit breaker open for perplexity_api, using mock data")
                book_items = []
                
            # Fallback to mock data if needed
            if not book_items:
                logger.warning("No books returned from API, using mock data")
                book_items = self._generate_mock_books(search_term)
                logger.info(f"Generated {len(book_items)} mock books")
            
            # Step 2: Deduplicate books
            deduplicated_books, removed_count = self._deduplicate_items(book_items)
            logger.info(f"Deduplicated books: {len(deduplicated_books)} unique items, {removed_count} duplicates removed")
            
            # Step 3: Basic semantic scoring - simplified for speed
            scored_books = self._quick_semantic_scoring(deduplicated_books, search_term)
            
            # Step 4: Ensure diversity in recommendations
            sorted_books = sorted(scored_books, key=lambda x: x.get("match_score", 0), reverse=True)
            diverse_books = self._ensure_diversity(sorted_books)
            logger.info(f"Ensured diversity: final recommendation set has {len(diverse_books)} books")
            
            # Get top book
            top_book = diverse_books[0] if diverse_books else None
            
            # Build basic response
            response = {
                "top_book": top_book,
                "recommendations": diverse_books[:settings.MAX_RECOMMENDATIONS],
                "metadata": {
                    "search_term": search_term,
                    "total_results": len(diverse_books),
                    "processing_time_ms": (datetime.now() - start_time).total_seconds() * 1000,
                    "timestamp": datetime.now().isoformat(),
                    "tier": "fast",
                    "duplicates_removed": removed_count
                }
            }
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating basic recommendations: {e}")
            return {
                "top_book": None,
                "recommendations": [],
                "metadata": {
                    "error": str(e),
                    "search_term": search_term,
                    "tier": "fast",
                    "timestamp": datetime.now().isoformat()
                }
            }
    
    async def _enhance_with_standard_features(
        self, 
        basic_results: Dict[str, Any], 
        search_term: str, 
        user_id: str,
        timeout: float = 15.0
    ) -> Dict[str, Any]:
        """
        Enhance basic recommendations with standard tier features.
        
        Args:
            basic_results: The basic recommendation results.
            search_term: The search term.
            user_id: The user ID.
            timeout: Maximum time for standard enhancements.
            
        Returns:
            Enhanced recommendations with standard features.
        """
        start_time = datetime.now()
        standard_results = basic_results.copy()
        standard_results["metadata"]["tier"] = "standard"
        
        try:
            # Create tasks for parallel processing
            tasks = [
                self._get_reviews_and_social(search_term),
                self._get_basic_insights(search_term, basic_results.get("recommendations", []))
            ]
            
            # Wait for all tasks with timeout
            results = await asyncio.wait_for(asyncio.gather(*tasks, return_exceptions=True), timeout=timeout)
            
            # Process review and social results
            if results[0] and not isinstance(results[0], Exception):
                review_items, social_items = results[0]
                
                # Sort reviews by match score
                sorted_reviews = sorted(review_items, key=lambda x: x.get("match_score", 0.0), reverse=True) if review_items else []
                
                # Sort social posts by match score
                sorted_social = sorted(social_items, key=lambda x: x.get("match_score", 0.0), reverse=True) if social_items else []
                
                standard_results["top_review"] = sorted_reviews[0] if sorted_reviews else None
                standard_results["top_social"] = sorted_social[0] if sorted_social else None
                standard_results["reviews"] = sorted_reviews[:3]
                standard_results["social"] = sorted_social[:3]
            else:
                logger.warning(f"Error getting reviews and social: {results[0] if isinstance(results[0], Exception) else 'Unknown error'}")
                
            # Process basic insights
            if results[1] and not isinstance(results[1], Exception):
                standard_results["insights"] = results[1]
            else:
                logger.warning(f"Error getting basic insights: {results[1] if isinstance(results[1], Exception) else 'Unknown error'}")
                standard_results["insights"] = {"thematic_connections": [], "reading_pathways": []}
                
            # Update processing time
            standard_results["metadata"]["processing_time_ms"] = (datetime.now() - start_time).total_seconds() * 1000
            
            return standard_results
            
        except asyncio.TimeoutError:
            logger.warning(f"Timeout while enhancing with standard features after {timeout} seconds")
            # Return what we have so far
            standard_results["metadata"]["timeout"] = True
            standard_results["metadata"]["processing_time_ms"] = (datetime.now() - start_time).total_seconds() * 1000
            return standard_results
            
        except Exception as e:
            logger.error(f"Error enhancing with standard features: {e}")
            standard_results["metadata"]["error"] = str(e)
            standard_results["metadata"]["processing_time_ms"] = (datetime.now() - start_time).total_seconds() * 1000
            return standard_results
    
    async def _enhance_with_comprehensive_features(
        self, 
        standard_results: Dict[str, Any], 
        search_term: str, 
        user_id: str,
        timeout: float = 40.0
    ) -> Dict[str, Any]:
        """
        Enhance standard recommendations with comprehensive tier features.
        
        Args:
            standard_results: The standard recommendation results.
            search_term: The search term.
            user_id: The user ID.
            timeout: Maximum time for comprehensive enhancements.
            
        Returns:
            Enhanced recommendations with comprehensive features.
        """
        start_time = datetime.now()
        comprehensive_results = standard_results.copy()
        comprehensive_results["metadata"]["tier"] = "comprehensive"
        
        try:
            # Create tasks for parallel processing of advanced features
            tasks = [
                self._get_literary_analysis_with_circuit_breaker(search_term),
                self._get_advanced_insights(search_term, standard_results.get("recommendations", [])),
                self._cross_validate_recommendations(standard_results.get("recommendations", []), search_term)
            ]
            
            # Wait for all tasks with timeout
            results = await asyncio.wait_for(asyncio.gather(*tasks, return_exceptions=True), timeout=timeout)
            
            # Process literary analysis
            if results[0] and not isinstance(results[0], Exception):
                comprehensive_results["literary_analysis"] = results[0]
            else:
                logger.warning(f"Error getting literary analysis: {results[0] if isinstance(results[0], Exception) else 'Unknown error'}")
                comprehensive_results["literary_analysis"] = self._generate_mock_literary_analysis(search_term)
                
            # Process advanced insights
            if results[1] and not isinstance(results[1], Exception):
                # Merge with existing insights
                existing_insights = comprehensive_results.get("insights", {})
                advanced_insights = results[1]
                merged_insights = {**existing_insights, **advanced_insights}
                comprehensive_results["insights"] = merged_insights
            else:
                logger.warning(f"Error getting advanced insights: {results[1] if isinstance(results[1], Exception) else 'Unknown error'}")
                
            # Process cross-validated recommendations
            if results[2] and not isinstance(results[2], Exception):
                # Replace recommendations with cross-validated ones
                comprehensive_results["recommendations"] = results[2]
            else:
                logger.warning(f"Error cross-validating recommendations: {results[2] if isinstance(results[2], Exception) else 'Unknown error'}")
                
            # Update processing time
            comprehensive_results["metadata"]["processing_time_ms"] = (datetime.now() - start_time).total_seconds() * 1000
            
            return comprehensive_results
            
        except asyncio.TimeoutError:
            logger.warning(f"Timeout while enhancing with comprehensive features after {timeout} seconds")
            # Return what we have so far
            comprehensive_results["metadata"]["timeout"] = True
            comprehensive_results["metadata"]["processing_time_ms"] = (datetime.now() - start_time).total_seconds() * 1000
            return comprehensive_results
            
        except Exception as e:
            logger.error(f"Error enhancing with comprehensive features: {e}")
            comprehensive_results["metadata"]["error"] = str(e)
            comprehensive_results["metadata"]["processing_time_ms"] = (datetime.now() - start_time).total_seconds() * 1000
            return comprehensive_results
    
    async def _get_reviews_and_social(self, search_term: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Get review and social media recommendations.
        
        Args:
            search_term: The search term.
            
        Returns:
            Tuple of (review_items, social_items).
        """
        try:
            # Check circuit breaker
            if self._check_circuit_breaker("perplexity_reviews_social"):
                logger.warning("Circuit breaker open for perplexity_reviews_social, using mock data")
                return self._generate_mock_reviews(search_term), self._generate_mock_social_posts(search_term)
                
            # Make API call with timeout
            try:
                _, review_items, social_items = await asyncio.wait_for(
                    self.perplexity_service.get_initial_recommendations(search_term),
                    timeout=5.0
                )
            except (asyncio.TimeoutError, Exception) as e:
                logger.error(f"Error or timeout getting reviews and social posts: {e}")
                self._record_circuit_breaker_failure("perplexity_reviews_social")
                review_items, social_items = [], []
            
            # Fallback to mock data if needed
            if not review_items:
                logger.warning("No reviews returned from API, using mock data")
                review_items = self._generate_mock_reviews(search_term)
                
            if not social_items:
                logger.warning("No social posts returned from API, using mock data")
                social_items = self._generate_mock_social_posts(search_term)
                
            return review_items, social_items
            
        except Exception as e:
            logger.error(f"Error getting reviews and social posts: {e}")
            return self._generate_mock_reviews(search_term), self._generate_mock_social_posts(search_term)
    
    async def _get_basic_insights(
        self, 
        search_term: str, 
        recommendations: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Get basic insights for recommendations.
        
        Args:
            search_term: The search term.
            recommendations: The recommended items.
            
        Returns:
            Dictionary with basic insights.
        """
        try:
            # For speed, we'll just provide thematic connections and reading pathways
            # This is a simplified version of the full insights
            basic_insights = {
                "thematic_connections": self._generate_thematic_connections(search_term, recommendations),
                "reading_pathways": self._generate_reading_pathways(recommendations)
            }
            
            return basic_insights
            
        except Exception as e:
            logger.error(f"Error generating basic insights: {e}")
            return {
                "thematic_connections": [],
                "reading_pathways": []
            }
    
    async def _get_advanced_insights(
        self, 
        search_term: str, 
        recommendations: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Get advanced insights for recommendations.
        
        Args:
            search_term: The search term.
            recommendations: The recommended items.
            
        Returns:
            Dictionary with advanced insights.
        """
        try:
            # Check circuit breaker
            if self._check_circuit_breaker("claude_insights"):
                logger.warning("Circuit breaker open for claude_insights, using mock data")
                return self._generate_mock_insights(search_term)
                
            # Make API call with timeout
            try:
                insights = await asyncio.wait_for(
                    self.claude_service.generate_contextual_insights(search_term, recommendations),
                    timeout=10.0
                )
                return insights
            except (asyncio.TimeoutError, Exception) as e:
                logger.error(f"Error or timeout getting advanced insights: {e}")
                self._record_circuit_breaker_failure("claude_insights")
                return self._generate_mock_insights(search_term)
                
        except Exception as e:
            logger.error(f"Error generating advanced insights: {e}")
            return self._generate_mock_insights(search_term)
    
    async def _get_literary_analysis_with_circuit_breaker(self, search_term: str) -> str:
        """
        Get literary analysis with circuit breaker pattern.
        
        Args:
            search_term: The search term.
            
        Returns:
            Literary analysis text.
        """
        try:
            # Check circuit breaker
            if self._check_circuit_breaker("perplexity_literary_analysis"):
                logger.warning("Circuit breaker open for perplexity_literary_analysis, using mock data")
                return self._generate_mock_literary_analysis(search_term)
                
            # Make API call with timeout
            try:
                analysis = await asyncio.wait_for(
                    self.perplexity_service.get_literary_analysis(search_term),
                    timeout=8.0
                )
                if analysis:
                    return analysis
                else:
                    logger.warning(f"Empty response from literary analysis API for {search_term}, using mock data")
                    return self._generate_mock_literary_analysis(search_term)
            except (asyncio.TimeoutError, Exception) as e:
                logger.error(f"Error or timeout getting literary analysis: {e}")
                self._record_circuit_breaker_failure("perplexity_literary_analysis")
                return self._generate_mock_literary_analysis(search_term)
                
        except Exception as e:
            logger.error(f"Error generating literary analysis: {e}")
            return self._generate_mock_literary_analysis(search_term)
    
    async def _cross_validate_recommendations(
        self, 
        recommendations: List[Dict[str, Any]], 
        search_term: str
    ) -> List[Dict[str, Any]]:
        """
        Cross-validate recommendations with Claude.
        
        Args:
            recommendations: The recommendations to validate.
            search_term: The search term.
            
        Returns:
            Validated recommendations.
        """
        try:
            # Check circuit breaker
            if self._check_circuit_breaker("claude_validation"):
                logger.warning("Circuit breaker open for claude_validation, returning original recommendations")
                return recommendations
                
            # Make API call with timeout
            try:
                validated = await asyncio.wait_for(
                    self.claude_service.cross_validate_recommendations(recommendations, search_term),
                    timeout=10.0
                )
                if validated:
                    logger.info(f"Cross-validated {len(validated)} book recommendations")
                    return validated
                else:
                    return recommendations
            except (asyncio.TimeoutError, Exception) as e:
                logger.error(f"Error or timeout cross-validating recommendations: {e}")
                self._record_circuit_breaker_failure("claude_validation")
                return recommendations
                
        except Exception as e:
            logger.error(f"Error cross-validating recommendations: {e}")
            return recommendations
    
    def _quick_semantic_scoring(
        self, 
        items: List[Dict[str, Any]], 
        search_term: str
    ) -> List[Dict[str, Any]]:
        """
        Quick semantic scoring for items.
        
        Args:
            items: Items to score.
            search_term: The search term.
            
        Returns:
            Scored items.
        """
        search_terms = set(search_term.lower().split())
        scored_items = []
        
        for item in items:
            # Get existing score or use default
            score = item.get("match_score", 0.5)
            
            # Simple keyword matching for speed
            title = item.get("title", "").lower()
            summary = item.get("summary", "").lower()
            author = item.get("author", "").lower()
            
            # Count term matches
            term_matches = sum(1 for term in search_terms if term in title or term in summary)
            
            # Adjust score based on matches
            if term_matches > 0:
                score = min(1.0, score + (0.1 * term_matches))
                
            # Extra weight for title matches
            title_matches = sum(1 for term in search_terms if term in title)
            if title_matches > 0:
                score = min(1.0, score + (0.1 * title_matches))
                
            # Update the score
            item["match_score"] = score
            scored_items.append(item)
            
        return scored_items
    
    # Circuit breaker pattern implementation
    def _check_circuit_breaker(self, service_name: str) -> bool:
        """
        Check if circuit breaker is open for a service.
        
        Args:
            service_name: The service name.
            
        Returns:
            True if circuit is open (service should not be called).
        """
        circuit_breakers = getattr(self, "_circuit_breakers", {})
        
        if service_name not in circuit_breakers:
            # Initialize circuit breaker
            circuit_breakers[service_name] = {
                "failures": 0,
                "last_failure": None,
                "open": False,
                "open_until": None
            }
            self._circuit_breakers = circuit_breakers
            
        breaker = circuit_breakers[service_name]
        
        # Check if circuit is open and timeout has elapsed
        if breaker["open"]:
            if breaker["open_until"] and datetime.now() > breaker["open_until"]:
                # Reset circuit breaker
                breaker["open"] = False
                breaker["failures"] = 0
                logger.info(f"Circuit breaker for {service_name} is now closed")
                return False
            else:
                return True
                
        return False
    
    def _record_circuit_breaker_failure(self, service_name: str) -> None:
        """
        Record a failure for a service's circuit breaker.
        
        Args:
            service_name: The service name.
        """
        circuit_breakers = getattr(self, "_circuit_breakers", {})
        
        if service_name not in circuit_breakers:
            # Initialize circuit breaker
            circuit_breakers[service_name] = {
                "failures": 0,
                "last_failure": None,
                "open": False,
                "open_until": None
            }
            
        breaker = circuit_breakers[service_name]
        
        # Record failure
        breaker["failures"] += 1
        breaker["last_failure"] = datetime.now()
        
        # Check if we should open the circuit
        if breaker["failures"] >= 3:  # Three strikes and you're out
            breaker["open"] = True
            breaker["open_until"] = datetime.now() + timedelta(minutes=5)  # 5 minute timeout
            logger.warning(f"Circuit breaker for {service_name} is now open until {breaker['open_until']}")
            
        self._circuit_breakers = circuit_breakers

    def _generate_mock_books(self, search_term: str) -> List[Dict[str, Any]]:
        """Generate mock books for testing."""
        books = []
        genres = ["Fiction", "Non-Fiction", "Fantasy", "Science Fiction", "Mystery", "Thriller", 
                "Romance", "Historical Fiction", "Biography", "Self-Help"]
        
        for i in range(5):
            match_score = round(0.95 - (i * 0.05), 2)
            books.append({
                "id": f"mock-book-{i}-{hash(search_term) % 10000}",
                "title": f"{search_term}: {'Volume ' + str(i+1) if i > 0 else 'A Comprehensive Guide'}",
                "author": f"Author {chr(65 + i)}",
                "summary": f"This {genres[i % len(genres)].lower()} book explores {search_term} in depth, offering unique insights and perspectives.",
                "category": genres[i % len(genres)],
                "match_score": match_score,
                "source": "mock"
            })
        
        return books
    
    def _generate_comprehensive_mock_books(self, search_term: str) -> List[Dict[str, Any]]:
        """Generate more comprehensive mock books with varied titles and themes."""
        normalized_term = search_term.lower().strip()
        
        # Create a list of book title templates
        title_templates = [
            "The Complete Guide to {term}",
            "Understanding {term}",
            "The {term} Handbook",
            "A History of {term}",
            "The Art of {term}",
            "Modern {term}",
            "Essential {term}",
            "Advanced {term}",
            "Introduction to {term}",
            "The Philosophy of {term}",
            "{term}: A Comprehensive Analysis",
            "Beyond {term}",
            "The {term} Chronicles",
            "{term} Made Simple",
            "{term} in the Modern Age"
        ]
        
        # Create a list of authors
        authors = [
            "James Smith",
            "Maria Garcia",
            "David Chen",
            "Aisha Johnson",
            "Samuel Washington",
            "Priya Patel",
            "Thomas Wilson",
            "Olivia Martinez",
            "Mohammed Al-Farsi",
            "Emma Thompson"
        ]
        
        # Create a list of categories
        categories = [
            "Fiction",
            "Non-Fiction",
            "Fantasy",
            "Science Fiction",
            "Mystery",
            "Thriller",
            "Romance",
            "Historical Fiction",
            "Biography",
            "Self-Help",
            "Academic",
            "Reference",
            "Contemporary",
            "Arts",
            "Education"
        ]
        
        # Generate summaries based on category
        def get_summary(category: str, term: str) -> str:
            summaries = {
                "Fiction": f"This engaging novel explores themes related to {term}, following characters as they navigate challenges and discoveries.",
                "Non-Fiction": f"A thorough examination of {term}, backed by research and interviews with experts in the field.",
                "Fantasy": f"Set in a magical world inspired by {term}, this fantasy tale brings new imagination to familiar concepts.",
                "Science Fiction": f"This visionary work imagines future developments in {term} and their impact on society.",
                "Mystery": f"A page-turning mystery centered around secrets related to {term} that will keep readers guessing until the end.",
                "Thriller": f"A fast-paced thriller where {term} plays a central role in an international conspiracy.",
                "Romance": f"A heartwarming story of love and connection, with {term} bringing the main characters together.",
                "Historical Fiction": f"Set against the historical development of {term}, this novel brings the past to life.",
                "Biography": f"The definitive biography of the pioneers who shaped our understanding of {term}.",
                "Self-Help": f"Practical guidance on applying principles of {term} to improve your life and achieve your goals.",
                "Academic": f"A scholarly analysis of {term}, suitable for university-level study and research.",
                "Reference": f"The essential reference guide to all aspects of {term}, organized for easy consultation.",
                "Contemporary": f"A modern perspective on {term}, addressing current trends and developments.",
                "Arts": f"An exploration of {term} through various artistic mediums and creative expressions.",
                "Education": f"Designed for learners at all levels, this educational resource makes {term} accessible and engaging."
            }
            return summaries.get(category, f"A comprehensive book about {term}.")
        
        # Generate books
        books = []
        for i in range(min(15, len(title_templates))):
            # Format the title with the search term
            capitalized_term = normalized_term.capitalize()
            title = title_templates[i].format(term=capitalized_term)
            
            # Select author and category
            author = authors[i % len(authors)]
            category = categories[i % len(categories)]
            
            # Create match score (decreasing from 0.96)
            match_score = round(0.96 - (i * 0.02), 2)
            
            # Generate summary
            summary = get_summary(category, normalized_term)
            
            # Create book object
            book = {
                "id": f"mock-{hash(title) % 10000}",
                "title": title,
                "author": author,
                "summary": summary,
                "category": category,
                "match_score": match_score,
                "source": "mock"
            }
            
            books.append(book)
        
        return books
    
    def _generate_mock_reviews(self, search_term: str) -> List[Dict[str, Any]]:
        """Generate mock reviews for testing."""
        reviews = []
        sources = ["New York Times", "Literary Review", "Book World", "The Guardian", "Publishers Weekly"]
        
        for i in range(3):
            date = (datetime.now().replace(day=1) - 
                    timedelta(days=30 * i)).strftime("%Y-%m-%d")
            reviews.append({
                "id": f"mock-review-{i}-{hash(search_term) % 10000}",
                "title": f"{'A Critical Analysis of' if i == 0 else 'Review:'} {search_term}",
                "source": sources[i % len(sources)],
                "date": date,
                "summary": f"This {'thought-provoking' if i % 2 == 0 else 'insightful'} review examines the significance of {search_term} in {'modern' if i % 2 == 0 else 'contemporary'} literature.",
                "url": f"https://example.com/reviews/{search_term.lower().replace(' ', '-')}-{i}",
                "link": f"https://example.com/reviews/{search_term.lower().replace(' ', '-')}-{i}"
            })
        
        return reviews
    
    def _generate_mock_social_posts(self, search_term: str) -> List[Dict[str, Any]]:
        """Generate mock social media posts for testing."""
        posts = []
        platforms = ["X (Twitter)", "Reddit", "Goodreads Forum", "Facebook Book Club", "BookTok"]
        
        for i in range(3):
            date = (datetime.now() - timedelta(days=i * 3)).strftime("%Y-%m-%d")
            posts.append({
                "id": f"mock-social-{i}-{hash(search_term) % 10000}",
                "title": f"{'Discussion Thread:' if i == 0 else 'Popular Post about'} {search_term}",
                "source": platforms[i % len(platforms)],
                "date": date,
                "summary": f"This trending {'thread' if i % 2 == 0 else 'post'} discusses {search_term} with {'over 500 comments' if i == 0 else 'growing engagement'} from readers worldwide.",
                "url": f"https://example.com/social/{platforms[i % len(platforms)].lower().replace(' ', '-')}/{search_term.lower().replace(' ', '-')}-{i}",
                "link": f"https://example.com/social/{platforms[i % len(platforms)].lower().replace(' ', '-')}/{search_term.lower().replace(' ', '-')}-{i}"
            })
        
        return posts
    
    def _generate_mock_insights(self, search_term: str) -> Dict[str, Any]:
        """Generate mock insights for testing."""
        return {
            "themes": [
                f"The evolution of {search_term}",
                f"Critical perspectives on {search_term}",
                f"Modern applications of {search_term}"
            ],
            "related_topics": [
                f"{search_term} in popular culture",
                f"Historical context of {search_term}",
                f"Future trends in {search_term}"
            ],
            "key_quotes": [
                f"The essence of {search_term} lies in its versatility and depth.",
                f"Understanding {search_term} requires both historical context and forward-thinking.",
                f"The study of {search_term} continues to evolve with new research and perspectives."
            ],
            "source": "mock"
        }
    
    def _generate_mock_literary_analysis(self, search_term: str) -> Dict[str, Any]:
        """Generate mock literary analysis for testing."""
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

    async def store_search_results(self, user_id: str, search_term: str, results: List[Dict[str, Any]]) -> None:
        """Store search results in the database"""
        if not settings.SUPABASE_ENABLED:
            logger.info("Supabase is disabled, skipping search results storage")
            return

        try:
            # Store each book result
            for result in results:
                # First save the book if it doesn't exist
                book_data = {
                    'id': result.get('id'),
                    'title': result.get('title'),
                    'author': result.get('author'),
                    'description': result.get('description'),
                    'summary': result.get('summary'),
                    'category': result.get('category'),
                    'match_score': result.get('match_score'),
                    'publication_date': result.get('publication_date'),
                    'cover_image': result.get('cover_image'),
                    'source': result.get('source')
                }
                await self.supabase.save_book(book_data)

                # Store user interaction
                await self.supabase.save_user_feedback(
                    user_id=user_id,
                    feedback_type='search',
                    message=f"Searched for '{search_term}' and viewed '{result.get('title')}'"
                )
        except Exception as e:
            logger.error(f"Failed to store search results: {e}")

    async def save_book_for_user(self, user_id: str, book_id: str) -> bool:
        """Save a book to a user's collection"""
        if not settings.SUPABASE_ENABLED:
            logger.info("Supabase is disabled, skipping book save")
            return False

        try:
            result = await self.supabase.save_book_for_user(user_id, book_id)
            if result:
                await self.supabase.save_user_feedback(
                    user_id=user_id,
                    feedback_type='save',
                    message=f"Saved book with ID: {book_id}"
                )
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to save book for user: {e}")
            return False

    async def get_personalized_recommendations(
        self,
        user_id: str,
        search_term: str,
        base_results: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Get personalized recommendations based on user preferences"""
        if not settings.SUPABASE_ENABLED:
            logger.info("Supabase is disabled, returning base recommendations")
            return base_results

        try:
            # Get user preferences
            preferences = await self.supabase.get_user_preferences(user_id)
            if not preferences:
                return base_results

            # Apply personalization based on preferences
            personalized_results = []
            for result in base_results:
                # Calculate personalization score
                personalization_score = 0
                
                # Check author match
                author = result.get('author')
                if author and author in preferences['favorite_authors']:
                    personalization_score += preferences['favorite_authors'][author] * 0.5

                # Check category match
                category = result.get('category')
                if category and category in preferences['favorite_categories']:
                    personalization_score += preferences['favorite_categories'][category] * 0.3

                # Add personalization score to match score
                result['match_score'] = result.get('match_score', 0) + personalization_score
                personalized_results.append(result)

            # Sort by updated match score
            personalized_results.sort(key=lambda x: x.get('match_score', 0), reverse=True)
            return personalized_results

        except Exception as e:
            logger.error(f"Failed to get personalized recommendations: {e}")
            return base_results

    async def save_user_feedback(
        self,
        user_id: str,
        feedback_type: str,
        message: str,
        book_id: Optional[str] = None
    ) -> bool:
        """Save user feedback for improving recommendations"""
        if not settings.SUPABASE_ENABLED:
            logger.info("Supabase is disabled, skipping feedback storage")
            return False

        try:
            result = await self.supabase.save_user_feedback(
                user_id=user_id,
                feedback_type=feedback_type,
                message=message
            )
            return bool(result)
        except Exception as e:
            logger.error(f"Failed to save user feedback: {e}")
            return False

    async def get_user_saved_books(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all books saved by a user"""
        if not settings.SUPABASE_ENABLED:
            logger.info("Supabase is disabled, returning empty saved books list")
            return []

        try:
            result = await self.supabase.get_user_saved_books(user_id)
            return result or []
        except Exception as e:
            logger.error(f"Failed to get user saved books: {e}")
            return []

# Create a singleton instance
recommendation_engine = RecommendationEngine() 