# api/tests/conftest.py
import pytest
from django.conf import settings


def pytest_configure(config):
    """Print information about the test environment."""
    print(f"\nUsing Django settings module: {settings.SETTINGS_MODULE}")
    db_engine = settings.DATABASES["default"]["ENGINE"]
    print(f"Using database engine: {db_engine}")
