# api/tests/conftest.py
import pytest
import os
from django.conf import settings
from django.test import override_settings


def pytest_configure(config):
    """Print information about the test environment."""
    print(f"\nUsing Django settings module: {settings.SETTINGS_MODULE}")
    db_engine = settings.DATABASES["default"]["ENGINE"]
    print(f"Using database engine: {db_engine}")
    print(f"APPEND_SLASH: {settings.APPEND_SLASH}")
    print(f"TRAILING_SLASH: {settings.REST_FRAMEWORK.get('TRAILING_SLASH', 'Not set')}")
    
    if os.getenv("USE_POSTGRES_FOR_TESTS") == "True":
        print("Running tests with PostgreSQL in Docker")
        print(f"DB_HOST: {settings.DATABASES['default']['HOST']}")
        print(f"DB_NAME: {settings.DATABASES['default']['NAME']}")
    else:
        print("Running tests with SQLite in-memory database")


@pytest.fixture
def docker_db_setup():
    """
    Fixture to indicate tests are running in a Docker environment with PostgreSQL.
    Can be used for tests that specifically need to test PostgreSQL functionality.
    """
    return os.getenv("USE_POSTGRES_FOR_TESTS") == "True"
