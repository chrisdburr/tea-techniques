"""
Test settings for the TEA Techniques project.
Optimized for CI/CD environments and automated testing.
"""

import os
import sys

from .base import *

# Test-specific SECRET_KEY
SECRET_KEY = "test-secret-key-for-testing-only"

# CI/CD Database Configuration
if "DATABASE_URL" in os.environ:
    # PostgreSQL for CI (matches production database type)
    try:
        import dj_database_url

        DATABASES = {"default": dj_database_url.parse(os.environ["DATABASE_URL"])}
    except ImportError:
        # Manual parsing of DATABASE_URL as fallback
        database_url = os.environ["DATABASE_URL"]
        if database_url.startswith("postgresql://"):
            from urllib.parse import urlparse
            parsed = urlparse(database_url)
            DATABASES = {
                "default": {
                    "ENGINE": "django.db.backends.postgresql",
                    "NAME": parsed.path.lstrip('/'),
                    "USER": parsed.username,
                    "PASSWORD": parsed.password,
                    "HOST": parsed.hostname,
                    "PORT": parsed.port or 5432,
                }
            }
elif os.getenv("USE_POSTGRES_FOR_TESTS") == "True":
    # Use the same database configuration as base settings
    pass
else:
    # Use in-memory SQLite for faster test execution
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }
    }


# Performance optimizations for tests
class DisableMigrations:
    def __contains__(self, item):
        return True

    def __getitem__(self, item):
        return None


# Disable migrations for faster testing (when enabled)
if os.environ.get("FAST_TESTS", "").lower() == "true":
    MIGRATION_MODULES = DisableMigrations()

# Disable debug for tests
DEBUG = False
TESTING = True

# Optimized middleware for tests
MIDDLEWARE = [
    m
    for m in MIDDLEWARE
    if not any(
        skip in m
        for skip in [
            "debug_toolbar",
            "browser_reload",
        ]
    )
]

# Use a simpler password hasher for speed
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# Disable logging during tests (unless explicitly enabled)
if not os.environ.get("ENABLE_TEST_LOGGING"):
    LOGGING = {
        "version": 1,
        "disable_existing_loggers": False,
        "handlers": {
            "null": {
                "class": "logging.NullHandler",
            },
        },
        "root": {
            "handlers": ["null"],
        },
    }

# Cache configuration for tests
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "test-cache",
    }
}

# Email backend for tests
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Media and static files for tests
MEDIA_ROOT = "/tmp/tea_techniques_test_media"  # noqa: S108
STATIC_ROOT = "/tmp/tea_techniques_test_static"  # noqa: S108

# Simplified password validation for tests
AUTH_PASSWORD_VALIDATORS = []

# CORS settings for testing with frontend
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# CSRF settings for API testing
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Session settings for testing
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Allowed hosts for testing
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "testserver"]

# URL configuration for consistent testing
APPEND_SLASH = False

# REST Framework settings for tests
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "TRAILING_SLASH": False,
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",  # Simplified for testing
    ],
    "TEST_REQUEST_DEFAULT_FORMAT": "json",
}

# Time zone for tests
USE_TZ = True
TIME_ZONE = "UTC"

# Internationalization for tests
USE_I18N = False
USE_L10N = False

# Test file upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 1024 * 1024  # 1MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 1024 * 1024  # 1MB

# Security settings for tests
SECURE_BROWSER_XSS_FILTER = False
SECURE_CONTENT_TYPE_NOSNIFF = False
X_FRAME_OPTIONS = "SAMEORIGIN"
