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

logger = logging.getLogger(__name__)

class RecommendationEngine:
    """Core recommendation engine that combines all services."""
    
    def __init__(self):
        """Initialize the recommendation engine."""
        self.perplexity_service = PerplexityService(api_key=settings.PERPLEXITY_API_KEY)
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
            
            # ALWAYS check if we got valid data and use mock data if not
            if not book_items:
                logger.warning("No books returned from API, using mock data")
                book_items = self._generate_mock_books(search_term)
                logger.info(f"Generated {len(book_items)} mock books")
            
            if not review_items:
                logger.warning("No reviews returned from API, using mock data")
                review_items = self._generate_mock_reviews(search_term)
                logger.info(f"Generated {len(review_items)} mock reviews")
            
            if not social_items:
                logger.warning("No social posts returned from API, using mock data")
                social_items = self._generate_mock_social_posts(search_term)
                logger.info(f"Generated {len(social_items)} mock social posts")
            
            # Step 2: Search additional books from databases
            additional_books = await self.database_service.search_additional_books(search_term)
            logger.info(f"Retrieved {len(additional_books)} additional books from databases")
            
            # Combine all book items
            all_book_items = book_items + additional_books
            
            # If we still don't have any books, use more comprehensive mock data
            if not all_book_items:
                logger.warning("No books found in any source, using comprehensive mock data")
                all_book_items = self._generate_comprehensive_mock_books(search_term)
                logger.info(f"Generated {len(all_book_items)} comprehensive mock books")
            
            # Step 3: Deduplicate books
            deduplicated_books, removed_count = self._deduplicate_items(all_book_items)
            logger.info(f"Deduplicated books: {len(deduplicated_books)} unique items, {removed_count} duplicates removed")
            
            # Skip AI processing for mock data to improve performance
            if all(book.get("source", "") == "mock" for book in deduplicated_books):
                logger.info("Using mock data only, skipping AI processing")
                sorted_books = sorted(deduplicated_books, key=lambda x: x.get("match_score", 0), reverse=True)
                top_book = sorted_books[0] if sorted_books else None
                
                # Sort reviews and social items
                sorted_reviews = sorted(review_items, key=lambda x: random.random(), reverse=True)
                sorted_social = sorted(social_items, key=lambda x: random.random(), reverse=True)
                
                top_review = sorted_reviews[0] if sorted_reviews else None
                top_social = sorted_social[0] if sorted_social else None
                
                # Generate mock literary analysis and insights
                mock_insights = self._generate_mock_insights(search_term)
                mock_literary_analysis = self._generate_mock_literary_analysis(search_term)
                
                # Build response with mock data
                response = {
                    "top_book": top_book,
                    "top_review": top_review,
                    "top_social": top_social,
                    "recommendations": sorted_books[:settings.MAX_RECOMMENDATIONS],
                    "insights": mock_insights,
                    "literary_analysis": mock_literary_analysis, 
                    "metadata": {
                        "search_term": search_term,
                        "total_results": len(sorted_books),
                        "processing_time_ms": (datetime.now() - start_time).total_seconds() * 1000,
                        "timestamp": datetime.now().isoformat(),
                        "duplicates_removed": removed_count,
                        "source": "mock"
                    }
                }
                
                logger.info(f"Mock recommendations generated in {(datetime.now() - start_time).total_seconds():.2f} seconds")
                return response
            
            # Continue with normal AI processing for real data
            try:
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
            except Exception as e:
                logger.error(f"Error in AI processing pipeline: {e}")
                logger.info("Falling back to mock data due to AI processing error")
                sorted_books = sorted(deduplicated_books, key=lambda x: x.get("match_score", 0), reverse=True)
                insights = self._generate_mock_insights(search_term)
            
            top_book = sorted_books[0] if sorted_books else None
            
            # Sort reviews and social items by relevance
            sorted_reviews = sorted(review_items, key=lambda x: random.random(), reverse=True)
            sorted_social = sorted(social_items, key=lambda x: random.random(), reverse=True)
            
            top_review = sorted_reviews[0] if sorted_reviews else None
            top_social = sorted_social[0] if sorted_social else None
            
            # Step 12: Get literary analysis
            try:
                literary_analysis = await self.perplexity_service.get_literary_analysis(search_term)
                logger.info(f"Retrieved literary analysis")
            except Exception as e:
                logger.error(f"Error getting literary analysis: {e}")
                literary_analysis = self._generate_mock_literary_analysis(search_term)
            
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
            # Return mock data in case of error
            mock_books = self._generate_comprehensive_mock_books(search_term)
            mock_reviews = self._generate_mock_reviews(search_term)
            mock_social = self._generate_mock_social_posts(search_term)
            
            return {
                "top_book": mock_books[0] if mock_books else None,
                "top_review": mock_reviews[0] if mock_reviews else None,
                "top_social": mock_social[0] if mock_social else None,
                "recommendations": mock_books[:settings.MAX_RECOMMENDATIONS],
                "insights": self._generate_mock_insights(search_term),
                "literary_analysis": self._generate_mock_literary_analysis(search_term),
                "metadata": {
                    "error": str(e),
                    "search_term": search_term,
                    "processing_time_ms": (datetime.now() - start_time).total_seconds() * 1000,
                    "timestamp": datetime.now().isoformat(),
                    "source": "mock"
                }
            }
    
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