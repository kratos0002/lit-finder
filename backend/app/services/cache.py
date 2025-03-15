import logging
import json
import hashlib
from typing import Any, Dict, Optional, Union, Callable
from functools import wraps
from datetime import datetime

from app.core.config import settings

# Configure logging
logger = logging.getLogger(__name__)

# Try to import Redis if available
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("Redis package not installed. Using in-memory caching instead.")

# Try to import cachetools for in-memory caching
try:
    from cachetools import TTLCache
    CACHETOOLS_AVAILABLE = True
except ImportError:
    CACHETOOLS_AVAILABLE = False
    logger.warning("cachetools package not installed. Using simple dict caching instead.")

# Setup cache based on available packages and settings
if settings.REDIS_ENABLED and REDIS_AVAILABLE:
    # Use Redis for caching
    try:
        redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD,
            db=settings.REDIS_DB,
            decode_responses=True,
        )
        # Test connection
        redis_client.ping()
        logger.info("Redis connection established successfully.")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        redis_client = None
        REDIS_AVAILABLE = False
elif CACHETOOLS_AVAILABLE:
    # Use TTLCache for in-memory caching with TTL
    in_memory_cache = TTLCache(maxsize=1000, ttl=settings.CACHE_TTL)
else:
    # Fallback to a simple dict (no TTL eviction)
    in_memory_cache = {}
    logger.warning("Using simple dict cache without TTL eviction. This is not recommended for production.")


def generate_cache_key(prefix: str, *args, **kwargs) -> str:
    """Generate a cache key from the input arguments."""
    key_parts = [prefix]
    
    # Add positional arguments
    for arg in args:
        if isinstance(arg, (str, int, float, bool, type(None))):
            key_parts.append(str(arg))
        else:
            # For complex objects, use their JSON representation
            try:
                key_parts.append(json.dumps(arg, sort_keys=True))
            except (TypeError, ValueError):
                # If object is not JSON serializable, use its repr
                key_parts.append(repr(arg))
    
    # Add keyword arguments
    for k, v in sorted(kwargs.items()):
        key_parts.append(k)
        if isinstance(v, (str, int, float, bool, type(None))):
            key_parts.append(str(v))
        else:
            # For complex objects, use their JSON representation
            try:
                key_parts.append(json.dumps(v, sort_keys=True))
            except (TypeError, ValueError):
                # If object is not JSON serializable, use its repr
                key_parts.append(repr(v))
    
    # Create an MD5 hash of the combined key parts
    key = hashlib.md5(":".join(key_parts).encode()).hexdigest()
    return f"{prefix}:{key}"


def get_from_cache(key: str) -> Optional[Any]:
    """Get a value from the cache."""
    if settings.REDIS_ENABLED and REDIS_AVAILABLE and redis_client:
        # Get from Redis
        try:
            value = redis_client.get(key)
            if value:
                logger.debug(f"Cache hit for key: {key}")
                return json.loads(value)
            logger.debug(f"Cache miss for key: {key}")
            return None
        except Exception as e:
            logger.error(f"Error retrieving from Redis cache: {e}")
            return None
    else:
        # Get from in-memory cache
        value = in_memory_cache.get(key)
        if value is not None:
            logger.debug(f"Cache hit for key: {key}")
            return value
        logger.debug(f"Cache miss for key: {key}")
        return None


def set_in_cache(key: str, value: Any, ttl: Optional[int] = None) -> bool:
    """Set a value in the cache."""
    if ttl is None:
        ttl = settings.CACHE_TTL
    
    if settings.REDIS_ENABLED and REDIS_AVAILABLE and redis_client:
        # Set in Redis
        try:
            redis_client.setex(key, ttl, json.dumps(value))
            logger.debug(f"Set in Redis cache with key: {key}, TTL: {ttl}s")
            return True
        except Exception as e:
            logger.error(f"Error setting in Redis cache: {e}")
            return False
    else:
        # Set in in-memory cache
        in_memory_cache[key] = value
        logger.debug(f"Set in memory cache with key: {key}")
        return True


def delete_from_cache(key: str) -> bool:
    """Delete a value from the cache."""
    if settings.REDIS_ENABLED and REDIS_AVAILABLE and redis_client:
        # Delete from Redis
        try:
            redis_client.delete(key)
            logger.debug(f"Deleted from Redis cache with key: {key}")
            return True
        except Exception as e:
            logger.error(f"Error deleting from Redis cache: {e}")
            return False
    else:
        # Delete from in-memory cache
        if key in in_memory_cache:
            del in_memory_cache[key]
            logger.debug(f"Deleted from memory cache with key: {key}")
            return True
        return False


def cached(prefix: str, ttl: Optional[int] = None):
    """Decorator to cache function results."""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = generate_cache_key(prefix, *args, **kwargs)
            
            # Try to get from cache
            cached_result = get_from_cache(cache_key)
            if cached_result is not None:
                return cached_result
            
            # If not in cache, call the function
            result = await func(*args, **kwargs)
            
            # Store result in cache
            set_in_cache(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator 