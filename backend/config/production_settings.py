from .settings import *
import os
import dj_database_url

DEBUG = False
SECRET_KEY = os.environ.get("SECRET_KEY")
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "").split(",")

# Configure database using DATABASE_URL environment variable
DATABASE_URL = os.environ.get("DATABASE_URL")
DATABASES = {"default": dj_database_url.config(default=DATABASE_URL, conn_max_age=600)}

# CORS settings
CORS_ALLOWED_ORIGINS = os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")

# Static files
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
