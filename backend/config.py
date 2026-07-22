# backend/config.py
from __future__ import annotations

import sys
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # AI / LLM
    ANTHROPIC_API_KEY: str = ""

    # GitHub
    GITHUB_TOKEN: str = ""
    GITHUB_REPO_OWNER: str = ""
    GITHUB_REPO_NAME: str = ""

    # Threat Intel
    NVD_API_KEY: str = ""

    # Neo4j
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USERNAME: str = "neo4j"
    NEO4J_PASSWORD: str = "threatmesh123"

    # PostgreSQL
    POSTGRES_URL: str = "postgresql+asyncpg://threatmesh:threatmesh@localhost:5432/threatmesh"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # App
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000


def get_settings() -> Settings:
    """Load and validate settings. Exits on fatal config errors."""
    try:
        return Settings()
    except Exception as exc:
        print(f"[FATAL] Configuration error: {exc}", file=sys.stderr)
        sys.exit(1)


settings = get_settings()
