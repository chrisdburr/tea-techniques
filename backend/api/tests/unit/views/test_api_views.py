# api/tests/unit/views/test_api_views.py
"""
Unit tests for API views to increase coverage.
"""

from unittest.mock import Mock, patch

from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory, APITestCase, force_authenticate

from api.tests.factories import AssuranceGoalFactory, ResourceTypeFactory, TagFactory, TechniqueFactory
from api.views.api_views import (
    AssuranceGoalsViewSet,
    ResourceTypesViewSet,
    TagsViewSet,
    TechniquesViewSet,
    _format_request_info,
    _get_api_endpoints,
    _get_database_info,
    _get_model_counts,
    _sanitize_settings,
    debug_echo,
    health_check,
    health_check_detailed,
)


class ViewSetPermissionTests(APITestCase):
    """Test permission handling across viewsets."""

    def setUp(self):
        """Set up test data."""
        self.factory = APIRequestFactory()
        from api.tests.conftest import TEST_USER_PASSWORD

        self.user = User.objects.create_user(username="testuser", password=TEST_USER_PASSWORD)
        self.assurance_goal = AssuranceGoalFactory()
        self.tag = TagFactory()
        self.technique = TechniqueFactory()
        self.resource_type = ResourceTypeFactory()

    def test_assurance_goals_viewset_permissions_read_operations(self):
        """Test that read operations allow any user."""
        viewset = AssuranceGoalsViewSet()
        viewset.action = "list"

        permissions = viewset.get_permissions()
        self.assertEqual(len(permissions), 1)
        self.assertEqual(permissions[0].__class__.__name__, "AllowAny")

        viewset.action = "retrieve"
        permissions = viewset.get_permissions()
        self.assertEqual(permissions[0].__class__.__name__, "AllowAny")

    def test_assurance_goals_viewset_permissions_write_operations(self):
        """Test that write operations require authentication."""
        viewset = AssuranceGoalsViewSet()

        write_actions = ["create", "update", "partial_update", "destroy"]
        for action in write_actions:
            viewset.action = action
            permissions = viewset.get_permissions()
            self.assertEqual(len(permissions), 1)
            self.assertEqual(permissions[0].__class__.__name__, "IsAuthenticated")

    def test_tags_viewset_permissions(self):
        """Test TagsViewSet permission handling."""
        viewset = TagsViewSet()

        # Test read operations
        viewset.action = "list"
        permissions = viewset.get_permissions()
        self.assertEqual(permissions[0].__class__.__name__, "AllowAny")

        # Test write operations
        viewset.action = "create"
        permissions = viewset.get_permissions()
        self.assertEqual(permissions[0].__class__.__name__, "IsAuthenticated")

    def test_techniques_viewset_permissions(self):
        """Test TechniquesViewSet permission handling."""
        viewset = TechniquesViewSet()

        # Test read operations
        viewset.action = "retrieve"
        permissions = viewset.get_permissions()
        self.assertEqual(permissions[0].__class__.__name__, "AllowAny")

        # Test write operations
        write_actions = ["create", "update", "partial_update", "destroy"]
        for action in write_actions:
            viewset.action = action
            permissions = viewset.get_permissions()
            self.assertEqual(permissions[0].__class__.__name__, "IsAuthenticated")

    def test_resource_types_viewset_permissions(self):
        """Test ResourceTypesViewSet permission handling."""
        viewset = ResourceTypesViewSet()

        # Test read operations
        viewset.action = "list"
        permissions = viewset.get_permissions()
        self.assertEqual(permissions[0].__class__.__name__, "AllowAny")

        # Test write operations
        viewset.action = "destroy"
        permissions = viewset.get_permissions()
        self.assertEqual(permissions[0].__class__.__name__, "IsAuthenticated")


class TechniquesViewSetTests(APITestCase):
    """Test TechniquesViewSet specific functionality."""

    def setUp(self):
        """Set up test data."""
        self.factory = APIRequestFactory()
        from api.tests.conftest import TEST_USER_PASSWORD

        self.user = User.objects.create_user(username="testuser", password=TEST_USER_PASSWORD)
        self.technique = TechniqueFactory()

    def test_get_serializer_class(self):
        """Test get_serializer_class method."""
        viewset = TechniquesViewSet()
        serializer_class = viewset.get_serializer_class()
        self.assertEqual(serializer_class.__name__, "TechniqueSerializer")

    def test_get_queryset_prefetch_related(self):
        """Test that get_queryset includes proper prefetch_related."""
        viewset = TechniquesViewSet()
        queryset = viewset.get_queryset()

        # Verify prefetch_related is configured by checking _prefetch_related_lookups
        prefetch_lookups = queryset._prefetch_related_lookups
        self.assertIn("assurance_goals", prefetch_lookups)
        self.assertIn("tags", prefetch_lookups)
        self.assertIn("related_techniques", prefetch_lookups)

    def test_techniques_viewset_list_method(self):
        """Test list method delegation."""
        viewset = TechniquesViewSet()
        request = self.factory.get("/api/techniques/")

        # Mock the parent list method
        with patch.object(viewset.__class__.__bases__[0], "list") as mock_list:
            mock_list.return_value = Mock()
            viewset.list(request)
            mock_list.assert_called_once_with(request)

    def test_techniques_viewset_retrieve_method(self):
        """Test retrieve method delegation."""
        viewset = TechniquesViewSet()
        request = self.factory.get(f"/api/techniques/{self.technique.slug}/")

        # Mock the parent retrieve method
        with patch.object(viewset.__class__.__bases__[0], "retrieve") as mock_retrieve:
            mock_retrieve.return_value = Mock()
            viewset.retrieve(request)
            mock_retrieve.assert_called_once_with(request)

    def test_techniques_viewset_create_method(self):
        """Test create method implementation."""
        viewset = TechniquesViewSet()
        request_data = {
            "name": "Test Technique",
            "description": "Test description",
        }
        django_request = self.factory.post("/api/techniques/", request_data, format="json")
        force_authenticate(django_request, user=self.user)
        request = Request(django_request, parsers=viewset.get_parsers())

        # Mock get_serializer and serializer methods
        mock_serializer = Mock()
        mock_serializer.is_valid.return_value = True
        mock_serializer.data = request_data

        with patch.object(viewset, "get_serializer", return_value=mock_serializer):
            response = viewset.create(request)

            mock_serializer.is_valid.assert_called_once_with(raise_exception=True)
            mock_serializer.save.assert_called_once()
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_techniques_viewset_update_method(self):
        """Test update method implementation."""
        viewset = TechniquesViewSet()
        request_data = {
            "name": self.technique.name,
            "description": "Updated description",
        }
        django_request = self.factory.put(f"/api/techniques/{self.technique.slug}/", request_data, format="json")
        force_authenticate(django_request, user=self.user)
        request = Request(django_request, parsers=viewset.get_parsers())

        # Mock get_object, get_serializer and serializer methods
        mock_serializer = Mock()
        mock_serializer.is_valid.return_value = True
        mock_serializer.data = request_data

        with (
            patch.object(viewset, "get_object", return_value=self.technique),
            patch.object(viewset, "get_serializer", return_value=mock_serializer),
        ):
            response = viewset.update(request)

            mock_serializer.is_valid.assert_called_once_with(raise_exception=True)
            mock_serializer.save.assert_called_once()
            self.assertEqual(response.status_code, status.HTTP_200_OK)


class HealthCheckTests(TestCase):
    """Test health check endpoints."""

    def setUp(self):
        """Set up test client."""
        self.factory = APIRequestFactory()

    def test_health_check_success(self):
        """Test successful health check."""
        request = self.factory.get("/api/health/")

        response = health_check(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "healthy")
        self.assertEqual(response.data["database"], "connected")
        self.assertEqual(response.data["api"], "running")

    @patch("api.views.api_views.connection")
    def test_health_check_database_failure(self, mock_connection):
        """Test health check with database failure."""
        # Mock database connection failure
        mock_cursor = Mock()
        mock_cursor.execute.side_effect = Exception("Database connection failed")
        mock_connection.cursor.return_value.__enter__.return_value = mock_cursor

        request = self.factory.get("/api/health/")

        response = health_check(request)

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data["status"], "unhealthy")
        self.assertEqual(response.data["database"], "disconnected")
        self.assertIn("error", response.data)

    @override_settings(DEBUG=True)
    def test_health_check_detailed_debug_mode(self):
        """Test detailed health check in debug mode."""
        request = self.factory.get("/api/debug/")

        response = health_check_detailed(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("api_status", response.data)
        self.assertIn("request_info", response.data)
        self.assertIn("database_info", response.data)
        self.assertIn("database_counts", response.data)
        self.assertIn("api_endpoints", response.data)
        self.assertIn("settings", response.data)

    @override_settings(DEBUG=False)
    def test_health_check_detailed_production_mode(self):
        """Test detailed health check in production mode."""
        request = self.factory.get("/api/debug/")

        response = health_check_detailed(request)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("error", response.data)

    @override_settings(DEBUG=True)
    def test_debug_echo_post_success(self):
        """Test debug echo with POST request in debug mode."""
        test_data = {"test": "data", "number": 123}
        request = self.factory.post("/api/debug/echo/", test_data, format="json")

        response = debug_echo(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["api_status"], "API is running correctly")
        self.assertEqual(response.data["received_data"], test_data)
        self.assertIn("request_info", response.data)

    @override_settings(DEBUG=False)
    def test_debug_echo_production_mode(self):
        """Test debug echo in production mode."""
        request = self.factory.post("/api/debug/echo/", {}, format="json")

        response = debug_echo(request)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("error", response.data)

    @override_settings(DEBUG=True)
    def test_debug_echo_get_method_not_allowed(self):
        """Test debug echo with GET request."""
        request = self.factory.get("/api/debug/echo/")

        response = debug_echo(request)

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertIn("error", response.data)


class UtilityFunctionTests(TestCase):
    """Test utility functions in api_views."""

    def setUp(self):
        """Set up test data."""
        self.factory = APIRequestFactory()
        # Create test data for model counts
        AssuranceGoalFactory()
        TagFactory()
        TechniqueFactory()
        ResourceTypeFactory()

    def test_sanitize_settings(self):
        """Test _sanitize_settings function."""
        settings_data = _sanitize_settings()

        expected_keys = [
            "DEBUG",
            "ALLOWED_HOSTS",
            "CORS_ALLOWED_ORIGINS",
            "CORS_ALLOW_ALL_ORIGINS",
            "DATABASE_ENGINE",
            "INSTALLED_APPS",
            "MIDDLEWARE",
        ]

        for key in expected_keys:
            self.assertIn(key, settings_data)

    def test_get_database_info(self):
        """Test _get_database_info function."""
        db_info = _get_database_info()

        expected_keys = ["vendor", "queries_executed", "is_usable"]
        for key in expected_keys:
            self.assertIn(key, db_info)

        self.assertIsNotNone(db_info["vendor"])
        self.assertTrue(db_info["is_usable"])

    def test_get_model_counts(self):
        """Test _get_model_counts function."""
        counts = _get_model_counts()

        expected_keys = ["assurance_goals", "tags", "techniques"]
        for key in expected_keys:
            self.assertIn(key, counts)
            self.assertIsInstance(counts[key], int)
            self.assertGreaterEqual(counts[key], 0)

    def test_format_request_info(self):
        """Test _format_request_info function."""
        # Create a request with headers including sensitive data
        request = self.factory.post(
            "/api/test/",
            {"test": "data"},
            HTTP_AUTHORIZATION="Bearer token123",
            HTTP_COOKIE="sessionid=abc123",
            HTTP_CONTENT_TYPE="application/json",
            HTTP_HOST="testserver",
        )

        # Convert to DRF Request
        from rest_framework.request import Request

        drf_request = Request(request)

        request_info = _format_request_info(drf_request)

        expected_keys = ["path", "host", "method", "content_type", "headers"]
        for key in expected_keys:
            self.assertIn(key, request_info)

        # Verify sensitive headers are excluded
        self.assertNotIn("cookie", request_info["headers"])
        self.assertNotIn("authorization", request_info["headers"])

        # Verify case insensitive exclusion
        self.assertNotIn("Cookie", request_info["headers"])
        self.assertNotIn("Authorization", request_info["headers"])

        # Verify non-sensitive headers are included
        self.assertIn("Content-Type", request_info["headers"])
        self.assertIn("Host", request_info["headers"])

    def test_get_api_endpoints(self):
        """Test _get_api_endpoints function."""
        endpoints = _get_api_endpoints()

        expected_endpoints = ["assurance_goals", "tags", "techniques", "debug"]

        for endpoint in expected_endpoints:
            self.assertIn(endpoint, endpoints)
            self.assertIsInstance(endpoints[endpoint], str)
            self.assertTrue(endpoints[endpoint].startswith("/api/"))


class ViewSetConfigurationTests(TestCase):
    """Test viewset configuration and attributes."""

    def test_assurance_goals_viewset_configuration(self):
        """Test AssuranceGoalsViewSet configuration."""
        viewset = AssuranceGoalsViewSet()

        self.assertEqual(viewset.serializer_class.__name__, "AssuranceGoalSerializer")
        self.assertIn("DjangoFilterBackend", [b.__name__ for b in viewset.filter_backends])
        self.assertIn("SearchFilter", [b.__name__ for b in viewset.filter_backends])
        self.assertIn("OrderingFilter", [b.__name__ for b in viewset.filter_backends])

        self.assertIn("name", viewset.filterset_fields)
        self.assertIn("name", viewset.search_fields)
        self.assertIn("description", viewset.search_fields)
        self.assertIn("id", viewset.ordering_fields)
        self.assertIn("name", viewset.ordering_fields)

    def test_tags_viewset_configuration(self):
        """Test TagsViewSet configuration."""
        viewset = TagsViewSet()

        self.assertEqual(viewset.serializer_class.__name__, "TagSerializer")
        self.assertIn("name", viewset.filterset_fields)
        self.assertIn("name", viewset.search_fields)
        self.assertIn("name", viewset.ordering_fields)

    def test_techniques_viewset_configuration(self):
        """Test TechniquesViewSet configuration."""
        viewset = TechniquesViewSet()

        self.assertEqual(viewset.lookup_field, "slug")
        self.assertEqual(viewset.serializer_class.__name__, "TechniqueSerializer")

        expected_filterset_fields = [
            "name",
            "slug",
            "acronym",
            "complexity_rating",
            "computational_cost_rating",
            "assurance_goals",
            "tags",
        ]
        for field in expected_filterset_fields:
            self.assertIn(field, viewset.filterset_fields)

        expected_search_fields = ["name", "description", "acronym"]
        for field in expected_search_fields:
            self.assertIn(field, viewset.search_fields)

        expected_ordering_fields = [
            "slug",
            "name",
            "complexity_rating",
            "computational_cost_rating",
        ]
        for field in expected_ordering_fields:
            self.assertIn(field, viewset.ordering_fields)

    def test_resource_types_viewset_configuration(self):
        """Test ResourceTypesViewSet configuration."""
        viewset = ResourceTypesViewSet()

        self.assertEqual(viewset.serializer_class.__name__, "ResourceTypeSerializer")
        self.assertIn("name", viewset.filterset_fields)
        self.assertIn("name", viewset.search_fields)
        self.assertIn("name", viewset.ordering_fields)


class ViewSetErrorHandlingTests(APITestCase):
    """Test error handling in viewsets."""

    def setUp(self):
        """Set up test data."""
        self.factory = APIRequestFactory()
        from api.tests.conftest import TEST_USER_PASSWORD

        self.user = User.objects.create_user(username="testuser", password=TEST_USER_PASSWORD)
        self.technique = TechniqueFactory()

    def test_techniques_create_with_invalid_serializer(self):
        """Test create method with invalid serializer data."""
        viewset = TechniquesViewSet()
        django_request = self.factory.post("/api/techniques/", {}, format="json")
        force_authenticate(django_request, user=self.user)
        request = Request(django_request)

        # Mock get_serializer to return a serializer that raises validation error
        mock_serializer = Mock()
        mock_serializer.is_valid.side_effect = Exception("Validation failed")

        with patch.object(viewset, "get_serializer", return_value=mock_serializer):
            with self.assertRaises(Exception):
                viewset.create(request)

    def test_techniques_update_with_invalid_serializer(self):
        """Test update method with invalid serializer data."""
        viewset = TechniquesViewSet()
        django_request = self.factory.put(f"/api/techniques/{self.technique.slug}/", {}, format="json")
        force_authenticate(django_request, user=self.user)
        request = Request(django_request)

        # Mock get_object and get_serializer
        mock_serializer = Mock()
        mock_serializer.is_valid.side_effect = Exception("Validation failed")

        with (
            patch.object(viewset, "get_object", return_value=self.technique),
            patch.object(viewset, "get_serializer", return_value=mock_serializer),
        ):
            with self.assertRaises(Exception):
                viewset.update(request, partial=False)


class DatabaseConnectionTests(TestCase):
    """Test database connection scenarios."""

    def setUp(self):
        """Set up test client."""
        self.factory = APIRequestFactory()

    @patch("api.views.api_views.connection")
    def test_health_check_with_assertion_error(self, mock_connection):
        """Test health check when database query returns unexpected result."""
        # Mock database query returning unexpected value
        mock_cursor = Mock()
        mock_cursor.fetchone.return_value = [0]  # Should be [1]
        mock_connection.cursor.return_value.__enter__.return_value = mock_cursor

        request = self.factory.get("/api/health/")

        response = health_check(request)

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data["status"], "unhealthy")

    @override_settings(DEBUG=False)
    def test_get_database_info_production_mode(self):
        """Test _get_database_info in production mode."""
        db_info = _get_database_info()

        # In production mode, query logging is disabled
        self.assertEqual(db_info["queries_executed"], "Query logging disabled")

    @override_settings(DEBUG=True)
    def test_get_database_info_debug_mode(self):
        """Test _get_database_info in debug mode."""
        db_info = _get_database_info()

        # In debug mode, query count should be an integer
        self.assertIsInstance(db_info["queries_executed"], int)
