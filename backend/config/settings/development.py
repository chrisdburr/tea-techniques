"""
Development settings for the project.
Extends the base settings with development-specific settings.
"""

from .base import *  # noqa

# Set DEBUG to True for development
DEBUG = True

# Allow all hosts in development
ALLOWED_HOSTS = ["*"]

# Use more verbose error pages
DEBUG_PROPAGATE_EXCEPTIONS = True

# Add Django Debug Toolbar for development
INSTALLED_APPS += ["debug_toolbar"]  # noqa
MIDDLEWARE += ["debug_toolbar.middleware.DebugToolbarMiddleware"]  # noqa

# For Django Debug Toolbar
INTERNAL_IPS = [
    "127.0.0.1",
    "localhost",
]

# Development-specific CORS settings
CORS_ALLOWED_ORIGINS += [  # noqa
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]