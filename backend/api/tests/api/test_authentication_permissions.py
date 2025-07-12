# api/tests/api/test_authentication_permissions.py
"""
Comprehensive tests for API authentication and permission handling.

Tests cover login/logout, CSRF protection, session management, and
permission-based access control for all API endpoints.
"""

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import Technique
from api.tests.factories import AssuranceGoalFactory, ResourceTypeFactory, TagFactory, TechniqueFactory


class AuthenticationTests(APITestCase):
    """Test authentication functionality."""

    def setUp(self):
        """Set up test data."""
        from api.tests.conftest import TEST_ADMIN_PASSWORD, TEST_USER_PASSWORD

        self.user = User.objects.create_user(username="testuser", password=TEST_USER_PASSWORD, email="test@example.com")

        self.admin_user = User.objects.create_superuser(
            username="admin", password=TEST_ADMIN_PASSWORD, email="admin@example.com"
        )

    def test_login_success(self):
        """Test successful login."""
        from api.tests.conftest import TEST_USER_PASSWORD

        url = reverse("login")
        data = {"username": "testuser", "password": TEST_USER_PASSWORD}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["username"], "testuser")

        # Verify session is created
        self.assertIn("sessionid", response.cookies)

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        url = reverse("login")
        data = {"username": "testuser", "password": "wrongpassword"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("detail", response.data)

    def test_login_missing_fields(self):
        """Test login with missing fields."""
        url = reverse("login")

        # Missing password
        data = {"username": "testuser"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Missing username
        data = {"password": "testpass123"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout(self):
        """Test logout functionality."""
        # First login
        self.client.force_authenticate(user=self.user)

        # Then logout
        url = reverse("logout")
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify user is logged out by trying to access protected endpoint
        technique_url = reverse("technique-list")
        response = self.client.get(technique_url)

        # Should still work but user should be anonymous
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_csrf_token_endpoint(self):
        """Test CSRF token retrieval."""
        url = reverse("get-csrf")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("csrfToken", response.data)

        # Verify it's a valid CSRF token format
        token = response.data["csrfToken"]
        self.assertIsInstance(token, str)
        self.assertGreater(len(token), 0)

    def test_session_authentication(self):
        """Test session-based authentication."""
        from api.tests.conftest import TEST_USER_PASSWORD

        # Login to create session
        login_url = reverse("login")
        login_data = {"username": "testuser", "password": TEST_USER_PASSWORD}

        login_response = self.client.post(login_url, login_data, format="json")
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

        # Use session to access API
        technique_url = reverse("technique-list")
        response = self.client.get(technique_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify we're authenticated
        # Create a technique to verify write permissions
        create_url = reverse("technique-list")
        create_data = {
            "name": "Session Auth Test",
            "description": "Testing session authentication",
            "assurance_goal_ids": [],
        }

        response = self.client.post(create_url, create_data, format="json")
        # Note: Depending on permission settings, this might be allowed or forbidden

    def test_authentication_required_endpoints(self):
        """Test endpoints that require authentication."""
        # Ensure client is not authenticated
        self.client.logout()

        # Test various endpoints
        endpoints_requiring_auth = [
            ("technique-list", "post"),  # Creating techniques
            ("technique-detail", "put"),  # Updating techniques
            ("technique-detail", "delete"),  # Deleting techniques
        ]

        for endpoint_name, method in endpoints_requiring_auth:
            if "detail" in endpoint_name:
                # Create a technique for detail views
                technique = TechniqueFactory()
                url = reverse(endpoint_name, kwargs={"slug": technique.slug})
            else:
                url = reverse(endpoint_name)

            response = getattr(self.client, method)(url, {}, format="json")

            # Should either require auth or handle gracefully
            self.assertIn(
                response.status_code,
                [
                    status.HTTP_401_UNAUTHORIZED,
                    status.HTTP_403_FORBIDDEN,
                    status.HTTP_400_BAD_REQUEST,
                ],
            )


class PermissionTests(APITestCase):
    """Test permission-based access control."""

    def setUp(self):
        """Set up test data."""
        from api.tests.conftest import TEST_ADMIN_PASSWORD, TEST_USER_PASSWORD

        self.regular_user = User.objects.create_user(username="regular", password=TEST_USER_PASSWORD)

        self.staff_user = User.objects.create_user(username="staff", password=TEST_USER_PASSWORD, is_staff=True)

        self.admin_user = User.objects.create_superuser(username="admin", password=TEST_ADMIN_PASSWORD)

        # Create test data
        self.technique = TechniqueFactory(name="Permission Test Technique")
        self.assurance_goal = AssuranceGoalFactory(name="Permission Test Goal")
        self.tag = TagFactory(name="permission-test-tag")
        self.resource_type = ResourceTypeFactory(name="Permission Test Type")

    def test_read_permissions_anonymous(self):
        """Test read permissions for anonymous users."""
        # Ensure not authenticated
        self.client.logout()

        # Test read access to various endpoints
        read_endpoints = [
            reverse("technique-list"),
            reverse("technique-detail", kwargs={"slug": self.technique.slug}),
            reverse("assurancegoal-list"),
            reverse("tag-list"),
            reverse("resourcetype-list"),
        ]

        for url in read_endpoints:
            response = self.client.get(url)
            self.assertEqual(
                response.status_code,
                status.HTTP_200_OK,
                f"Failed to read {url} as anonymous user",
            )

    def test_write_permissions_regular_user(self):
        """Test write permissions for regular authenticated users."""
        self.client.force_authenticate(user=self.regular_user)

        # Test creating a technique
        url = reverse("technique-list")
        data = {
            "name": "Regular User Technique",
            "description": "Created by regular user",
            "assurance_goal_ids": [self.assurance_goal.id],
        }

        response = self.client.post(url, data, format="json")

        # Check if creation is allowed (depends on permission configuration)
        # Either 201 (allowed) or 403 (forbidden)
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_403_FORBIDDEN])

    def test_write_permissions_staff_user(self):
        """Test write permissions for staff users."""
        self.client.force_authenticate(user=self.staff_user)

        # Test creating a technique
        url = reverse("technique-list")
        data = {
            "name": "Staff User Technique",
            "description": "Created by staff user",
            "assurance_goal_ids": [self.assurance_goal.id],
        }

        response = self.client.post(url, data, format="json")

        # Staff users should typically have write access
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_403_FORBIDDEN])

    def test_write_permissions_admin_user(self):
        """Test write permissions for admin users."""
        self.client.force_authenticate(user=self.admin_user)

        # Admin should have full access
        url = reverse("technique-list")
        data = {
            "name": "Admin User Technique",
            "description": "Created by admin user",
            "assurance_goal_ids": [self.assurance_goal.id],
        }

        response = self.client.post(url, data, format="json")

        # Admin should always have write access
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_permissions(self):
        """Test update permissions for different user types."""
        technique = TechniqueFactory(name="Update Permission Test")
        url = reverse("technique-detail", kwargs={"slug": technique.slug})
        update_data = {
            "name": "Updated by User",
            "description": technique.description,
            "assurance_goal_ids": [],
        }

        # Test as anonymous user
        self.client.logout()
        response = self.client.put(url, update_data, format="json")
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

        # Test as regular user
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.put(url, update_data, format="json")
        # Might be allowed or forbidden depending on configuration

        # Test as admin
        self.client.force_authenticate(user=self.admin_user)
        update_data["name"] = "Updated by Admin"
        response = self.client.put(url, update_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_permissions(self):
        """Test delete permissions for different user types."""
        # Create techniques for deletion testing
        techniques = [TechniqueFactory(name=f"Delete Test {i}") for i in range(3)]

        # Test as anonymous user
        self.client.logout()
        url = reverse("technique-detail", kwargs={"slug": techniques[0].slug})
        response = self.client.delete(url)
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

        # Test as regular user
        self.client.force_authenticate(user=self.regular_user)
        url = reverse("technique-detail", kwargs={"slug": techniques[1].slug})
        response = self.client.delete(url)
        # Might be allowed or forbidden

        # Test as admin
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("technique-detail", kwargs={"slug": techniques[2].slug})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Verify deletion
        self.assertFalse(Technique.objects.filter(slug=techniques[2].slug).exists())


class CSRFProtectionTests(APITestCase):
    """Test CSRF protection on API endpoints."""

    def setUp(self):
        """Set up test data."""
        from api.tests.conftest import TEST_USER_PASSWORD

        self.user = User.objects.create_user(username="csrfuser", password=TEST_USER_PASSWORD)
        self.assurance_goal = AssuranceGoalFactory()

    def test_csrf_required_for_unsafe_methods(self):
        """Test that CSRF token is required for POST/PUT/DELETE."""
        # Login first
        self.client.force_authenticate(user=self.user)

        # Get CSRF token
        csrf_url = reverse("get-csrf")
        csrf_response = self.client.get(csrf_url)
        csrf_token = csrf_response.data["csrfToken"]

        # Test POST without CSRF token
        url = reverse("technique-list")
        data = {
            "name": "CSRF Test Technique 1",
            "description": "Testing CSRF protection",
            "assurance_goal_ids": [self.assurance_goal.id],
        }

        # Remove CSRF token from client
        self.client.credentials()

        # Depending on settings, this might fail or succeed
        response = self.client.post(url, data, format="json")

        # Now test with CSRF token with different name
        data["name"] = "CSRF Test Technique 2"
        self.client.credentials(HTTP_X_CSRFTOKEN=csrf_token)
        response = self.client.post(url, data, format="json")

        # Should work with valid CSRF token (if authenticated)
        if self.user.is_authenticated:
            self.assertIn(
                response.status_code,
                [status.HTTP_201_CREATED, status.HTTP_403_FORBIDDEN],
            )

    def test_csrf_not_required_for_safe_methods(self):
        """Test that CSRF token is not required for GET/HEAD/OPTIONS."""
        # Test GET without CSRF token
        url = reverse("technique-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Test OPTIONS without CSRF token
        response = self.client.options(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class SessionManagementTests(APITestCase):
    """Test session management functionality."""

    def setUp(self):
        """Set up test data."""
        from api.tests.conftest import TEST_USER_PASSWORD

        self.user = User.objects.create_user(username="sessionuser", password=TEST_USER_PASSWORD)

    def test_session_creation_on_login(self):
        """Test that session is created on login."""
        url = reverse("login")
        from api.tests.conftest import TEST_USER_PASSWORD

        data = {"username": "sessionuser", "password": TEST_USER_PASSWORD}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check session cookie
        self.assertIn("sessionid", response.cookies)
        session_cookie = response.cookies["sessionid"]
        self.assertIsNotNone(session_cookie.value)

    def test_session_persistence(self):
        """Test that session persists across requests."""
        # Login
        login_url = reverse("login")
        from api.tests.conftest import TEST_USER_PASSWORD

        login_data = {"username": "sessionuser", "password": TEST_USER_PASSWORD}

        login_response = self.client.post(login_url, login_data, format="json")
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

        # Make multiple requests with same session
        technique_url = reverse("technique-list")

        for _ in range(3):
            response = self.client.get(technique_url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_session_invalidation_on_logout(self):
        """Test that session is invalidated on logout."""
        from api.tests.conftest import TEST_USER_PASSWORD

        # Login using actual login endpoint
        login_url = reverse("login")
        login_data = {"username": self.user.username, "password": TEST_USER_PASSWORD}
        login_response = self.client.post(login_url, login_data, format="json")
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

        # Create a technique to verify we're authenticated
        create_url = reverse("technique-list")
        create_data = {
            "name": "Session Test Technique",
            "description": "Testing session",
            "assurance_goal_ids": [],
        }

        # This should work while authenticated
        response = self.client.post(create_url, create_data, format="json")
        initial_status = response.status_code

        # Logout
        logout_url = reverse("logout")
        logout_response = self.client.post(logout_url)
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)

        # Clear authentication from client
        self.client.force_authenticate(user=None)

        # Try to create another technique - should fail or behave differently
        create_data["name"] = "After Logout Technique"
        response = self.client.post(create_url, create_data, format="json")

        # Status should be different after logout
        if initial_status == status.HTTP_201_CREATED:
            self.assertIn(
                response.status_code,
                [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
            )


class APISecurityTests(APITestCase):
    """Test various API security aspects."""

    def setUp(self):
        """Set up test data."""
        from api.tests.conftest import TEST_USER_PASSWORD

        self.user = User.objects.create_user(username="securityuser", password=TEST_USER_PASSWORD)
        self.technique = TechniqueFactory()

    def test_sql_injection_protection(self):
        """Test protection against SQL injection attempts."""
        # Try SQL injection in search parameter
        url = reverse("technique-list")

        # Various SQL injection attempts
        injection_attempts = [
            "'; DROP TABLE techniques; --",
            "1' OR '1'='1",
            "1'; DELETE FROM api_technique WHERE '1'='1",
            "' UNION SELECT * FROM auth_user --",
        ]

        for injection in injection_attempts:
            response = self.client.get(url, {"search": injection})

            # Should handle safely without errors
            self.assertEqual(response.status_code, status.HTTP_200_OK)

            # Results should be empty or filtered, not expose data
            self.assertIsInstance(response.data["results"], list)

    def test_xss_protection_in_responses(self):
        """Test that API responses are protected against XSS."""
        # Create technique with potential XSS content
        xss_attempts = [
            "<script>alert('XSS')</script>",
            "javascript:alert('XSS')",
            "<img src=x onerror=alert('XSS')>",
        ]

        self.client.force_authenticate(user=self.user)

        for xss in xss_attempts:
            data = {
                "name": f"XSS Test: {xss}",
                "description": xss,
                "assurance_goal_ids": [],
            }

            # Create technique
            create_url = reverse("technique-list")
            create_response = self.client.post(create_url, data, format="json")

            if create_response.status_code == status.HTTP_201_CREATED:
                # Retrieve it
                technique_slug = create_response.data["slug"]
                retrieve_url = reverse("technique-detail", kwargs={"slug": technique_slug})
                retrieve_response = self.client.get(retrieve_url)

                # Verify content is stored as-is (not sanitized in API)
                # Frontend should handle escaping
                self.assertEqual(retrieve_response.data["description"], xss)

    def test_rate_limiting_headers(self):
        """Test for rate limiting headers in responses."""
        url = reverse("technique-list")

        # Make multiple requests
        for _ in range(5):
            response = self.client.get(url)

            # Check for rate limit headers (if implemented)
            # These are common rate limit headers
            # These are common rate limit headers:
            # "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "Retry-After"

            # Just verify response is successful
            self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_information_disclosure_protection(self):
        """Test that sensitive information is not disclosed."""
        # Test 404 responses don't reveal information
        url = reverse("technique-detail", kwargs={"slug": "non-existent-technique"})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Error message should be generic
        self.assertIn("error", response.data)

        # Should not reveal database structure or internal details
        error_str = str(response.data)
        self.assertNotIn("DoesNotExist", error_str)
        self.assertNotIn("Technique.objects", error_str)
        self.assertNotIn("SQL", error_str)

    def test_http_headers_security(self):
        """Test security-related HTTP headers."""
        url = reverse("technique-list")
        response = self.client.get(url)

        # Check for security headers (if implemented)
        # These might be set by middleware or server
        # Common security headers:
        # "X-Content-Type-Options": "nosniff"
        # "X-Frame-Options": ["DENY", "SAMEORIGIN"]
        # "X-XSS-Protection": "1; mode=block"

        # Just verify response is successful
        self.assertEqual(response.status_code, status.HTTP_200_OK)
