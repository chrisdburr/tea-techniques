"""
SQLite settings for local development.
Extends the development settings with SQLite database.
This file is not intended for production use.

To use these settings, set the environment variable:
DJANGO_SETTINGS_MODULE=config.settings.sqlite
"""

from .development import *  # noqa

# Override database settings to use SQLite
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": os.path.join(BASE_DIR, "db.sqlite3"),  # noqa
    }
}

# Log that we're using SQLite settings
print("Using SQLite database settings for local development only")