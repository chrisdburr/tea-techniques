# api/tests/unit/views/test_auth_views.py
"""
Unit tests for auth views to improve coverage.
"""

import json

from django.contrib.auth.models import AnonymousUser, User
from django.test import RequestFactory, TestCase
from rest_framework import status
from rest_framework.test import APIClient, APITestCase


class AuthViewsTests(APITestCase):
    """Test auth views functionality."""

    def setUp(self):
        """Set up test data."""
        from api.tests.conftest import TEST_USER_PASSWORD
        self.client = APIClient()
        self.factory = RequestFactory()
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password=TEST_USER_PASSWORD
        )

    def test_get_csrf_token(self):
        """Test getting CSRF token."""
        response = self.client.get("/api/auth/csrf")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("csrfToken", response.data)
        self.assertIsNotNone(response.data["csrfToken"])

    def test_login_view_success(self):
        """Test successful login."""
        login_data = {"username": "testuser", "password": "testpass123"}
        response = self.client.post(
            "/api/auth/login",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["username"], "testuser")
        self.assertEqual(response.data["user"]["email"], "test@example.com")

    def test_login_view_invalid_credentials(self):
        """Test login with invalid credentials."""
        login_data = {"username": "testuser", "password": "wrongpassword"}
        response = self.client.post(
            "/api/auth/login",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("detail", response.data)
        self.assertEqual(response.data["detail"], "Invalid credentials")

    def test_login_view_missing_username(self):
        """Test login with missing username."""
        login_data = {"password": "testpass123"}
        response = self.client.post(
            "/api/auth/login",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)
        self.assertEqual(
            response.data["detail"], "Please provide both username and password"
        )

    def test_login_view_missing_password(self):
        """Test login with missing password."""
        login_data = {"username": "testuser"}
        response = self.client.post(
            "/api/auth/login",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)
        self.assertEqual(
            response.data["detail"], "Please provide both username and password"
        )

    def test_logout_view_authenticated(self):
        """Test logout when authenticated."""
        # First login
        self.client.force_authenticate(user=self.user)

        response = self.client.post("/api/auth/logout")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("detail", response.data)
        self.assertEqual(response.data["detail"], "Successfully logged out")

    def test_logout_view_unauthenticated(self):
        """Test logout when not authenticated."""
        response = self.client.post("/api/auth/logout")

        # Should return 403 Forbidden due to IsAuthenticated permission
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_view_authenticated(self):
        """Test user view when authenticated."""
        # Login first
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/auth/user")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.user.id)
        self.assertEqual(response.data["username"], self.user.username)
        self.assertEqual(response.data["email"], self.user.email)
        self.assertEqual(response.data["isStaff"], self.user.is_staff)

    def test_user_view_unauthenticated(self):
        """Test user view when not authenticated."""
        response = self.client.get("/api/auth/user")

        # Should return 403 Forbidden due to IsAuthenticated permission
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_auth_status_view_authenticated(self):
        """Test auth status view when authenticated."""
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/auth/status")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["isAuthenticated"])
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["id"], self.user.id)
        self.assertEqual(response.data["user"]["username"], self.user.username)
        self.assertEqual(response.data["user"]["email"], self.user.email)
        self.assertEqual(response.data["user"]["isStaff"], self.user.is_staff)

    def test_auth_status_view_unauthenticated(self):
        """Test auth status view when not authenticated."""
        response = self.client.get("/api/auth/status")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["isAuthenticated"])
        self.assertNotIn("user", response.data)
