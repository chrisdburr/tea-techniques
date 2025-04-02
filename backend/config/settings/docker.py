"""
Docker-specific settings for the project.
Extends the development settings with Docker-specific settings.
"""

from .development import *  # noqa

# Set the database host to the Docker service name
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", "techniques"),  # noqa
        "USER": os.getenv("DB_USER", "postgres"),  # noqa
        "PASSWORD": os.getenv("DB_PASSWORD", "postgres"),  # noqa
        "HOST": os.getenv("DB_HOST", "db"),  # Docker service name
        "PORT": os.getenv("DB_PORT", "5432"),  # noqa
    }
}

# Allow the frontend service to access the API
CORS_ALLOWED_ORIGINS += [  # noqa
    "http://frontend:3000",
]