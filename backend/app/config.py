"""
Configuration settings for the AAD Framework Backend
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # API Configuration
    app_name: str = "AAD Framework API"
    app_version: str = "1.0.0"
    environment: str = "development"
    
    # CORS (comma-separated string in .env, * allows all origins for production)
    allowed_origins: str = "*"
    
    # API Keys
    openrouter_api_key: str = ""
    
    # OpenRouter Configuration
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    
    # Supported Models
    supported_models: str = "openai/gpt-4-turbo,anthropic/claude-3.5-sonnet,google/gemini-pro"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    @property
    def cors_origins(self) -> List[str]:
        """Get CORS origins as list"""
        return [origin.strip() for origin in self.allowed_origins.split(',') if origin.strip()]
    
    @property
    def model_list(self) -> List[str]:
        """Get supported models as list"""
        return [model.strip() for model in self.supported_models.split(',') if model.strip()]


# Global settings instance
settings = Settings()
