import json
import os
import tempfile
from typing import Any, Dict, List

import pytest
from django.conf import settings
from django.contrib.auth.models import User
from django.core.management import call_command
from django.db import connection, transaction
from django.test import TestCase, TransactionTestCase

from api.tests.factories import (
    AssuranceGoalFactory,
    CompleteTechniqueFactory,
    IsolatedTechniqueFactory,
    MinimalTechniqueFactory,
    ResourceTypeFactory,
    TagFactory,
    TechniqueFactory,
    create_realistic_technique_dataset,
    create_test_assurance_goals,
    create_test_resource_types,
)

# Test configuration constants
TEST_USER_PASSWORD = os.environ.get("TEST_USER_PASSWORD", "test-password-123")
TEST_ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "test-admin-password-456")


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


# Base test classes for different testing needs


class BaseUnitTestCase(TestCase):
    """
    Base test case for unit tests.
    No database fixtures, minimal setup for testing isolated functionality.
    """

    pass


class BaseIntegrationTestCase(TransactionTestCase):
    """
    Base test case for integration tests that need database transactions.
    Includes realistic test data and supports testing across multiple models.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Create foundational data for integration tests
        cls.assurance_goals = create_test_assurance_goals()
        cls.resource_types = create_test_resource_types()

    def setUp(self):
        super().setUp()
        # Reset any changes between tests
        self.clear_test_data()

    def tearDown(self):
        super().tearDown()
        self.clear_test_data()

    def clear_test_data(self):
        """Clear test data while preserving foundational data"""
        from api.models import (
            Technique,
            TechniqueExampleUseCase,
            TechniqueLimitation,
            TechniqueResource,
        )

        # Clear derived data but keep goals and resource types
        TechniqueLimitation.objects.all().delete()
        TechniqueExampleUseCase.objects.all().delete()
        TechniqueResource.objects.all().delete()
        Technique.objects.all().delete()


class BaseAPITestCase(TransactionTestCase):
    """
    Base test case for API endpoint tests.
    Includes authentication setup and API client configuration.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Create foundational data
        cls.assurance_goals = create_test_assurance_goals()
        cls.resource_types = create_test_resource_types()

    def setUp(self):
        super().setUp()
        # Create test users
        self.admin_user = User.objects.create_superuser(
            username="admin_test", email="admin@test.com", password=TEST_USER_PASSWORD
        )

        self.regular_user = User.objects.create_user(
            username="regular_test",
            email="regular@test.com",
            password=TEST_USER_PASSWORD,
        )

        # Clear any existing techniques
        self.clear_test_data()

    def tearDown(self):
        super().tearDown()
        self.clear_test_data()
        User.objects.filter(username__endswith="_test").delete()

    def clear_test_data(self):
        """Clear test data while preserving foundational data"""
        from api.models import (
            Technique,
            TechniqueExampleUseCase,
            TechniqueLimitation,
            TechniqueResource,
        )

        TechniqueLimitation.objects.all().delete()
        TechniqueExampleUseCase.objects.all().delete()
        TechniqueResource.objects.all().delete()
        Technique.objects.all().delete()


# Test fixtures and utilities


@pytest.fixture
def sample_technique_data():
    """Provides realistic technique data for import testing"""
    return [
        {
            "name": "Test Technique 1",
            "description": "A comprehensive test technique for validating AI explainability methods.",
            "assurance_goals": ["Explainability", "Transparency"],
            "tags": ["interpretability", "model-agnostic", "post-hoc"],
            "complexity_rating": 3,
            "computational_cost_rating": 2,
            "resources": [
                {
                    "type": "Technical Paper",
                    "title": "Understanding AI Decisions: A Comprehensive Approach",
                    "url": "https://example.com/paper1",
                    "description": "Foundational paper on AI explainability",
                    "authors": "Smith, J., Johnson, A.",
                    "publication_date": "2023-01-15",
                }
            ],
            "example_use_cases": [
                {
                    "description": "Explaining loan approval decisions to ensure regulatory compliance",
                    "goal": "Transparency",
                }
            ],
            "limitations": [
                {"description": "May not work well with very high-dimensional data"},
                {
                    "description": "Computational overhead increases with model complexity"
                },
            ],
        }
    ]


@pytest.fixture
def invalid_technique_data():
    """Provides invalid technique data for error testing"""
    return [
        {
            "name": "",  # Invalid: empty name
            "description": "Valid description",
            "assurance_goals": [],  # Invalid: no goals
            "complexity_rating": 6,  # Invalid: out of range
        }
    ]


@pytest.fixture
def temp_json_file():
    """Creates a temporary JSON file for testing file operations"""

    def _create_temp_file(data: Dict[str, Any]) -> str:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(data, f)
            return f.name

    files_created = []

    def cleanup():
        for file_path in files_created:
            try:
                os.unlink(file_path)
            except FileNotFoundError:
                pass

    yield lambda data: (lambda path: (files_created.append(path), path)[1])(
        _create_temp_file(data)
    )
    cleanup()


@pytest.fixture
def realistic_technique_dataset():
    """Creates a realistic dataset of techniques for testing"""
    return create_realistic_technique_dataset(count=5)


@pytest.fixture
def docker_db_setup():
    """
    Fixture to indicate tests are running in a Docker environment with PostgreSQL.
    Can be used for tests that specifically need to test PostgreSQL functionality.
    """
    return os.getenv("USE_POSTGRES_FOR_TESTS") == "True"


# Performance testing utilities


class PerformanceTestMixin:
    """Mixin for testing performance characteristics"""

    def assertMaxQueries(self, max_queries: int):
        """Context manager to assert maximum number of database queries"""
        return self.assertNumQueries(max_queries, using="default")

    def measure_query_count(self, func, *args, **kwargs):
        """Measure and return the number of queries executed by a function"""
        with connection.cursor() as cursor:
            initial_queries = len(connection.queries)
            result = func(*args, **kwargs)
            final_queries = len(connection.queries)
            return final_queries - initial_queries, result


# Test data builders for specific scenarios


def build_technique_with_relations(num_resources=2, num_use_cases=1, num_limitations=3):
    """Build a technique with specified number of related objects"""
    technique = TechniqueFactory()

    # Add resources
    for _ in range(num_resources):
        from api.tests.factories import TechniqueResourceFactory

        TechniqueResourceFactory(technique=technique)

    # Add use cases
    for _ in range(num_use_cases):
        from api.tests.factories import TechniqueExampleUseCaseFactory

        TechniqueExampleUseCaseFactory(technique=technique)

    # Add limitations
    for _ in range(num_limitations):
        from api.tests.factories import TechniqueLimitationFactory

        TechniqueLimitationFactory(technique=technique)

    return technique


def build_large_dataset(num_techniques=100):
    """Build a large dataset for performance testing"""
    techniques = []

    # Create foundational data once
    goals = create_test_assurance_goals()
    resource_types = create_test_resource_types()

    for i in range(num_techniques):
        technique = CompleteTechniqueFactory()
        techniques.append(technique)

        # Add some cross-references between techniques
        if i > 0 and i % 10 == 0:
            # Link every 10th technique to previous ones
            previous_technique = techniques[i - 1]
            technique.related_techniques.add(previous_technique)
            previous_technique.related_techniques.add(technique)

    return techniques


# Assertion helpers for testing


def assert_technique_data_matches(technique, expected_data):
    """Helper to assert technique data matches expected values"""
    assert technique.name == expected_data["name"]
    assert technique.description == expected_data["description"]
    assert technique.complexity_rating == expected_data.get("complexity_rating")
    assert technique.computational_cost_rating == expected_data.get(
        "computational_cost_rating"
    )

    # Check goals
    expected_goals = set(expected_data.get("assurance_goals", []))
    actual_goals = set(technique.assurance_goals.values_list("name", flat=True))
    assert actual_goals == expected_goals

    # Check tags
    expected_tags = set(expected_data.get("tags", []))
    actual_tags = set(technique.tags.values_list("name", flat=True))
    assert actual_tags == expected_tags


def assert_api_response_structure(response_data, expected_fields):
    """Helper to assert API response has expected structure"""
    for field in expected_fields:
        assert field in response_data, f"Missing field: {field}"

    # Check pagination structure if present
    if "results" in response_data:
        assert "count" in response_data
        assert "next" in response_data
        assert "previous" in response_data
        assert isinstance(response_data["results"], list)


# Database state utilities


def get_db_state_snapshot():
    """Get a snapshot of current database state for comparison"""
    from api.models import AssuranceGoal, ResourceType, Tag, Technique

    return {
        "techniques": Technique.objects.count(),
        "goals": AssuranceGoal.objects.count(),
        "tags": Tag.objects.count(),
        "resource_types": ResourceType.objects.count(),
    }


def assert_db_state_unchanged(before_snapshot, after_snapshot):
    """Assert that database state is unchanged between snapshots"""
    for model, count in before_snapshot.items():
        assert (
            after_snapshot[model] == count
        ), f"{model} count changed: {count} -> {after_snapshot[model]}"


# Error testing utilities


class ErrorTestMixin:
    """Mixin for testing error conditions and edge cases"""

    def assert_error_response(
        self, response, expected_status, expected_error_type=None
    ):
        """Assert response contains expected error information"""
        assert response.status_code == expected_status

        if expected_error_type:
            response_data = response.json()
            assert "error" in response_data or "detail" in response_data

    def assert_validation_error(self, response, field_name=None):
        """Assert response contains validation error"""
        assert response.status_code == 400
        response_data = response.json()

        if field_name:
            assert field_name in response_data


# Test configuration

# pytest-django is automatically loaded


# Pytest fixtures for Django integration
# pytest-django provides django_db_setup automatically


@pytest.fixture
def authenticated_client(client):
    """Provides an authenticated client for API testing"""
    user = User.objects.create_user(
        username="test_user", email="test@example.com", password=TEST_USER_PASSWORD
    )
    client.force_login(user)
    client.user = user
    return client


@pytest.fixture
def admin_client(client):
    """Provides an admin authenticated client for API testing"""
    admin_user = User.objects.create_superuser(
        username="test_admin", email="admin@example.com", password=TEST_ADMIN_PASSWORD
    )
    client.force_login(admin_user)
    client.user = admin_user
    return client
