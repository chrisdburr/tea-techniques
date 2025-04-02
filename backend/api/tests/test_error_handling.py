from rest_framework.test import APIClient
from rest_framework import status
import pytest
from django.urls import reverse
from django.contrib.auth.models import User


@pytest.mark.django_db
class TestErrorHandling:
    def setup_method(self):
        # Create test user
        self.username = "testuser"
        self.password = "testpassword"
        self.user = User.objects.create_user(
            username=self.username, 
            password=self.password,
            email="test@example.com"
        )
        
        self.client = APIClient()
        # Use the base API URL without trailing slash as configured in urls.py
        self.techniques_url = "/api/techniques"
    
    def test_not_found_error_format(self):
        """Test that 404 errors return the standardized error format."""
        # Try to access a non-existent technique ID
        response = self.client.get(f"{self.techniques_url}/99999")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
        # Check the response has our standardized format
        assert "detail" in response.data
        assert "status_code" in response.data
        assert "error_type" in response.data
        
        # The exact wording may vary, so just check for status code and error type
        assert response.data["status_code"] == 404
    
    def test_bad_request_error_format(self):
        """Test that bad request errors return the standardized error format."""
        # Authenticate first since we need to create a technique
        self.client.force_authenticate(user=self.user)
        
        # Create a technique with invalid data (missing required fields)
        response = self.client.post(self.techniques_url, 
                                    {"name": ""}, # Empty name is invalid
                                    format="json")
        
        # Now verify the error format
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Check standardized error format
        assert "detail" in response.data
        assert "status_code" in response.data
        assert "error_type" in response.data
        
        # Should have either errors or the detail message
        assert response.data["status_code"] == 400
        assert response.data["error_type"] == "ValidationError"
        
    def test_permission_error_format(self):
        """Test that permission errors return the standardized error format."""
        # In Django REST Framework, unauthenticated requests that need authentication
        # often return 403 Forbidden rather than 401 Unauthorized
        response = self.client.post(
            self.techniques_url,
            {"name": "Test Technique", "description": "Description"},
            format="json"
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        
        # Check standardized error format
        assert "detail" in response.data
        assert "status_code" in response.data
        assert "error_type" in response.data
        
        assert response.data["status_code"] == 403
    
    def test_create_error_format(self):
        """Test that validation errors during creation return the standardized error format."""
        # Authenticate as a regular user
        self.client.force_authenticate(user=self.user)
        
        # Create a technique with missing required fields
        invalid_data = {
            "name": "Test Technique",
            # Missing model_dependency which is required
        }
        
        response = self.client.post(self.techniques_url, invalid_data, format="json")
        
        # It should give a validation error
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Check standardized error format
        assert "detail" in response.data
        assert "status_code" in response.data
        assert "error_type" in response.data
        assert "errors" in response.data
        
        assert response.data["status_code"] == 400
        assert response.data["error_type"] == "ValidationError"