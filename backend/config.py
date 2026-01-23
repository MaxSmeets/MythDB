from __future__ import annotations

import os
from pathlib import Path


# File system
DATA_DIR = Path("data")


# Flask Configuration
class Config:
    """Base configuration."""
    DEBUG = False
    TESTING = False
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    DEVELOPMENT = True


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 MB for tests


def get_config() -> type[Config]:
    """Get configuration based on environment."""
    env = os.getenv("FLASK_ENV", "development").lower()
    
    config_map = {
        "development": DevelopmentConfig,
        "production": ProductionConfig,
        "testing": TestingConfig,
    }
    
    return config_map.get(env, DevelopmentConfig)