import logging
import asyncio
import time
from typing import Dict, List, Any, Optional, Callable, Union
from datetime import datetime, timedelta
import json
import hashlib
from functools import wraps

# Circuit breaker states
class CircuitState:
    CLOSED = "CLOSED"  # Normal operation
    OPEN = "OPEN"      # Failing, don't try
    HALF_OPEN = "HALF_OPEN"  # Testing if service is restored

class CircuitBreaker:
    """
    Circuit breaker pattern implementation for handling external service failures.
    Prevents cascading failures and provides graceful degradation.
    """
    
    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: int = 30,
        timeout_duration: int = 10,
        fallback_function: Optional[Callable] = None
    ):
        """
        Initialize the circuit breaker.
        
        Args:
            name: Name of the protected service
            failure_threshold: Number of failures before circuit opens
            recovery_timeout: Seconds to wait before testing if service is back
            timeout_duration: Seconds to wait for a response before timing out
            fallback_function: Function to call when circuit is open
        """
        self.name = name
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.timeout_duration = timeout_duration
        self.last_failure_time = None
        self.fallback_function = fallback_function
        self.logger = logging.getLogger(__name__)
    
    async def call(self, func, *args, **kwargs):
        """
        Call the protected function with circuit breaker protection.
        
        Args:
            func: The async function to call
            *args, **kwargs: Arguments to pass to the function
            
        Returns:
            Result of the function or fallback
        """
        if self.state == CircuitState.OPEN:
            # Check if recovery timeout has elapsed
            if self.last_failure_time and datetime.now() - self.last_failure_time > timedelta(seconds=self.recovery_timeout):
                self.logger.info(f"Circuit {self.name} transitioning from OPEN to HALF_OPEN")
                self.state = CircuitState.HALF_OPEN
            else:
                self.logger.warning(f"Circuit {self.name} is OPEN, using fallback")
                if self.fallback_function:
                    return await self.fallback_function(*args, **kwargs)
                raise Exception(f"Service {self.name} is unavailable and no fallback provided")
        
        try:
            # Use asyncio.wait_for to implement timeout
            result = await asyncio.wait_for(
                func(*args, **kwargs),
                timeout=self.timeout_duration
            )
            
            # If we're in half-open state and call succeeds, reset circuit
            if self.state == CircuitState.HALF_OPEN:
                self.logger.info(f"Circuit {self.name} restored, transitioning to CLOSED")
                self.reset()
                
            return result
            
        except asyncio.TimeoutError:
            self.logger.warning(f"Call to {self.name} timed out after {self.timeout_duration}s")
            return await self._handle_failure(*args, **kwargs)
            
        except Exception as e:
            self.logger.error(f"Call to {self.name} failed with error: {str(e)}")
            return await self._handle_failure(*args, **kwargs)
    
    async def _handle_failure(self, *args, **kwargs):
        """Handle a failed call by incrementing failure count and potentially opening circuit."""
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        
        # If we exceed the threshold, open the circuit
        if self.state == CircuitState.CLOSED and self.failure_count >= self.failure_threshold:
            self.logger.warning(f"Circuit {self.name} transitioning to OPEN after {self.failure_count} failures")
            self.state = CircuitState.OPEN
        
        # Half-open circuit goes back to open on failure
        if self.state == CircuitState.HALF_OPEN:
            self.logger.warning(f"Circuit {self.name} back to OPEN due to continued failure")
            self.state = CircuitState.OPEN
        
        # Call fallback if available
        if self.fallback_function:
            return await self.fallback_function(*args, **kwargs)
        
        raise Exception(f"Service {self.name} failed and no fallback provided")
    
    def reset(self):
        """Reset the circuit to closed state."""
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time = None


class RecommendationCache:
    """
    Cache for storing recommendation results with TTL and context awareness.
    """
    
    def __init__(self, ttl_seconds: int = 3600):
        """
        Initialize the cache.
        
        Args:
            ttl_seconds: Time-to-live for cache entries in seconds
        """
        self.cache = {}
        self.ttl_seconds = ttl_seconds
        self.logger = logging.getLogger(__name__)
    
    def _generate_key(self, user_id: str, search_term: str, tier: str) -> str:
        """
        Generate a cache key from the search parameters.
        
        Args:
            user_id: User ID
            search_term: Search term
            tier: Service tier
            
        Returns:
            Cache key string
        """
        key_parts = [user_id, search_term.lower(), tier]
        key_string = json.dumps(key_parts, sort_keys=True)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def get(self, user_id: str, search_term: str, tier: str) -> Optional[Dict[str, Any]]:
        """
        Get a cached result if available and not expired.
        
        Args:
            user_id: User ID
            search_term: Search term
            tier: Service tier
            
        Returns:
            Cached result or None if not found or expired
        """
        key = self._generate_key(user_id, search_term, tier)
        
        if key in self.cache:
            entry = self.cache[key]
            
            # Check if entry is expired
            if datetime.now() > entry["expiration"]:
                self.logger.debug(f"Cache entry expired for key: {key}")
                del self.cache[key]
                return None
            
            self.logger.info(f"Cache hit for: {search_term}, tier: {tier}")
            return entry["data"]
        
        self.logger.debug(f"Cache miss for: {search_term}, tier: {tier}")
        return None
    
    def set(self, user_id: str, search_term: str, tier: str, data: Dict[str, Any]) -> None:
        """
        Store a result in the cache.
        
        Args:
            user_id: User ID
            search_term: Search term
            tier: Service tier
            data: Data to cache
        """
        key = self._generate_key(user_id, search_term, tier)
        expiration = datetime.now() + timedelta(seconds=self.ttl_seconds)
        
        self.cache[key] = {
            "data": data,
            "expiration": expiration
        }
        
        self.logger.debug(f"Cached result for: {search_term}, tier: {tier}")
    
    def invalidate(self, user_id: str, search_term: str, tier: str) -> None:
        """
        Invalidate a specific cache entry.
        
        Args:
            user_id: User ID
            search_term: Search term
            tier: Service tier
        """
        key = self._generate_key(user_id, search_term, tier)
        
        if key in self.cache:
            del self.cache[key]
            self.logger.debug(f"Invalidated cache for: {search_term}, tier: {tier}")
    
    def clear(self) -> None:
        """Clear all cache entries."""
        self.cache = {}
        self.logger.debug("Cache cleared")


class RecommendationService:
    """
    Service for managing book recommendations with circuit breakers and caching.
    Acts as a facade over the recommendation engine, adding resilience features.
    """
    
    def __init__(self, recommendation_engine=None):
        """
        Initialize the recommendation service.
        
        Args:
            recommendation_engine: The underlying recommendation engine instance
        """
        self.recommendation_engine = recommendation_engine
        self.logger = logging.getLogger(__name__)
        
        # Initialize cache
        self.cache = RecommendationCache(ttl_seconds=3600)  # 1 hour TTL
        
        # Circuit breakers for different services
        self.perplexity_breaker = CircuitBreaker(
            name="perplexity",
            failure_threshold=3,
            recovery_timeout=60,
            timeout_duration=15,
            fallback_function=self._perplexity_fallback
        )
        
        self.claude_breaker = CircuitBreaker(
            name="claude",
            failure_threshold=3,
            recovery_timeout=60,
            timeout_duration=20,
            fallback_function=self._claude_fallback
        )
        
        self.openai_breaker = CircuitBreaker(
            name="openai",
            failure_threshold=3,
            recovery_timeout=60,
            timeout_duration=10,
            fallback_function=self._openai_fallback
        )
    
    async def get_recommendations(
        self,
        user_id: str,
        search_term: str,
        history: Optional[List[str]] = None,
        feedback: Optional[List[Dict[str, Any]]] = None,
        tier: str = "standard",
        progressive: bool = False,
        skip_cache: bool = False
    ) -> Dict[str, Any]:
        """
        Get book recommendations with resilience patterns applied.
        
        Args:
            user_id: User ID
            search_term: Search term
            history: User's search history
            feedback: User's feedback
            tier: Service tier (fast, standard, comprehensive)
            progressive: Whether to use progressive loading
            skip_cache: Whether to skip cache lookup
            
        Returns:
            Recommendation results
        """
        start_time = time.time()
        
        # Check cache first unless skip_cache is True
        if not skip_cache:
            cached_result = self.cache.get(user_id, search_term, tier)
            if cached_result:
                self.logger.info(f"Returning cached recommendation for: {search_term}, tier: {tier}")
                return cached_result
        
        try:
            # Get recommendations from engine
            result = await self.recommendation_engine.get_recommendations(
                user_id=user_id,
                search_term=search_term,
                history=history,
                feedback=feedback,
                tier=tier,
                progressive=progressive
            )
            
            # Cache the result
            if result and not progressive:
                self.cache.set(user_id, search_term, tier, result)
            
            processing_time = time.time() - start_time
            self.logger.info(f"Recommendations for '{search_term}' completed in {processing_time:.2f}s")
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error getting recommendations: {str(e)}", exc_info=True)
            
            # Return minimal response in case of error
            return {
                "recommendations": [],
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def call_perplexity_service(self, method_name, *args, **kwargs):
        """Call Perplexity service with circuit breaker protection."""
        if not hasattr(self.recommendation_engine, method_name):
            raise AttributeError(f"Method {method_name} not found in recommendation engine")
            
        method = getattr(self.recommendation_engine, method_name)
        return await self.perplexity_breaker.call(method, *args, **kwargs)
    
    async def call_claude_service(self, method_name, *args, **kwargs):
        """Call Claude service with circuit breaker protection."""
        if not hasattr(self.recommendation_engine, method_name):
            raise AttributeError(f"Method {method_name} not found in recommendation engine")
            
        method = getattr(self.recommendation_engine, method_name)
        return await self.claude_breaker.call(method, *args, **kwargs)
    
    async def call_openai_service(self, method_name, *args, **kwargs):
        """Call OpenAI service with circuit breaker protection."""
        if not hasattr(self.recommendation_engine, method_name):
            raise AttributeError(f"Method {method_name} not found in recommendation engine")
            
        method = getattr(self.recommendation_engine, method_name)
        return await self.openai_breaker.call(method, *args, **kwargs)
    
    async def invalidate_cache(self, user_id: str, search_term: str, tier: str = "standard") -> None:
        """
        Invalidate a specific cache entry.
        
        Args:
            user_id: User ID
            search_term: Search term
            tier: Service tier
        """
        self.cache.invalidate(user_id, search_term, tier)
    
    # Fallback methods for circuit breakers
    async def _perplexity_fallback(self, *args, **kwargs) -> Dict[str, Any]:
        """Fallback for Perplexity service failures."""
        self.logger.warning("Using fallback for Perplexity service")
        # Return mock data or minimal response
        return {"recommendations": self._get_mock_recommendations()}
    
    async def _claude_fallback(self, *args, **kwargs) -> Dict[str, Any]:
        """Fallback for Claude service failures."""
        self.logger.warning("Using fallback for Claude service")
        # Return minimal response
        return {"analysis": "Service temporarily unavailable"}
    
    async def _openai_fallback(self, *args, **kwargs) -> Dict[str, Any]:
        """Fallback for OpenAI service failures."""
        self.logger.warning("Using fallback for OpenAI service")
        # Return minimal response
        return {"insights": {}}
    
    def _get_mock_recommendations(self) -> List[Dict[str, Any]]:
        """Get mock recommendations for fallback."""
        return [
            {
                "id": "mock-1",
                "title": "Fallback Recommendation 1",
                "author": "System Generated",
                "match_score": 0.7,
                "summary": "This is a fallback recommendation due to service unavailability."
            },
            {
                "id": "mock-2",
                "title": "Fallback Recommendation 2",
                "author": "System Generated",
                "match_score": 0.6,
                "summary": "This is a fallback recommendation due to service unavailability."
            }
        ] 