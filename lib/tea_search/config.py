"""Configuration module for TEA Search pipeline."""

import os
from pathlib import Path
from typing import Dict

from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)


class Config:
    """Configuration class for TEA Search modules."""

    def __init__(self):
        """Initialize configuration from environment variables."""
        # API Keys
        self.github_api_key = os.getenv("GITHUB_API_KEY", "")
        self.google_api_key = os.getenv("GOOGLE_API_KEY", "")
        self.google_cse_id = os.getenv("GOOGLE_CSE_ID", "")
        self.arxiv_api_key = os.getenv("ARXIV_API_KEY", "")  # Optional
        self.semantic_scholar_api_key = os.getenv(
            "SEMANTIC_SCHOLAR_API_KEY", ""
        )  # Optional

        # Rate limiting
        self.rate_limit_delay = float(os.getenv("TEA_SEARCH_RATE_LIMIT", "0.5"))

        # Search parameters
        self.max_resources = int(os.getenv("TEA_SEARCH_MAX_RESOURCES", "5"))
        self.max_results_per_provider = int(
            os.getenv("TEA_SEARCH_MAX_RESULTS_PER_PROVIDER", "10")
        )

        # Provider-specific settings
        self.arxiv_max_results = 20
        self.arxiv_categories = [
            "cs.AI",
            "cs.CY",
            "cs.ET",
            "cs.HC",
            "cs.LG",
            "cs.CV",
            "stat.ML",
        ]

        self.github_max_results = 20
        self.github_min_stars = 10  # Increased to filter out less popular repos

        self.google_max_results = 15

        self.semantic_scholar_max_results = 15
        self.semantic_scholar_fields = "title,url,abstract,authors,year,citationCount"

    def is_github_available(self) -> bool:
        """Check if GitHub search is available."""
        # GitHub works without API key but with rate limits
        return True

    def is_google_available(self) -> bool:
        """Check if Google search is available."""
        return bool(self.google_api_key and self.google_cse_id)

    def is_arxiv_available(self) -> bool:
        """Check if arXiv search is available."""
        # arXiv doesn't require API key
        return True

    def is_semantic_scholar_available(self) -> bool:
        """Check if Semantic Scholar search is available."""
        # Semantic Scholar works without API key
        return True

    def get_provider_config(self, provider: str) -> Dict:
        """Get configuration for a specific provider."""
        configs = {
            "arxiv": {
                "max_results": self.arxiv_max_results,
                "categories": self.arxiv_categories,
                "rate_limit_delay": self.rate_limit_delay,
            },
            "github": {
                "api_key": self.github_api_key,
                "max_results": self.github_max_results,
                "min_stars": self.github_min_stars,
                "rate_limit_delay": self.rate_limit_delay,
            },
            "google": {
                "api_key": self.google_api_key,
                "cse_id": self.google_cse_id,
                "max_results": self.google_max_results,
                "rate_limit_delay": self.rate_limit_delay,
            },
            "semantic_scholar": {
                "api_key": self.semantic_scholar_api_key,
                "max_results": self.semantic_scholar_max_results,
                "fields": self.semantic_scholar_fields,
                "rate_limit_delay": self.rate_limit_delay,
            },
        }
        return configs.get(provider, {})

    def validate(self) -> Dict[str, bool]:
        """Validate configuration and return status for each provider."""
        return {
            "arxiv": self.is_arxiv_available(),
            "github": self.is_github_available(),
            "google": self.is_google_available(),
            "semantic_scholar": self.is_semantic_scholar_available(),
        }


# Global config instance
config = Config()


def get_config() -> Config:
    """Get the global configuration instance."""
    return config
