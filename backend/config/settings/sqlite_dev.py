"""
SQLite development settings for local testing without PostgreSQL.
"""

from .base import *  # noqa

# Set DEBUG to True for development
DEBUG = True

# Allow all hosts in development
ALLOWED_HOSTS = ["*"]

# Override database to use SQLite
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",  # noqa
    }
}

# Development-specific CORS settings
CORS_ALLOWED_ORIGINS += [  # noqa
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]
