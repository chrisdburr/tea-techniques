# api/tests/conftest.py
import os
import pytest


@pytest.fixture(scope="session", autouse=True)
def set_test_database():
    """Force SQLite database for all tests."""
    os.environ["USE_SQLITE"] = "True"
    # Also set Django to use in-memory SQLite
    os.environ["DB_ENGINE"] = "sqlite"
