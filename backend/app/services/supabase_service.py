from typing import List, Dict, Any, Optional
import logging
from datetime import datetime
from supabase import create_client, Client
from ..core.config import settings

logger = logging.getLogger(__name__)

class SupabaseService:
    def __init__(self):
        self.client: Optional[Client] = None
        if settings.SUPABASE_ENABLED and settings.SUPABASE_URL and settings.SUPABASE_KEY:
            try:
                self.client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                logger.info("Supabase client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
                self.client = None

    async def _execute_operation(self, operation, *args, **kwargs):
        """Execute a database operation with error handling"""
        if not self.client:
            logger.warning("Supabase is not enabled or not properly configured")
            return None
        
        try:
            return await operation(*args, **kwargs)
        except Exception as e:
            logger.error(f"Database operation failed: {e}")
            return None

    # Books table operations
    async def save_book(self, book_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Save a book to the database"""
        async def operation():
            return self.client.table('books').insert(book_data).execute()
        return await self._execute_operation(operation)

    async def get_book(self, book_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a book by ID"""
        async def operation():
            return self.client.table('books').select('*').eq('id', book_id).single().execute()
        return await self._execute_operation(operation)

    async def update_book(self, book_id: str, book_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a book's information"""
        async def operation():
            return self.client.table('books').update(book_data).eq('id', book_id).execute()
        return await self._execute_operation(operation)

    # Saved books operations
    async def save_book_for_user(self, user_id: str, book_id: str) -> Optional[Dict[str, Any]]:
        """Save a book to a user's collection"""
        async def operation():
            return self.client.table('saved_books').insert({
                'user_id': user_id,
                'book_id': book_id,
                'created_at': datetime.utcnow().isoformat()
            }).execute()
        return await self._execute_operation(operation)

    async def get_user_saved_books(self, user_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get all books saved by a user"""
        async def operation():
            return self.client.table('saved_books').select('*, books(*)').eq('user_id', user_id).execute()
        return await self._execute_operation(operation)

    async def remove_saved_book(self, user_id: str, book_id: str) -> Optional[Dict[str, Any]]:
        """Remove a book from a user's collection"""
        async def operation():
            return self.client.table('saved_books').delete().eq('user_id', user_id).eq('book_id', book_id).execute()
        return await self._execute_operation(operation)

    # Reviews operations
    async def save_review(self, review_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Save a book review"""
        async def operation():
            return self.client.table('reviews').insert({
                **review_data,
                'created_at': datetime.utcnow().isoformat()
            }).execute()
        return await self._execute_operation(operation)

    async def get_book_reviews(self, book_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get all reviews for a book"""
        async def operation():
            return self.client.table('reviews').select('*').eq('book_id', book_id).execute()
        return await self._execute_operation(operation)

    # Social posts operations
    async def save_social_post(self, post_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Save a social media post about a book"""
        async def operation():
            return self.client.table('social_posts').insert({
                **post_data,
                'created_at': datetime.utcnow().isoformat()
            }).execute()
        return await self._execute_operation(operation)

    async def get_book_social_posts(self, book_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get all social posts about a book"""
        async def operation():
            return self.client.table('social_posts').select('*').eq('book_id', book_id).execute()
        return await self._execute_operation(operation)

    # User feedback operations
    async def save_user_feedback(self, user_id: str, feedback_type: str, message: str) -> Optional[Dict[str, Any]]:
        """Save user feedback"""
        async def operation():
            return self.client.table('user_feedback').insert({
                'user_id': user_id,
                'type': feedback_type,
                'message': message,
                'timestamp': datetime.utcnow().isoformat()
            }).execute()
        return await self._execute_operation(operation)

    async def get_user_feedback(self, user_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get all feedback from a user"""
        async def operation():
            return self.client.table('user_feedback').select('*').eq('user_id', user_id).execute()
        return await self._execute_operation(operation)

    # Analytics operations
    async def get_user_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user preferences based on saved books and feedback"""
        async def operation():
            # Get saved books
            saved_books = await self.get_user_saved_books(user_id)
            if not saved_books:
                return None

            # Get user feedback
            feedback = await self.get_user_feedback(user_id)
            if not feedback:
                return None

            # Analyze preferences
            preferences = {
                'favorite_authors': {},
                'favorite_categories': {},
                'feedback_summary': {}
            }

            # Process saved books
            for saved_book in saved_books:
                book = saved_book.get('books', {})
                author = book.get('author')
                category = book.get('category')
                
                if author:
                    preferences['favorite_authors'][author] = preferences['favorite_authors'].get(author, 0) + 1
                if category:
                    preferences['favorite_categories'][category] = preferences['favorite_categories'].get(category, 0) + 1

            # Process feedback
            for item in feedback:
                feedback_type = item.get('type')
                preferences['feedback_summary'][feedback_type] = preferences['feedback_summary'].get(feedback_type, 0) + 1

            return preferences
        return await self._execute_operation(operation)

# Create a singleton instance
supabase_service = SupabaseService() 