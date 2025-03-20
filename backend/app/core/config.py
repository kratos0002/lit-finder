import os
from typing import List, Optional, Dict, Any
from pydantic import field_validator, Field
from pydantic_settings import BaseSettings
import logging

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    PROJECT_NAME: str = "BookService"
    API_V1_STR: str = "/api"
    
    # CORS settings
    CORS_ORIGINS: List[str] = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:5173",
        "https://lit-finder.onrender.com",
        "https://bookservice.onrender.com"
    ]
    
    # API Keys
    OPENAI_API_KEY: Optional[str] = None
    PERPLEXITY_API_KEY: Optional[str] = None
    CLAUDE_API_KEY: Optional[str] = None  # Changed from ANTHROPIC_API_KEY
    GOODREADS_API_KEY: Optional[str] = None
    LIBRARYTHING_API_KEY: Optional[str] = None
    GROK_API_KEY: Optional[str] = None  # Added Grok API key
    
    # Supabase settings
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_ENABLED: bool = False  # Toggle for Supabase persistence features
    
    # Test settings
    USE_REAL_APIS: bool = False  # Flag to indicate if real APIs should be used in tests
    
    # Redis settings
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_DB: int = 0
    REDIS_ENABLED: bool = False  # Set to True to enable Redis caching
    
    # Cache settings
    CACHE_TTL: int = 3600  # Cache TTL in seconds (1 hour)
    
    # Performance settings
    MAX_CONCURRENT_REQUESTS: int = 10
    REQUEST_TIMEOUT: int = 60  # Request timeout in seconds
    
    # Recommendation settings
    MAX_RECOMMENDATIONS: int = 10
    MIN_MATCH_SCORE: float = 0.5
    MAX_ITEMS_PER_AUTHOR: int = 3
    MAX_ITEMS_PER_GENRE: int = 3
    
    # Database URLs (if applicable)
    DATABASE_URL: Optional[str] = None
    
    # API model selection
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    CLAUDE_MODEL: str = "claude-3-5-sonnet-20240620"  # Corrected format: dash instead of period
    PERPLEXITY_MODEL: str = "sonar"
    
    @field_validator("OPENAI_API_KEY", "PERPLEXITY_API_KEY", "CLAUDE_API_KEY", "GROK_API_KEY", mode="before")
    @classmethod
    def check_api_keys(cls, v, info):
        if not v:
            logger.warning(f"API key {info.field_name} not set")
        return v

    model_config = {
        "env_file": ".env",
        "case_sensitive": True
    }


settings = Settings()

# Print a warning if essential API keys are missing
if not all([settings.OPENAI_API_KEY, settings.PERPLEXITY_API_KEY, settings.CLAUDE_API_KEY]):
    logger.warning("One or more essential API keys are missing. Some features may not work correctly.")
