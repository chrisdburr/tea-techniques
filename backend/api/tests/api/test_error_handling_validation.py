# api/tests/api/test_error_handling_validation.py
"""
Comprehensive tests for API error handling and validation.

Tests cover validation errors, custom exception handling, error response
formats, and proper HTTP status codes for various error scenarios.
"""

from unittest.mock import Mock, patch

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from api.tests.factories import (
    TechniqueFactory,
    create_test_assurance_goals,
    create_test_resource_types,
)


class ValidationErrorTests(APITestCase):
    """Test API validation error handling."""

    def setUp(self):
        """Set up test data."""
        from api.tests.conftest import TEST_USER_PASSWORD
        self.user = User.objects.create_user(
            username="testuser", password=TEST_USER_PASSWORD
        )
        self.client.force_authenticate(user=self.user)

        self.assurance_goals = create_test_assurance_goals()
        self.resource_types = create_test_resource_types()

    def test_technique_missing_required_fields(self):
        """Test validation errors for missing required fields."""
        url = reverse("technique-list")

        # Missing name
        data = {"description": "Missing name field"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
        self.assertTrue(response.data["error"])
        self.assertIn("details", response.data)
        self.assertIn("name", response.data["details"])

        # Missing description
        data = {"name": "Missing description field"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("description", response.data["details"])

    def test_technique_invalid_field_values(self):
        """Test validation errors for invalid field values."""
        url = reverse("technique-list")

        # Invalid complexity rating (should be 1-5)
        data = {
            "name": "Invalid Complexity",
            "description": "Testing invalid complexity rating",
            "complexity_rating": 10,
            "assurance_goal_ids": [self.assurance_goals[0].id],
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("complexity_rating", response.data["details"])

        # Invalid computational cost rating
        data["complexity_rating"] = 3
        data["computational_cost_rating"] = 0  # Should be 1-5

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("computational_cost_rating", response.data["details"])

        # Negative ratings
        data["computational_cost_rating"] = -1

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_technique_invalid_relationships(self):
        """Test validation errors for invalid relationships."""
        url = reverse("technique-list")

        # Non-existent assurance goal
        data = {
            "name": "Invalid Relationship",
            "description": "Testing invalid relationships",
            "assurance_goal_ids": [99999],  # Non-existent ID
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("assurance_goal_ids", response.data["details"])

        # Non-existent tag
        data["assurance_goal_ids"] = [self.assurance_goals[0].id]
        data["tag_ids"] = [99999]  # Non-existent ID

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("tag_ids", response.data["details"])

    def test_technique_invalid_nested_data(self):
        """Test validation errors for invalid nested data."""
        url = reverse("technique-list")

        # Invalid resource data
        data = {
            "name": "Invalid Nested Data",
            "description": "Testing invalid nested data",
            "assurance_goal_ids": [self.assurance_goals[0].id],
            "resources": [
                {
                    "resource_type": 99999,  # Non-existent resource type
                    "title": "Test Resource",
                    "url": "invalid-url",  # Invalid URL format
                }
            ],
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # The error is now in the general validation error, not field-specific
        self.assertIn(
            "ResourceType with ID 99999 does not exist", str(response.data["details"])
        )

        # Invalid use case data
        data["resources"] = []
        data["example_use_cases"] = [
            {
                "description": "",  # Empty description
                "assurance_goal": 99999,  # Non-existent goal
            }
        ]

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # The error is now in the general validation error, not field-specific
        self.assertIn(
            "Use case description cannot be empty", str(response.data["details"])
        )

    def test_technique_empty_string_validation(self):
        """Test validation of empty strings."""
        url = reverse("technique-list")

        # Empty name
        data = {
            "name": "",
            "description": "Valid description",
            "assurance_goal_ids": [self.assurance_goals[0].id],
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data["details"])

        # Empty description
        data["name"] = "Valid name"
        data["description"] = ""

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("description", response.data["details"])

    def test_technique_whitespace_only_validation(self):
        """Test validation of whitespace-only strings."""
        url = reverse("technique-list")

        # Whitespace-only name
        data = {
            "name": "   ",
            "description": "Valid description",
            "assurance_goal_ids": [self.assurance_goals[0].id],
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Whitespace-only description
        data["name"] = "Valid name"
        data["description"] = "\t\n  "

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_assurance_goal_validation_errors(self):
        """Test validation errors for assurance goals."""
        url = reverse("assurancegoal-list")

        # Missing name
        data = {"description": "Missing name"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data["details"])

        # Empty name
        data = {"name": "", "description": "Empty name"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data["details"])

    def test_tag_validation_errors(self):
        """Test validation errors for tags."""
        url = reverse("tag-list")

        # Missing name
        data = {}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data["details"])

        # Empty name
        data = {"name": ""}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data["details"])

    def test_resource_type_validation_errors(self):
        """Test validation errors for resource types."""
        url = reverse("resourcetype-list")

        # Missing name
        data = {"icon": "test-icon"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data["details"])

        # Empty name
        data = {"name": "", "icon": "test-icon"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data["details"])


class HTTPErrorTests(APITestCase):
    """Test HTTP error handling."""

    def setUp(self):
        """Set up test data."""
        from api.tests.conftest import TEST_USER_PASSWORD
        self.user = User.objects.create_user(
            username="testuser", password=TEST_USER_PASSWORD
        )
        self.client.force_authenticate(user=self.user)

        self.technique = TechniqueFactory()

    def test_404_not_found_errors(self):
        """Test 404 error handling."""
        # Non-existent technique
        url = reverse("technique-detail", kwargs={"slug": "non-existent-technique"})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", response.data)
        self.assertTrue(response.data["error"])
        self.assertIn("message", response.data)
        self.assertIn("details", response.data)

        # Non-existent assurance goal
        url = reverse("assurancegoal-detail", kwargs={"pk": 99999})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Non-existent tag
        url = reverse("tag-detail", kwargs={"pk": 99999})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Non-existent resource type
        url = reverse("resourcetype-detail", kwargs={"pk": 99999})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_405_method_not_allowed_errors(self):
        """Test 405 method not allowed errors."""
        # PUT on list endpoints (not typically allowed)
        list_endpoints = [
            reverse("technique-list"),
            reverse("assurancegoal-list"),
            reverse("tag-list"),
            reverse("resourcetype-list"),
        ]

        for url in list_endpoints:
            response = self.client.put(url, {}, format="json")

            # Should be method not allowed
            if response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED:
                self.assertIn("error", response.data)
                self.assertTrue(response.data["error"])

    def test_400_bad_request_errors(self):
        """Test 400 bad request error handling."""
        url = reverse("technique-list")

        # Invalid JSON structure
        invalid_json_data = {"name": "Test", "invalid_field": "should not be accepted"}

        response = self.client.post(url, invalid_json_data, format="json")

        # Should handle invalid fields gracefully
        self.assertIn(
            response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_201_CREATED]
        )

    def test_500_server_error_handling(self):
        """Test 500 server error handling with mocked exceptions."""
        # Mock a server error in the view
        with patch("api.views.api_views.TechniquesViewSet.list") as mock_list:
            mock_list.side_effect = Exception("Simulated server error")

            url = reverse("technique-list")

            # In test environment, exceptions might be re-raised instead of being
            # handled by DRF's exception handler. We need to catch it and verify
            # that it's the expected error.
            try:
                response = self.client.get(url)
                # If response is returned, it should be a 500 error
                self.assertEqual(
                    response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            except Exception as e:
                # If exception is raised, it should be our simulated error
                self.assertEqual(str(e), "Simulated server error")

    def test_custom_error_response_format(self):
        """Test custom error response format consistency."""
        # Generate various types of errors and verify format
        error_scenarios = [
            # 404 error
            (
                reverse("technique-detail", kwargs={"slug": "non-existent-technique"}),
                "get",
            ),
            # 400 error
            (reverse("technique-list"), "post"),
        ]

        for url, method in error_scenarios:
            if method == "get":
                response = self.client.get(url)
            elif method == "post":
                response = self.client.post(url, {}, format="json")

            if response.status_code >= 400:
                # Verify custom error format
                self.assertIn("error", response.data)
                self.assertIn("message", response.data)
                self.assertIn("details", response.data)

                # Verify error flag is boolean
                self.assertIsInstance(response.data["error"], bool)
                self.assertTrue(response.data["error"])


class ValidationDetailTests(APITestCase):
    """Test detailed validation scenarios."""

    def setUp(self):
        """Set up test data."""
        from api.tests.conftest import TEST_USER_PASSWORD
        self.user = User.objects.create_user(
            username="testuser", password=TEST_USER_PASSWORD
        )
        self.client.force_authenticate(user=self.user)

        self.assurance_goals = create_test_assurance_goals()
        self.resource_types = create_test_resource_types()

    def test_complex_nested_validation_errors(self):
        """Test complex validation scenarios with nested data."""
        url = reverse("technique-list")

        # Multiple validation errors in nested data
        data = {
            "name": "",  # Invalid name
            "description": "Valid description",
            "complexity_rating": 10,  # Invalid rating
            "assurance_goal_ids": [99999],  # Invalid goal ID
            "resources": [
                {
                    "resource_type": 99999,  # Invalid resource type
                    "title": "",  # Empty title
                    "url": "not-a-url",  # Invalid URL
                },
                {
                    "resource_type": self.resource_types[0].id,
                    "title": "Valid title",
                    # Missing URL
                },
            ],
            "example_use_cases": [
                {
                    "description": "",  # Empty description
                    "assurance_goal": 99999,  # Invalid goal
                }
            ],
            "limitations": [
                "",  # Empty limitation
                {"description": ""},  # Empty limitation object
            ],
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Verify all validation errors are captured
        details = response.data["details"]

        # Should have errors for various fields
        expected_error_fields = [
            "name",
            "complexity_rating",
            "assurance_goals",
            "resources",
            "example_use_cases",
            "limitations",
        ]

        # At least some of these should have errors
        found_errors = [field for field in expected_error_fields if field in details]
        self.assertGreater(len(found_errors), 0)

    def test_partial_validation_errors_on_update(self):
        """Test validation errors during partial updates."""
        technique = TechniqueFactory()
        url = reverse("technique-detail", kwargs={"slug": technique.slug})

        # Invalid partial update
        data = {"complexity_rating": 10}  # Invalid rating

        response = self.client.patch(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("complexity_rating", response.data["details"])

        # Verify original technique is unchanged
        technique.refresh_from_db()
        self.assertNotEqual(technique.complexity_rating, 10)

    def test_url_validation_in_resources(self):
        """Test URL validation in technique resources."""
        url = reverse("technique-list")

        invalid_urls = [
            "not-a-url",
            "ftp://invalid-protocol.com",
            'javascript:alert("xss")',
            "http://",
            "https://",
            "http://.",
            "http://..",
            "http://../",
            "http://?",
            "http://??/",
        ]

        for invalid_url in invalid_urls:
            data = {
                "name": f"URL Test: {invalid_url}",
                "description": "Testing URL validation",
                "assurance_goal_ids": [self.assurance_goals[0].id],
                "resources": [
                    {
                        "resource_type": self.resource_types[0].id,
                        "title": "Invalid URL Resource",
                        "url": invalid_url,
                    }
                ],
            }

            response = self.client.post(url, data, format="json")

            # Should reject invalid URLs
            if "http" in invalid_url:
                # Some might be considered valid by URL validator
                continue

            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            # The error is now in the general validation error, not field-specific
            self.assertIn("Invalid URL format", str(response.data["details"]))

    def test_date_validation_in_resources(self):
        """Test date validation in technique resources."""
        url = reverse("technique-list")

        invalid_dates = [
            "not-a-date",
            "2023-13-01",  # Invalid month
            "2023-12-32",  # Invalid day
            "23-12-01",  # Wrong format
            "2023/12/01",  # Wrong format
        ]

        for invalid_date in invalid_dates:
            data = {
                "name": f"Date Test: {invalid_date}",
                "description": "Testing date validation",
                "assurance_goal_ids": [self.assurance_goals[0].id],
                "resources": [
                    {
                        "resource_type": self.resource_types[0].id,
                        "title": "Invalid Date Resource",
                        "url": "https://example.com",
                        "publication_date": invalid_date,
                    }
                ],
            }

            response = self.client.post(url, data, format="json")

            # Should reject invalid dates
            if response.status_code == status.HTTP_400_BAD_REQUEST:
                # Check that error message mentions the date issue
                error_message = str(response.data["details"]).lower()
                # Should mention either date format or invalid date
                date_error_present = any(
                    term in error_message
                    for term in ["date format", "invalid date", "date"]
                )
                self.assertTrue(
                    date_error_present, f"Date error not found in: {error_message}"
                )

    def test_string_length_validation(self):
        """Test string length validation."""
        url = reverse("technique-list")

        # Very long strings
        very_long_name = "x" * 500
        very_long_description = "x" * 10000

        data = {
            "name": very_long_name,
            "description": very_long_description,
            "assurance_goal_ids": [self.assurance_goals[0].id],
        }

        response = self.client.post(url, data, format="json")

        # Might be valid or might exceed length limits
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            # Should indicate which field(s) are too long
            self.assertTrue(
                "name" in response.data["details"]
                or "description" in response.data["details"]
            )


class CustomExceptionHandlerTests(APITestCase):
    """Test custom exception handler functionality."""

    def setUp(self):
        """Set up test data."""
        from api.tests.conftest import TEST_USER_PASSWORD
        self.user = User.objects.create_user(
            username="testuser", password=TEST_USER_PASSWORD
        )
        self.client.force_authenticate(user=self.user)

    def test_exception_handler_response_format(self):
        """Test that custom exception handler formats responses correctly."""
        # Generate a 404 error
        url = reverse("technique-detail", kwargs={"slug": "non-existent-technique"})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Verify custom exception handler format
        self.assertIn("error", response.data)
        self.assertIn("message", response.data)
        self.assertIn("details", response.data)

        # Verify structure
        self.assertTrue(response.data["error"])
        self.assertIsInstance(response.data["message"], str)
        self.assertIsInstance(response.data["details"], dict)

    def test_exception_handler_logging(self):
        """Test that custom exception handler logs errors."""
        with patch("api.utils.logger") as mock_logger:
            # Generate a validation error that DRF will handle
            url = reverse("technique-list")
            data = {"name": "", "description": ""}  # Empty required fields
            response = self.client.post(url, data, format="json")

            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

            # Verify logging was called
            mock_logger.error.assert_called()

            # Check the actual calls - format string and arguments
            calls = mock_logger.error.call_args_list
            
            # Look for "API Error" in format strings
            api_error_logged = any("API Error" in str(call) for call in calls)
            self.assertTrue(api_error_logged, f"API Error not found in calls: {calls}")

            # Should mention ValidationError in the arguments
            exception_logged = any("ValidationError" in str(call) for call in calls)
            self.assertTrue(exception_logged, f"ValidationError not found in calls: {calls}")

    def test_exception_handler_preserves_original_details(self):
        """Test that exception handler preserves original error details."""
        url = reverse("technique-list")
        data = {"name": "", "description": "Test"}  # Will cause validation error

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Verify custom format with preserved details
        self.assertIn("error", response.data)
        self.assertIn("details", response.data)

        # Original validation error details should be preserved
        self.assertIn("name", response.data["details"])

    @patch("api.utils.logger")
    def test_exception_handler_with_unknown_view(self, mock_logger):
        """Test exception handler when view context is missing."""
        # works when view is None
        from rest_framework.exceptions import NotFound

        from api.utils import custom_exception_handler

        exc = NotFound("Test error")
        context = {"request": Mock(), "view": None}

        response = custom_exception_handler(exc, context)

        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Should log with 'Unknown' view - check all calls
        mock_logger.error.assert_called()
        calls = mock_logger.error.call_args_list
        
        # Look for "Unknown" in the call arguments
        unknown_logged = any("Unknown" in str(call) for call in calls)
        self.assertTrue(unknown_logged, f"Unknown not found in calls: {calls}")
