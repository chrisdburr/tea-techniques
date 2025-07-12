"""
Production settings for the project.
Extends the base settings with production-specific settings.
"""

import os

from .base import *

# Disable DEBUG in production
DEBUG = False

# Check for required environment variables in production
if not DEBUG:
    required_env_vars = ["SECRET_KEY", "ALLOWED_HOSTS"]
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    if missing_vars:
        raise Exception(f"Missing required environment variables: {', '.join(missing_vars)}")

# Security middleware settings
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

# REST Framework settings for production
REST_FRAMEWORK = {
    **REST_FRAMEWORK,  # Include existing settings
    # Override insecure default permissions for production
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
    # Disable browsable API in production
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
}

# Robust logging configuration for production
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "verbose",
            "filename": BASE_DIR / "logs" / "backend.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5,
        },
    },
    "root": {
        "handlers": ["console", "file"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False,
        },
        "api": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False,
        },
    },
}
