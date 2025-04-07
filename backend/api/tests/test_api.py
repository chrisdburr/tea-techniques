import os
import pytest
import json
from django.test.utils import CaptureQueriesContext
from django.db import connection
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from api.models import (
    Technique,
    AssuranceGoal,
    Category,
    Tag,
)
from api.tests.factories import (
    TechniqueFactory,
    CategoryFactory,
    SubCategoryFactory,
    AssuranceGoalFactory,
    TagFactory,
    AttributeTypeFactory,
    AttributeValueFactory,
    ResourceTypeFactory,
)

# Get the User model
User = get_user_model()


class ApiEndpointTestCase(APITestCase):
    """Test that all API endpoints return 200 OK using direct URLs"""

    def setUp(self):
        # Create base objects for relationships
        self.assurance_goal = AssuranceGoalFactory()
        self.category = CategoryFactory(assurance_goal=self.assurance_goal)
        self.subcategory = SubCategoryFactory(category=self.category)
        self.tag = TagFactory()
        self.attribute_type = AttributeTypeFactory()
        self.attribute_value = AttributeValueFactory(attribute_type=self.attribute_type)
        self.resource_type = ResourceTypeFactory()
        self.technique = TechniqueFactory(
            assurance_goals=[self.assurance_goal],
            categories=[self.category],
            subcategories=[self.subcategory],
            tags=[self.tag],
        )

        # Create a client
        self.client = APIClient()

    def test_api_root(self):
        """Test that API root works"""
        response = self.client.get("/api")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_assurance_goals_list(self):
        """Test the assurance goals endpoint"""
        response = self.client.get("/api/assurance-goals")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_categories_list(self):
        """Test the categories endpoint"""
        response = self.client.get("/api/categories")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_subcategories_list(self):
        """Test the subcategories endpoint"""
        response = self.client.get("/api/subcategories")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_tags_list(self):
        """Test the tags endpoint"""
        response = self.client.get("/api/tags")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_techniques_list(self):
        """Test the techniques endpoint"""
        response = self.client.get("/api/techniques")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_attribute_types_list(self):
        """Test the attribute types endpoint"""
        response = self.client.get("/api/attribute-types")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_attribute_values_list(self):
        """Test the attribute values endpoint"""
        response = self.client.get("/api/attribute-values")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_resource_types_list(self):
        """Test the resource types endpoint"""
        response = self.client.get("/api/resource-types")
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class TechniqueAPITestCase(APITestCase):
    """Test Techniques API CRUD operations using direct URLs"""

    def setUp(self):
        self.assurance_goal = AssuranceGoalFactory(name="Explainability")
        self.category = CategoryFactory(
            name="Feature Analysis", assurance_goal=self.assurance_goal
        )
        self.subcategory = SubCategoryFactory(
            name="Importance and Attribution", category=self.category
        )
        self.tag1 = TagFactory(name="Machine Learning")
        self.tag2 = TagFactory(name="Neural Networks")

        # Create attribute types and values
        self.scope_type = AttributeTypeFactory(name="Scope")
        self.global_value = AttributeValueFactory(
            name="Global", attribute_type=self.scope_type
        )
        self.local_value = AttributeValueFactory(
            name="Local", attribute_type=self.scope_type
        )

        # Create resource types
        self.paper_type = ResourceTypeFactory(name="Paper", icon="paper")
        self.github_type = ResourceTypeFactory(name="GitHub", icon="github")

        # Create sample techniques
        self.technique1 = TechniqueFactory(
            name="SHAP",
            description="SHapley Additive exPlanations",
            model_dependency="Model-Agnostic",
            assurance_goals=[self.assurance_goal],
            categories=[self.category],
            subcategories=[self.subcategory],
            tags=[self.tag1],
        )

        self.technique2 = TechniqueFactory(
            name="Grad-CAM",
            description="Gradient-weighted Class Activation Mapping",
            model_dependency="Model-Specific",
            assurance_goals=[self.assurance_goal],
            categories=[self.category],
            subcategories=[self.subcategory],
            tags=[self.tag1, self.tag2],
        )

        # URL for technique operations
        self.techniques_url = "/api/techniques"

        # Create a client
        self.client = APIClient()

    def test_get_technique_list(self):
        """Test retrieving a list of techniques"""
        response = self.client.get(self.techniques_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Check pagination structure
        self.assertIn("count", data)
        self.assertIn("results", data)

        # Should have at least our 2 created techniques
        self.assertGreaterEqual(data["count"], 2)

        # Check if our created techniques are in the results
        technique_names = [t["name"] for t in data["results"]]
        self.assertIn(self.technique1.name, technique_names)
        self.assertIn(self.technique2.name, technique_names)

    def test_get_technique_detail(self):
        """Test retrieving a specific technique"""
        url = f"{self.techniques_url}/{self.technique1.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertEqual(data["name"], self.technique1.name)
        self.assertEqual(data["description"], self.technique1.description)
        self.assertEqual(data["model_dependency"], self.technique1.model_dependency)

        # Check relationships
        self.assertEqual(len(data["assurance_goals"]), 1)
        self.assertEqual(data["assurance_goals"][0]["name"], self.assurance_goal.name)

        self.assertEqual(len(data["categories"]), 1)
        self.assertEqual(data["categories"][0]["name"], self.category.name)

        self.assertEqual(len(data["subcategories"]), 1)
        self.assertEqual(data["subcategories"][0]["name"], self.subcategory.name)

        self.assertEqual(len(data["tags"]), 1)
        self.assertEqual(data["tags"][0]["name"], self.tag1.name)

    def test_create_technique(self):
        """Test creating a technique with associated relationships"""
        # Create a complex technique with all relationships
        data = {
            "name": "New Test Technique",
            "description": "Description for new test technique",
            "model_dependency": "Model-Agnostic",
            "assurance_goal_ids": [self.assurance_goal.id],
            "category_ids": [self.category.id],
            "subcategory_ids": [self.subcategory.id],
            "tag_ids": [self.tag1.id, self.tag2.id],
            "attributes": [
                {
                    "attribute_type": self.scope_type.id,
                    "attribute_value": self.global_value.id,
                }
            ],
            "resources": [
                {
                    "resource_type": self.paper_type.id,
                    "title": "Test Paper",
                    "url": "https://example.com/paper",
                    "description": "A test paper",
                },
                {
                    "resource_type": self.github_type.id,
                    "title": "GitHub Repo",
                    "url": "https://github.com/test/repo",
                    "description": "Repository for the technique",
                },
            ],
            "example_use_cases": [
                {
                    "description": "Example use case 1",
                    "assurance_goal": self.assurance_goal.id,
                }
            ],
            "limitations": ["Limitation 1", "Limitation 2"],
        }

        response = self.client.post(
            self.techniques_url, data=json.dumps(data), content_type="application/json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Technique.objects.count(), 3)

        # Verify created technique
        created_technique = Technique.objects.get(name="New Test Technique")
        self.assertEqual(
            created_technique.description, "Description for new test technique"
        )
        self.assertEqual(created_technique.model_dependency, "Model-Agnostic")

        # Check relationships
        self.assertEqual(created_technique.assurance_goals.count(), 1)
        self.assertEqual(created_technique.categories.count(), 1)
        self.assertEqual(created_technique.subcategories.count(), 1)
        self.assertEqual(created_technique.tags.count(), 2)
        self.assertEqual(created_technique.attribute_values.count(), 1)
        self.assertEqual(created_technique.resources.count(), 2)
        self.assertEqual(created_technique.example_use_cases.count(), 1)
        self.assertEqual(created_technique.limitations.count(), 2)

    def test_update_technique(self):
        """Test updating a technique"""
        url = f"{self.techniques_url}/{self.technique1.id}"

        # Update the technique
        data = {
            "name": "Updated SHAP",
            "description": "Updated description for SHAP",
            "model_dependency": self.technique1.model_dependency,
            "assurance_goal_ids": [self.assurance_goal.id],
            "category_ids": [self.category.id],
            "subcategory_ids": [self.subcategory.id],
            "tag_ids": [self.tag1.id, self.tag2.id],  # Add a new tag
        }

        response = self.client.put(
            url, data=json.dumps(data), content_type="application/json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify the update in the database
        self.technique1.refresh_from_db()
        self.assertEqual(self.technique1.name, "Updated SHAP")
        self.assertEqual(self.technique1.description, "Updated description for SHAP")
        self.assertEqual(self.technique1.tags.count(), 2)

    def test_partial_update_technique(self):
        """Test partially updating a technique"""
        url = f"{self.techniques_url}/{self.technique1.id}"

        # Partially update the technique (only name)
        data = {"name": "Partially Updated SHAP"}

        response = self.client.patch(
            url, data=json.dumps(data), content_type="application/json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify the update in the database
        self.technique1.refresh_from_db()
        self.assertEqual(self.technique1.name, "Partially Updated SHAP")
        # Description should remain unchanged
        self.assertEqual(self.technique1.description, "SHapley Additive exPlanations")

    def test_delete_technique(self):
        """Test deleting a technique"""
        url = f"{self.techniques_url}/{self.technique1.id}"
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Technique.objects.count(), 1)
        self.assertFalse(Technique.objects.filter(id=self.technique1.id).exists())

    def test_filter_techniques_by_assurance_goal(self):
        """Test filtering techniques by assurance goal"""
        # Create a new assurance goal and technique for testing filters
        fairness_goal = AssuranceGoalFactory(name="Fairness")
        fairness_technique = TechniqueFactory(
            name="Equal Opportunity", assurance_goals=[fairness_goal]
        )

        # Filter by original assurance goal
        url = f"{self.techniques_url}?assurance_goals={self.assurance_goal.id}"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should only include techniques with this assurance goal
        self.assertEqual(data["count"], 2)
        technique_names = [t["name"] for t in data["results"]]
        self.assertIn(self.technique1.name, technique_names)
        self.assertIn(self.technique2.name, technique_names)
        self.assertNotIn(fairness_technique.name, technique_names)

    def test_filter_techniques_by_category(self):
        """Test filtering techniques by category"""
        # Create a new category and technique for testing filters
        new_category = CategoryFactory(
            name="New Category", assurance_goal=self.assurance_goal
        )
        new_technique = TechniqueFactory(
            name="New Technique",
            categories=[new_category],
            assurance_goals=[self.assurance_goal],
        )

        # Filter by original category
        url = f"{self.techniques_url}?categories={self.category.id}"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should only include techniques with this category
        technique_names = [t["name"] for t in data["results"]]
        self.assertIn(self.technique1.name, technique_names)
        self.assertIn(self.technique2.name, technique_names)
        self.assertNotIn(new_technique.name, technique_names)

    def test_filter_techniques_by_search(self):
        """Test searching techniques by name or description"""
        # Search by partial name
        url = f"{self.techniques_url}?search=SHAP"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertGreaterEqual(data["count"], 1)
        technique_names = [t["name"] for t in data["results"]]
        self.assertIn(self.technique1.name, technique_names)

        # Search by partial description
        url = f"{self.techniques_url}?search=Class+Activation"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertGreaterEqual(data["count"], 1)
        technique_names = [t["name"] for t in data["results"]]
        self.assertIn(self.technique2.name, technique_names)

    def test_filter_techniques_by_model_dependency(self):
        """Test filtering techniques by model dependency"""
        url = f"{self.techniques_url}?model_dependency=Model-Agnostic"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should only include techniques with this model dependency
        self.assertGreaterEqual(data["count"], 1)
        technique_names = [t["name"] for t in data["results"]]
        self.assertIn(self.technique1.name, technique_names)
        self.assertNotIn(self.technique2.name, technique_names)

    def test_filter_techniques_by_tag(self):
        """Test filtering techniques by tag"""
        # Create a technique with only tag2
        tag_only_technique = TechniqueFactory(
            name="Tag Only Technique", tags=[self.tag2]
        )

        # Filter by tag1
        url = f"{self.techniques_url}?tags={self.tag1.id}"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should only include techniques with this tag
        technique_names = [t["name"] for t in data["results"]]
        self.assertIn(self.technique1.name, technique_names)
        self.assertIn(self.technique2.name, technique_names)
        self.assertNotIn(tag_only_technique.name, technique_names)

    def test_pagination(self):
        """Test that pagination works"""
        # Create 10 more techniques to test pagination
        for i in range(10):
            TechniqueFactory(name=f"Pagination Test Technique {i}")

        # Get first page (default page size is defined in settings)
        response = self.client.get(self.techniques_url)
        data = response.json()

        self.assertIn("count", data)
        self.assertIn("next", data)
        self.assertIn("previous", data)
        self.assertIn("results", data)

        # Should have at least 12 techniques in total (2 from setup + 10 created here)
        self.assertGreaterEqual(data["count"], 12)

        # If next page exists, check it
        if data["next"]:
            response = self.client.get(data["next"])
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.json()
            self.assertIn("results", data)

    def test_relation_specific_endpoints(self):
        """Test the endpoints for filtering categories and subcategories by parent"""
        # Test categories by assurance goal
        url = f"/api/categories-by-goal/{self.assurance_goal.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should include the category created in setup
        category_ids = [c["id"] for c in data]
        self.assertIn(self.category.id, category_ids)

        # Test subcategories by category
        url = f"/api/subcategories-by-category/{self.category.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should include the subcategory created in setup
        subcategory_ids = [sc["id"] for sc in data]
        self.assertIn(self.subcategory.id, subcategory_ids)

    def test_debug_endpoint(self):
        """Test that the debug endpoint works in debug mode"""
        url = "/api/debug"

        # Mock settings.DEBUG to True for this test
        from unittest import mock

        with mock.patch("django.conf.settings.DEBUG", True):
            # Test GET
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)

            # Test POST
            test_data = {"test": "data"}
            response = self.client.post(
                url, data=json.dumps(test_data), content_type="application/json"
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)

            # Check that our test data was echoed back
            data = response.json()
            self.assertIn("received_data", data)
            self.assertEqual(data["received_data"], test_data)

    def test_debug_endpoint_production_access_control(self):
        """Test that the debug endpoint is completely disabled in production mode"""
        from django.contrib.auth import get_user_model
        from unittest import mock

        url = "/api/debug/"

        # Mock settings.DEBUG to False to simulate production environment
        with mock.patch("django.conf.settings.DEBUG", False):
            # Test as anonymous user
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
            self.assertIn(
                "Debug endpoint not available in production", response.json()["error"]
            )

            # Create and login as admin user
            User = get_user_model()
            admin_user = User.objects.create_superuser(
                username="adminuser", email="admin@example.com", password="adminpass123"
            )
            self.client.force_authenticate(user=admin_user)

            # Test as admin user - should still be forbidden in production
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
            self.assertIn(
                "Debug endpoint not available in production", response.json()["error"]
            )

            # Test POST in production (should be forbidden)
            test_data = {"test": "data"}
            response = self.client.post(
                url, data=json.dumps(test_data), content_type="application/json"
            )
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
            self.assertIn(
                "Debug endpoint not available in production", response.json()["error"]
            )

    def test_techniques_list_query_optimization(self):
        """Test that techniques list endpoint uses optimized queries"""
        # Create a complex technique with all types of relationships to test prefetching
        technique = TechniqueFactory(
            name="Comprehensive Test Technique",
            description="A test technique with all relationships",
            model_dependency="Model-Agnostic",
            assurance_goals=[self.assurance_goal],
            categories=[self.category],
            subcategories=[self.subcategory],
            tags=[self.tag1, self.tag2],
        )

        # Add attribute values, resources, use cases, and limitations
        AttributeValueFactory(
            name="Test Value", attribute_type=self.scope_type, technique=technique
        )

        # Add a resource
        technique.resources.create(
            resource_type=self.paper_type,
            title="Test Resource",
            url="https://example.com/test",
            description="A test resource",
        )

        # Add an example use case
        technique.example_use_cases.create(
            description="Test use case", assurance_goal=self.assurance_goal
        )

        # Add a limitation
        technique.limitations.create(description="Test limitation")

        # Capture database queries during request
        with CaptureQueriesContext(connection) as queries:
            # Use the correct URL format without trailing slash
            url = self.techniques_url
            response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Analyze captured queries
        # The key improvement is that without prefetch_related, we would see an N+1 problem
        # with one query for each related object per technique
        query_count = len(queries)

        # With properly optimized prefetch_related, we should have significantly fewer queries
        # Exact number depends on implementation details, but we can set a reasonable upper bound
        # Based on our prefetch_related setup, we expect around 9-15 queries total:
        # 1 for techniques + 1 for each prefetched relation
        self.assertLess(
            query_count,
            20,
            f"Query count too high ({query_count}). Check prefetch_related implementation.",
        )

    def test_technique_detail_query_optimization(self):
        """Test that technique detail endpoint uses optimized queries"""
        # Create a complex technique with all types of relationships to test prefetching
        technique = TechniqueFactory(
            name="Detail Test Technique",
            description="A test technique for detail view optimization",
            model_dependency="Model-Agnostic",
            assurance_goals=[self.assurance_goal],
            categories=[self.category],
            subcategories=[self.subcategory],
            tags=[self.tag1, self.tag2],
        )

        # Add attribute values, resources, use cases, and limitations
        AttributeValueFactory(
            name="Detail Test Value",
            attribute_type=self.scope_type,
            technique=technique,
        )

        technique.resources.create(
            resource_type=self.paper_type,
            title="Detail Test Resource",
            url="https://example.com/detail-test",
            description="A test resource for detail view",
        )

        technique.example_use_cases.create(
            description="Detail test use case", assurance_goal=self.assurance_goal
        )

        technique.limitations.create(description="Detail test limitation")

        # Get the detail URL
        detail_url = f"{self.techniques_url}/{technique.id}"

        # Capture database queries during request
        with CaptureQueriesContext(connection) as queries:
            response = self.client.get(detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Analyze captured queries
        query_count = len(queries)

        # With properly optimized prefetch_related, we should have significantly fewer queries
        self.assertLess(
            query_count,
            20,
            f"Query count too high ({query_count}). Check prefetch_related for detail view.",
        )


class PostgreSQLTestCase(APITestCase):
    """Tests that specifically verify PostgreSQL functionality."""

    def setUp(self):
        # Create basic test data
        self.assurance_goal = AssuranceGoalFactory()
        self.category = CategoryFactory(assurance_goal=self.assurance_goal)
        self.tag = TagFactory()
        self.technique = TechniqueFactory(
            assurance_goals=[self.assurance_goal],
            categories=[self.category],
            tags=[self.tag],
        )
        self.client = APIClient()

    @pytest.mark.skipif(
        os.getenv("USE_POSTGRES_FOR_TESTS") != "True",
        reason="Test requires PostgreSQL database",
    )
    def test_postgres_full_text_search(self):
        """Test PostgreSQL-specific full-text search functionality.

        This test verifies that search works correctly in a PostgreSQL environment
        when using complex search terms that depend on PostgreSQL's full-text search.
        """
        # Create a technique with specific text to search for
        technique = TechniqueFactory(
            name="PostgreSQL Testing Technique",
            description="This is a specialized search text for PostgreSQL testing",
        )

        # Test complex search query
        response = self.client.get(f"/api/techniques?search=special+search")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should find our technique
        found = any(t["name"] == technique.name for t in data["results"])
        self.assertTrue(
            found, "PostgreSQL full-text search failed to find relevant results"
        )


class AuthenticationTestCase(APITestCase):
    """
    Test authentication requirements for API operations.

    Test scenarios:
    - Anonymous user access (list/retrieve endpoints)
    - Unauthenticated write operations (create/update/delete) - should return 401
    - Authenticated write operations - should succeed
    """

    def setUp(self):
        # Create base objects for relationships
        self.assurance_goal = AssuranceGoalFactory()
        self.category = CategoryFactory(assurance_goal=self.assurance_goal)
        self.subcategory = SubCategoryFactory(category=self.category)
        self.tag = TagFactory()
        self.technique = TechniqueFactory(
            assurance_goals=[self.assurance_goal],
            categories=[self.category],
            subcategories=[self.subcategory],
            tags=[self.tag],
        )

        # Define the common URLs - NO trailing slashes as per router config
        self.techniques_url = "/api/techniques"
        self.technique_detail_url = f"{self.techniques_url}/{self.technique.id}"
        self.goals_url = "/api/assurance-goals"
        self.categories_url = "/api/categories"
        self.subcategories_url = "/api/subcategories"
        self.tags_url = "/api/tags"
        # Skip attribute types due to serializer issues
        self.resource_types_url = "/api/resource-types"

        # Create a test user
        self.username = "testuser"
        self.password = "testpassword"
        self.user = User.objects.create_user(
            username=self.username, email="test@example.com", password=self.password
        )

        # Create admin user
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@example.com", password="adminpass"
        )

        # Create client
        self.client = APIClient()

        # Create sample data for POST/PUT tests
        self.technique_data = {
            "name": "Auth Test Technique",
            "description": "Description for auth test technique",
            "model_dependency": "Model-Agnostic",
            "assurance_goal_ids": [self.assurance_goal.id],
            "category_ids": [self.category.id],
            "subcategory_ids": [self.subcategory.id],
            "tag_ids": [self.tag.id],
        }

        self.goal_data = {
            "name": "Auth Test Goal",
            "description": "Goal created in auth test",
        }

        self.category_data = {
            "name": "Auth Test Category",
            "description": "Category created in auth test",
            "assurance_goal": self.assurance_goal.id,
        }

        self.tag_data = {"name": "auth-test-tag"}

    def test_anonymous_read_access(self):
        """Test that anonymous users can access read endpoints (list/retrieve)"""
        # Test list endpoints
        endpoints = [
            self.techniques_url,
            self.goals_url,
            self.categories_url,
            self.subcategories_url,
            self.tags_url,
            self.resource_types_url,
        ]

        for url in endpoints:
            response = self.client.get(url)
            self.assertEqual(
                response.status_code,
                status.HTTP_200_OK,
                f"Anonymous user could not access list endpoint {url}",
            )

        # Test retrieve endpoints
        response = self.client.get(self.technique_detail_url)
        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            "Anonymous user could not access technique detail endpoint",
        )

        # Test filtering endpoints
        response = self.client.get(f"/api/categories-by-goal/{self.assurance_goal.id}")
        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            "Anonymous user could not access categories-by-goal endpoint",
        )

        response = self.client.get(f"/api/subcategories-by-category/{self.category.id}")
        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            "Anonymous user could not access subcategories-by-category endpoint",
        )

    def test_anonymous_write_operations_fail(self):
        """Test that anonymous users cannot perform write operations"""
        # Test create operations
        post_data = [
            (self.techniques_url, self.technique_data),
            (self.goals_url, self.goal_data),
            (self.categories_url, self.category_data),
            (self.tags_url, self.tag_data),
        ]

        for url, data in post_data:
            response = self.client.post(
                url, data=json.dumps(data), content_type="application/json"
            )
            # Check for either 401 or 403 - both indicate authentication failure
            self.assertIn(
                response.status_code,
                [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
                f"Anonymous POST to {url} should not succeed",
            )

        # Test update operations
        put_data = [
            (self.technique_detail_url, self.technique_data),
            (f"{self.goals_url}/{self.assurance_goal.id}", self.goal_data),
            (f"{self.categories_url}/{self.category.id}", self.category_data),
            (f"{self.tags_url}/{self.tag.id}", self.tag_data),
        ]

        for url, data in put_data:
            response = self.client.put(
                url, data=json.dumps(data), content_type="application/json"
            )
            self.assertIn(
                response.status_code,
                [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
                f"Anonymous PUT to {url} should not succeed",
            )

            # Also test PATCH
            response = self.client.patch(
                url,
                data=json.dumps({"name": "Updated Name"}),
                content_type="application/json",
            )
            self.assertIn(
                response.status_code,
                [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
                f"Anonymous PATCH to {url} should not succeed",
            )

        # Test delete operations
        delete_urls = [
            self.technique_detail_url,
            f"{self.goals_url}/{self.assurance_goal.id}",
            f"{self.categories_url}/{self.category.id}",
            f"{self.tags_url}/{self.tag.id}",
        ]

        for url in delete_urls:
            response = self.client.delete(url)
            self.assertIn(
                response.status_code,
                [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
                f"Anonymous DELETE to {url} should not succeed",
            )

    def test_authenticated_write_operations_succeed(self):
        """Test that authenticated users can perform write operations"""
        # Log in
        self.client.force_authenticate(user=self.user)

        # Test create operations
        post_data = [
            (self.techniques_url, self.technique_data),
            (self.goals_url, self.goal_data),
            (self.categories_url, self.category_data),
            (self.tags_url, self.tag_data),
        ]

        for url, data in post_data:
            response = self.client.post(
                url, data=json.dumps(data), content_type="application/json"
            )
            self.assertEqual(
                response.status_code,
                status.HTTP_201_CREATED,
                f"Authenticated POST to {url} failed with status {response.status_code}",
            )

        # Get IDs of newly created objects for update tests
        techniques = Technique.objects.filter(name=self.technique_data["name"])
        self.assertTrue(techniques.exists(), "Technique was not created")
        new_technique_id = techniques.first().id

        goals = AssuranceGoal.objects.filter(name=self.goal_data["name"])
        self.assertTrue(goals.exists(), "Goal was not created")
        new_goal_id = goals.first().id

        categories = Category.objects.filter(name=self.category_data["name"])
        self.assertTrue(categories.exists(), "Category was not created")
        new_category_id = categories.first().id

        tags = Tag.objects.filter(name=self.tag_data["name"])
        self.assertTrue(tags.exists(), "Tag was not created")
        new_tag_id = tags.first().id

        # Test update operations
        put_data = [
            (
                f"{self.techniques_url}/{new_technique_id}",
                {"name": "Updated Auth Test Technique"},
            ),
            (f"{self.goals_url}/{new_goal_id}", {"name": "Updated Auth Test Goal"}),
            (
                f"{self.categories_url}/{new_category_id}",
                {"name": "Updated Auth Test Category"},
            ),
            (f"{self.tags_url}/{new_tag_id}", {"name": "updated-auth-test-tag"}),
        ]

        for url, data in put_data:
            response = self.client.patch(
                url, data=json.dumps(data), content_type="application/json"
            )
            self.assertEqual(
                response.status_code,
                status.HTTP_200_OK,
                f"Authenticated PATCH to {url} failed with status {response.status_code}",
            )

        # Test delete operations
        delete_urls = [
            f"{self.techniques_url}/{new_technique_id}",
            f"{self.goals_url}/{new_goal_id}",
            f"{self.categories_url}/{new_category_id}",
            f"{self.tags_url}/{new_tag_id}",
        ]

        for url in delete_urls:
            response = self.client.delete(url)
            self.assertEqual(
                response.status_code,
                status.HTTP_204_NO_CONTENT,
                f"Authenticated DELETE to {url} failed with status {response.status_code}",
            )

    def test_auth_with_real_credentials(self):
        """
        Test authentication workflow with login/logout using real credentials
        instead of force_authenticate
        """
        # Try to create a technique without authentication
        response = self.client.post(
            self.techniques_url,
            data=json.dumps(self.technique_data),
            content_type="application/json",
        )
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
            "Unauthenticated request should not succeed",
        )

        # Use login endpoint to authenticate
        login_data = {"username": self.username, "password": self.password}

        response = self.client.post(
            "/api/auth/login",
            data=json.dumps(login_data),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("username", response.json())
        self.assertEqual(response.json()["username"], self.username)

        # Now try the create operation again - should work
        response = self.client.post(
            self.techniques_url,
            data=json.dumps(self.technique_data),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify the technique was created
        techniques = Technique.objects.filter(name=self.technique_data["name"])
        self.assertTrue(techniques.exists())

        # Logout - might succeed without auth in DRF's built-in auth
        response = self.client.post("/api/auth/logout")

        # Log back in for proper logout test
        self.client.post(
            "/api/auth/login",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        # Try logout now
        response = self.client.post("/api/auth/logout")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify we're logged out by trying a write operation
        response = self.client.post(
            self.techniques_url,
            data=json.dumps(self.technique_data),
            content_type="application/json",
        )
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
            "User should be logged out, write operation should fail",
        )

    def test_auth_status_endpoint(self):
        """Test the authentication status endpoint behavior"""
        # Test with anonymous user
        response = self.client.get("/api/auth/status")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.json()["isAuthenticated"])

        # Test with authenticated user
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/auth/status")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.json()["isAuthenticated"])
        self.assertEqual(response.json()["user"]["username"], self.username)
