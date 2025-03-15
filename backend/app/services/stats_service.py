import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import asyncio
from collections import Counter, defaultdict

from app.core.config import settings
from app.services.cache import cached, get_from_cache, set_in_cache

logger = logging.getLogger(__name__)

class StatsService:
    """Service for tracking user statistics."""
    
    def __init__(self):
        """Initialize stats service."""
        self.stats_cache_prefix = "user_stats"
        self.request_times_prefix = "request_times"
        self.searches_prefix = "user_searches"
    
    async def record_request(self, user_id: str, search_term: str, response_time: float) -> None:
        """
        Record a user request.
        
        Args:
            user_id: The user ID.
            search_term: The search term.
            response_time: The response time in seconds.
        """
        try:
            # Get current stats
            stats = await self.get_user_stats(user_id)
            
            # Update stats
            stats["total_requests"] = stats.get("total_requests", 0) + 1
            stats["last_request"] = datetime.now().isoformat()
            
            # Record response time
            request_times_key = f"{self.request_times_prefix}:{user_id}"
            request_times = get_from_cache(request_times_key) or []
            request_times.append(response_time)
            # Keep only the last 100 request times
            if len(request_times) > 100:
                request_times = request_times[-100:]
            set_in_cache(request_times_key, request_times)
            
            # Calculate average response time
            if request_times:
                stats["avg_response_time"] = sum(request_times) / len(request_times)
            
            # Record search term
            searches_key = f"{self.searches_prefix}:{user_id}"
            searches = get_from_cache(searches_key) or []
            searches.append(search_term)
            # Keep only the last 100 searches
            if len(searches) > 100:
                searches = searches[-100:]
            set_in_cache(searches_key, searches)
            
            # Calculate top searches
            counter = Counter(searches)
            stats["top_searches"] = [search for search, _ in counter.most_common(5)]
            
            # Save updated stats
            stats_key = f"{self.stats_cache_prefix}:{user_id}"
            set_in_cache(stats_key, stats)
            
            logger.debug(f"Recorded request for user {user_id}: {search_term}")
        
        except Exception as e:
            logger.error(f"Error recording request stats: {e}")
    
    @cached("user_stats", ttl=60)  # Cache for 1 minute
    async def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """
        Get stats for a user.
        
        Args:
            user_id: The user ID.
            
        Returns:
            Dictionary with user stats.
        """
        stats_key = f"{self.stats_cache_prefix}:{user_id}"
        stats = get_from_cache(stats_key)
        
        if not stats:
            # Initialize stats if not found
            stats = {
                "user_id": user_id,
                "total_requests": 0,
                "avg_response_time": 0.0,
                "last_request": None,
                "top_searches": []
            }
            set_in_cache(stats_key, stats)
        
        return stats
    
    async def get_global_stats(self) -> Dict[str, Any]:
        """
        Get global statistics.
        
        Returns:
            Dictionary with global stats.
        """
        try:
            # This is a simplified implementation
            # In a real system, you would store and retrieve these from a database
            return {
                "total_users": 1,  # Placeholder
                "total_requests": 0,  # Placeholder
                "avg_response_time": 0.0,  # Placeholder
                "uptime": 0,  # Placeholder
            }
        
        except Exception as e:
            logger.error(f"Error getting global stats: {e}")
            return {} 