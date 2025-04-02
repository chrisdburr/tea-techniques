"""
Test settings for the project.
Extends the base settings with test-specific settings.
"""

from .base import *  # noqa

# Use in-memory SQLite for faster test execution
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