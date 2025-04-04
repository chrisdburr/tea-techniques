"""
Test settings for the project.
Extends the base settings with test-specific settings.
"""

import os
from .base import *  # noqa

# Allow for test database configuration to be overridden by environment variables
# This enables using PostgreSQL in Docker for tests
if os.getenv("USE_POSTGRES_FOR_TESTS") == "True":
    # Use the same database configuration as base settings, which points to PostgreSQL
    # Database settings inherit from base.py
    pass
else:
    # Use in-memory SQLite for faster test execution as a fallback
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }
    }

# Disable debug for tests
DEBUG = False

# Disable some middleware for faster tests
MIDDLEWARE = [
    m for m in MIDDLEWARE if not m.startswith("debug_toolbar")  # noqa
]

# Use a simpler password hasher for speed
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# Make sure URL configuration matches production settings
# This ensures tests use consistent URL formats without trailing slashes
APPEND_SLASH = False

# Make sure REST Framework settings are consistent
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "TRAILING_SLASH": False,
}