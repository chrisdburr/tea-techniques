"""
Test settings for the TEA Techniques project.
This ensures all tests use SQLite regardless of environment variables.
"""

from .settings import *  # Import all settings from main settings file

# Force SQLite for all tests
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",  # Use in-memory database for faster tests
    }
}

# Other test-specific settings can go here
DEBUG = False  # Disable debug for tests
ALLOWED_HOSTS = ["*"]  # Allow all hosts in tests
