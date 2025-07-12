# api/tests/api/test_api_endpoints.py
"""
Comprehensive API endpoint tests for all ViewSets and API functionality.

Tests cover CRUD operations, filtering, searching, pagination, and proper
HTTP status codes for all API endpoints.
"""

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import AssuranceGoal, Tag, Technique
from api.tests.factories import (
    AssuranceGoalFactory,
    ResourceTypeFactory,
    TagFactory,
    TechniqueExampleUseCaseFactory,
    TechniqueFactory,
    TechniqueLimitationFactory,
    TechniqueResourceFactory,
    create_test_assurance_goals,
    create_test_resource_types,
)


class BaseAPITestCase(APITestCase):
    """Base test case for API tests with common setup."""

    def setUp(self):
        """Set up test data and authentication."""
        # Create test user
        from api.tests.conftest import TEST_USER_PASSWORD

        self.user = User.objects.create_user(username="testuser", password=TEST_USER_PASSWORD, email="test@example.com")

        # Create foundational data
        self.assurance_goals = create_test_assurance_goals()
        self.resource_types = create_test_resource_types()

        # Create some test tags
        self.tags = [
            TagFactory(name="test-tag-1"),
            TagFactory(name="test-tag-2"),
            TagFactory(name="test-tag-3"),
        ]

        # Authenticate client
        self.client.force_authenticate(user=self.user)


class AssuranceGoalAPITests(BaseAPITestCase):
    """Test AssuranceGoal ViewSet API endpoints."""

    def test_list_assurance_goals(self):
        """Test listing all assurance goals."""
        url = reverse("assurancegoal-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), len(self.assurance_goals))

        # Verify response structure
        goal = response.data["results"][0]
        self.assertIn("id", goal)
        self.assertIn("name", goal)
        self.assertIn("description", goal)

    def test_retrieve_assurance_goal(self):
        """Test retrieving a single assurance goal."""
        goal = self.assurance_goals[0]
        url = reverse("assurancegoal-detail", kwargs={"pk": goal.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], goal.id)
        self.assertEqual(response.data["name"], goal.name)

    def test_create_assurance_goal(self):
        """Test creating a new assurance goal."""
        url = reverse("assurancegoal-list")
        data = {"name": "New Test Goal", "description": "A newly created test goal"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "New Test Goal")

        # Verify database
        self.assertTrue(AssuranceGoal.objects.filter(name="New Test Goal").exists())

    def test_update_assurance_goal(self):
        """Test updating an assurance goal."""
        goal = AssuranceGoalFactory(name="Original Goal")
        url = reverse("assurancegoal-detail", kwargs={"pk": goal.id})
        data = {"name": "Updated Goal", "description": "Updated description"}

        response = self.client.put(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Updated Goal")

        # Verify database
        goal.refresh_from_db()
        self.assertEqual(goal.name, "Updated Goal")

    def test_partial_update_assurance_goal(self):
        """Test partial update of an assurance goal."""
        goal = AssuranceGoalFactory(name="Original Goal", description="Original description")
        url = reverse("assurancegoal-detail", kwargs={"pk": goal.id})
        data = {"name": "Partially Updated Goal"}

        response = self.client.patch(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Partially Updated Goal")
        self.assertEqual(response.data["description"], "Original description")

    def test_delete_assurance_goal(self):
        """Test deleting an assurance goal."""
        goal = AssuranceGoalFactory(name="To Be Deleted")
        url = reverse("assurancegoal-detail", kwargs={"pk": goal.id})

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(AssuranceGoal.objects.filter(id=goal.id).exists())

    def test_assurance_goal_filtering(self):
        """Test filtering assurance goals."""
        # Create specific goal for filtering with unique name
        AssuranceGoalFactory(name="UniqueFilterGoalForTesting")

        url = reverse("assurancegoal-list")
        response = self.client.get(url, {"search": "UniqueFilterGoalForTesting"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["name"], "UniqueFilterGoalForTesting")

    def test_assurance_goal_not_found(self):
        """Test retrieving non-existent assurance goal."""
        url = reverse("assurancegoal-detail", kwargs={"pk": 99999})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TagAPITests(BaseAPITestCase):
    """Test Tag ViewSet API endpoints."""

    def test_list_tags(self):
        """Test listing all tags."""
        url = reverse("tag-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), len(self.tags))

    def test_create_tag(self):
        """Test creating a new tag."""
        url = reverse("tag-list")
        data = {"name": "new-test-tag"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "new-test-tag")

    def test_update_tag(self):
        """Test updating a tag."""
        tag = self.tags[0]
        url = reverse("tag-detail", kwargs={"pk": tag.id})
        data = {"name": "updated-tag-name"}

        response = self.client.put(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "updated-tag-name")

    def test_delete_tag(self):
        """Test deleting a tag."""
        tag = TagFactory(name="to-be-deleted")
        url = reverse("tag-detail", kwargs={"pk": tag.id})

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Tag.objects.filter(id=tag.id).exists())

    def test_tag_search(self):
        """Test searching tags."""
        # Create specific tag
        TagFactory(name="searchable-unique-tag")

        url = reverse("tag-list")
        response = self.client.get(url, {"search": "searchable"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["name"], "searchable-unique-tag")


class ResourceTypeAPITests(BaseAPITestCase):
    """Test ResourceType ViewSet API endpoints."""

    def test_list_resource_types(self):
        """Test listing all resource types."""
        url = reverse("resourcetype-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data["results"]), 0)

        # Verify response structure
        resource_type = response.data["results"][0]
        self.assertIn("id", resource_type)
        self.assertIn("name", resource_type)
        self.assertIn("icon", resource_type)

    def test_create_resource_type(self):
        """Test creating a new resource type."""
        url = reverse("resourcetype-list")
        data = {"name": "New Resource Type", "icon": "new-icon"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "New Resource Type")
        self.assertEqual(response.data["icon"], "new-icon")

    def test_update_resource_type(self):
        """Test updating a resource type."""
        resource_type = ResourceTypeFactory(name="Original Type")
        url = reverse("resourcetype-detail", kwargs={"pk": resource_type.id})
        data = {"name": "Updated Type", "icon": "updated-icon"}

        response = self.client.put(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Updated Type")

    def test_resource_type_with_optional_icon(self):
        """Test creating resource type without icon."""
        url = reverse("resourcetype-list")
        data = {"name": "No Icon Type"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "No Icon Type")
        self.assertEqual(response.data["icon"], "")


class TechniqueAPITests(BaseAPITestCase):
    """Test Technique ViewSet API endpoints."""

    def setUp(self):
        """Set up test data."""
        super().setUp()

        # Create test techniques
        self.techniques = []
        for i in range(5):
            technique = TechniqueFactory(name=f"Test Technique {i}", complexity_rating=(i % 5) + 1)
            # Add relationships
            technique.assurance_goals.add(self.assurance_goals[i % len(self.assurance_goals)])
            technique.tags.add(self.tags[i % len(self.tags)])
            self.techniques.append(technique)

    def test_list_techniques(self):
        """Test listing all techniques."""
        url = reverse("technique-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 5)

        # Verify response structure
        technique = response.data["results"][0]
        self.assertIn("slug", technique)
        self.assertIn("name", technique)
        self.assertIn("acronym", technique)
        self.assertIn("description", technique)
        self.assertIn("complexity_rating", technique)
        self.assertIn("assurance_goals", technique)
        self.assertIn("tags", technique)

    def test_retrieve_technique(self):
        """Test retrieving a single technique with all relationships."""
        technique = self.techniques[0]

        # Add nested objects
        resource = TechniqueResourceFactory(technique=technique, resource_type=self.resource_types[0])
        use_case = TechniqueExampleUseCaseFactory(technique=technique, assurance_goal=self.assurance_goals[0])
        limitation = TechniqueLimitationFactory(technique=technique)

        url = reverse("technique-detail", kwargs={"slug": technique.slug})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["slug"], technique.slug)

        # Verify nested data
        self.assertEqual(len(response.data["resources"]), 1)
        self.assertEqual(response.data["resources"][0]["title"], resource.title)

        self.assertEqual(len(response.data["example_use_cases"]), 1)
        self.assertEqual(response.data["example_use_cases"][0]["description"], use_case.description)

        self.assertEqual(len(response.data["limitations"]), 1)
        self.assertEqual(response.data["limitations"][0]["description"], limitation.description)

    def test_create_technique_minimal(self):
        """Test creating a technique with minimal data."""
        url = reverse("technique-list")
        data = {
            "name": "Minimal Technique",
            "description": "A minimal technique for testing",
            "assurance_goal_ids": [self.assurance_goals[0].id],
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Minimal Technique")

        # Verify database
        technique = Technique.objects.get(slug=response.data["slug"])
        self.assertEqual(technique.assurance_goals.count(), 1)

    def test_create_technique_with_nested_data(self):
        """Test creating a technique with all nested data."""
        url = reverse("technique-list")
        data = {
            "name": "Complete Technique",
            "description": "A complete technique with all relationships",
            "complexity_rating": 4,
            "computational_cost_rating": 3,
            "assurance_goal_ids": [goal.id for goal in self.assurance_goals[:2]],
            "tag_ids": [tag.id for tag in self.tags[:2]],
            "resources": [
                {
                    "resource_type": self.resource_types[0].id,
                    "title": "Test Resource",
                    "url": "https://test-resource.com",
                    "authors": "Test Author",
                    "publication_date": "2023-01-01",
                }
            ],
            "example_use_cases": [
                {
                    "description": "Test use case",
                    "assurance_goal": self.assurance_goals[0].id,
                }
            ],
            "limitations": ["First limitation", {"description": "Second limitation"}],
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Complete Technique")

        # Verify all relationships
        technique = Technique.objects.get(slug=response.data["slug"])
        self.assertEqual(technique.assurance_goals.count(), 2)
        self.assertEqual(technique.tags.count(), 2)
        self.assertEqual(technique.resources.count(), 1)
        self.assertEqual(technique.example_use_cases.count(), 1)
        self.assertEqual(technique.limitations.count(), 2)

    def test_update_technique(self):
        """Test updating a technique."""
        technique = self.techniques[0]
        url = reverse("technique-detail", kwargs={"slug": technique.slug})

        data = {
            "name": "Updated Technique Name",
            "description": "Updated description",
            "complexity_rating": 5,
            "assurance_goal_ids": [self.assurance_goals[1].id],
        }

        response = self.client.put(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Updated Technique Name")
        self.assertEqual(response.data["complexity_rating"], 5)

        # Verify database
        technique.refresh_from_db()
        self.assertEqual(technique.name, "Updated Technique Name")
        self.assertEqual(technique.assurance_goals.count(), 1)

    def test_partial_update_technique(self):
        """Test partial update of a technique."""
        technique = self.techniques[0]
        original_description = technique.description

        url = reverse("technique-detail", kwargs={"slug": technique.slug})
        data = {"name": "Partially Updated Name"}

        response = self.client.patch(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Partially Updated Name")
        self.assertEqual(response.data["description"], original_description)

    def test_delete_technique(self):
        """Test deleting a technique."""
        technique = TechniqueFactory(name="To Be Deleted")
        url = reverse("technique-detail", kwargs={"slug": technique.slug})

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Technique.objects.filter(slug=technique.slug).exists())

    def test_technique_filtering_by_goal(self):
        """Test filtering techniques by assurance goal."""
        # Create technique with specific goal
        specific_goal = AssuranceGoalFactory(name="Specific Goal")
        technique = TechniqueFactory(name="Goal Filtered Technique")
        technique.assurance_goals.add(specific_goal)

        url = reverse("technique-list")
        response = self.client.get(url, {"assurance_goals": specific_goal.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Should find the technique with this goal
        technique_names = [t["name"] for t in response.data["results"]]
        self.assertIn("Goal Filtered Technique", technique_names)

    def test_technique_filtering_by_tag(self):
        """Test filtering techniques by tag."""
        # Create technique with specific tag
        specific_tag = TagFactory(name="specific-filter-tag")
        technique = TechniqueFactory(name="Tag Filtered Technique")
        technique.tags.add(specific_tag)

        url = reverse("technique-list")
        response = self.client.get(url, {"tags": specific_tag.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Should find the technique with this tag
        technique_names = [t["name"] for t in response.data["results"]]
        self.assertIn("Tag Filtered Technique", technique_names)

    def test_technique_search(self):
        """Test searching techniques."""
        # Create searchable technique
        TechniqueFactory(
            name="Searchable Unique Technique",
            description="This technique is uniquely searchable",
        )

        url = reverse("technique-list")
        response = self.client.get(url, {"search": "uniquely searchable"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["name"], "Searchable Unique Technique")

    def test_technique_ordering(self):
        """Test ordering techniques."""
        url = reverse("technique-list")

        # Order by name ascending
        response = self.client.get(url, {"ordering": "name"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [t["name"] for t in response.data["results"]]
        self.assertEqual(names, sorted(names))

        # Order by complexity rating descending
        response = self.client.get(url, {"ordering": "-complexity_rating"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ratings = [t["complexity_rating"] for t in response.data["results"]]
        self.assertEqual(ratings, sorted(ratings, reverse=True))

    def test_technique_pagination(self):
        """Test pagination of techniques."""
        # Create more techniques to test pagination
        for i in range(15):
            TechniqueFactory(name=f"Pagination Test {i}")

        url = reverse("technique-list")
        response = self.client.get(url, {"page_size": 10})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 10)
        self.assertIn("next", response.data)
        self.assertIn("count", response.data)
        self.assertGreater(response.data["count"], 10)

    def test_technique_validation_errors(self):
        """Test validation errors when creating technique."""
        url = reverse("technique-list")

        # Missing required fields
        data = {"description": "Missing name field"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data["details"])

        # Invalid rating
        data = {
            "name": "Invalid Rating",
            "description": "Testing invalid rating",
            "complexity_rating": 10,  # Should be 1-5
            "assurance_goal_ids": [self.assurance_goals[0].id],
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("complexity_rating", response.data["details"])

    def test_technique_nested_updates(self):
        """Test updating technique with nested data replacement."""
        technique = self.techniques[0]

        # Add initial nested data
        TechniqueResourceFactory(technique=technique)
        TechniqueExampleUseCaseFactory(technique=technique)
        TechniqueLimitationFactory(technique=technique)

        url = reverse("technique-detail", kwargs={"slug": technique.slug})

        # Update with replacement of nested data
        data = {
            "name": technique.name,
            "description": technique.description,
            "assurance_goal_ids": [self.assurance_goals[0].id],
            "resources": [
                {
                    "resource_type": self.resource_types[1].id,
                    "title": "Replacement Resource",
                    "url": "https://replacement.com",
                }
            ],
            "example_use_cases": [
                {
                    "description": "Replacement use case",
                    "assurance_goal": self.assurance_goals[0].id,
                }
            ],
            "limitations": ["Single replacement limitation"],
        }

        response = self.client.put(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify replacements
        technique.refresh_from_db()
        self.assertEqual(technique.resources.count(), 1)
        self.assertEqual(technique.resources.first().title, "Replacement Resource")

        self.assertEqual(technique.example_use_cases.count(), 1)
        self.assertEqual(technique.example_use_cases.first().description, "Replacement use case")

        self.assertEqual(technique.limitations.count(), 1)
        self.assertEqual(technique.limitations.first().description, "Single replacement limitation")

    def test_technique_acronym_in_response(self):
        """Test that acronym field is included in API responses."""
        technique = TechniqueFactory(name="Test Technique", acronym="TT")

        url = reverse("technique-detail", kwargs={"slug": technique.slug})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["acronym"], "TT")
        self.assertEqual(response.data["slug"], technique.slug)

    def test_technique_create_with_related_technique_slugs(self):
        """Test creating a technique with related techniques using slugs."""
        related_technique = TechniqueFactory()

        url = reverse("technique-list")
        data = {
            "name": "Related Technique Test",
            "description": "Testing related techniques with slugs",
            "assurance_goal_ids": [self.assurance_goals[0].id],
            "related_technique_slugs": [related_technique.slug],
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify relationship
        created_technique = Technique.objects.get(slug=response.data["slug"])
        self.assertEqual(created_technique.related_techniques.count(), 1)
        self.assertIn(related_technique, created_technique.related_techniques.all())

    def test_technique_update_with_related_technique_slugs(self):
        """Test updating a technique with related techniques using slugs."""
        technique = self.techniques[0]
        related_technique = TechniqueFactory()

        url = reverse("technique-detail", kwargs={"slug": technique.slug})
        data = {
            "name": technique.name,
            "description": technique.description,
            "assurance_goal_ids": [self.assurance_goals[0].id],
            "related_technique_slugs": [related_technique.slug],
        }

        response = self.client.put(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify relationship
        technique.refresh_from_db()
        self.assertEqual(technique.related_techniques.count(), 1)
        self.assertIn(related_technique, technique.related_techniques.all())

    def test_technique_slug_in_related_techniques_response(self):
        """Test that related techniques are returned as slugs in API response."""
        technique1 = self.techniques[0]
        technique2 = self.techniques[1]

        # Add relationship
        technique1.related_techniques.add(technique2)

        url = reverse("technique-detail", kwargs={"slug": technique1.slug})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["related_techniques"]), 1)
        self.assertEqual(response.data["related_techniques"][0], technique2.slug)

    def test_technique_filtering_by_slug(self):
        """Test filtering techniques by slug."""
        technique = TechniqueFactory(name="Slug Filtered Technique")

        url = reverse("technique-list")
        response = self.client.get(url, {"slug": technique.slug})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Should find the technique with this slug
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["slug"], technique.slug)

    def test_technique_search_includes_acronym(self):
        """Test that search functionality works with acronym field."""
        TechniqueFactory(
            name="Some Technique",
            acronym="UNIQUE",
            description="Testing acronym search",
        )

        url = reverse("technique-list")
        response = self.client.get(url, {"search": "UNIQUE"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["acronym"], "UNIQUE")


class DebugEndpointTests(BaseAPITestCase):
    """Test debug API endpoints."""

    def test_debug_info_endpoint(self):
        """Test debug info endpoint."""
        url = "/api/debug/info/"
        response = self.client.get(url)

        # Debug endpoint should return 403 in test environment (DEBUG=False)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("error", response.data)
        self.assertIn("not available in production", response.data["error"])

    def test_debug_echo_endpoint(self):
        """Test debug echo endpoint."""
        url = "/api/debug/echo/"
        response = self.client.get(url)

        # Debug endpoint should return 403 in test environment (DEBUG=False)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("error", response.data)
        self.assertIn("not available in production", response.data["error"])

    def test_debug_echo_with_post_data(self):
        """Test debug echo endpoint with POST data."""
        url = "/api/debug/echo/"
        data = {"test": "data", "nested": {"key": "value"}}

        response = self.client.post(url, data, format="json")

        # Debug endpoint should return 403 in test environment (DEBUG=False)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("error", response.data)
        self.assertIn("not available in production", response.data["error"])


class APIErrorHandlingTests(BaseAPITestCase):
    """Test API error handling and custom exception handler."""

    def test_404_error_handling(self):
        """Test 404 error response format."""
        url = reverse("technique-detail", kwargs={"slug": "non-existent-slug"})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Verify custom error format
        self.assertIn("error", response.data)
        self.assertTrue(response.data["error"])
        self.assertIn("message", response.data)
        self.assertIn("details", response.data)

    def test_400_validation_error_handling(self):
        """Test 400 validation error response format."""
        url = reverse("technique-list")
        data = {"name": "", "description": "Test"}  # Empty name should fail validation

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Verify custom error format
        self.assertIn("error", response.data)
        self.assertTrue(response.data["error"])
        self.assertIn("message", response.data)
        self.assertIn("details", response.data)

    def test_method_not_allowed_error(self):
        """Test 405 method not allowed error."""
        # Try to use an unsupported method on list endpoint
        url = reverse("technique-list")
        response = self.client.put(url, {})  # PUT not allowed on list

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        # Verify error format
        self.assertIn("error", response.data)
        self.assertIn("message", response.data)


class APIPaginationTests(BaseAPITestCase):
    """Test API pagination functionality."""

    def setUp(self):
        """Create many items for pagination testing."""
        super().setUp()

        # Create 50 techniques for pagination
        for i in range(50):
            TechniqueFactory(name=f"Pagination Technique {i:02d}")

    def test_default_pagination(self):
        """Test default pagination settings."""
        url = reverse("technique-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify pagination structure
        self.assertIn("count", response.data)
        self.assertIn("next", response.data)
        self.assertIn("previous", response.data)
        self.assertIn("results", response.data)

        # Default page size (usually 20)
        self.assertLessEqual(len(response.data["results"]), 20)
        self.assertGreater(response.data["count"], 20)

    def test_custom_page_size(self):
        """Test custom page size parameter."""
        url = reverse("technique-list")
        response = self.client.get(url, {"page_size": 5})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 5)

    def test_page_navigation(self):
        """Test navigating through pages."""
        url = reverse("technique-list")

        # Get first page
        response = self.client.get(url, {"page": 1, "page_size": 10})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        first_page_results = response.data["results"]

        # Get second page
        response = self.client.get(url, {"page": 2, "page_size": 10})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        second_page_results = response.data["results"]

        # Verify different results
        first_slugs = [r["slug"] for r in first_page_results]
        second_slugs = [r["slug"] for r in second_page_results]
        self.assertEqual(len(set(first_slugs) & set(second_slugs)), 0)

    def test_invalid_page_number(self):
        """Test handling of invalid page numbers."""
        url = reverse("technique-list")

        # Page number too high
        response = self.client.get(url, {"page": 999})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Invalid page number format
        response = self.client.get(url, {"page": "invalid"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class APIFilteringTests(BaseAPITestCase):
    """Test API filtering functionality."""

    def setUp(self):
        """Create test data for filtering."""
        super().setUp()

        # Create techniques with specific attributes
        self.high_complexity = TechniqueFactory(name="High Complexity Technique", complexity_rating=5)
        self.low_complexity = TechniqueFactory(name="Low Complexity Technique", complexity_rating=1)

        # Add specific goals and tags
        specific_goal = AssuranceGoalFactory(name="Filtering Goal")
        specific_tag = TagFactory(name="filter-tag")

        self.high_complexity.assurance_goals.add(specific_goal)
        self.high_complexity.tags.add(specific_tag)

    def test_filter_by_complexity_rating(self):
        """Test filtering techniques by complexity rating."""
        url = reverse("technique-list")

        # Filter for high complexity
        response = self.client.get(url, {"complexity_rating": 5})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify results
        technique_names = [t["name"] for t in response.data["results"]]
        self.assertIn("High Complexity Technique", technique_names)
        self.assertNotIn("Low Complexity Technique", technique_names)

    def test_multiple_filters(self):
        """Test combining multiple filters."""
        url = reverse("technique-list")

        # Create technique matching multiple criteria
        multi_match = TechniqueFactory(name="Multi Match Technique", complexity_rating=3)
        goal = AssuranceGoalFactory(name="Multi Filter Goal")
        tag = TagFactory(name="multi-filter-tag")
        multi_match.assurance_goals.add(goal)
        multi_match.tags.add(tag)

        # Apply multiple filters
        response = self.client.get(url, {"complexity_rating": 3, "assurance_goals": goal.id, "tags": tag.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Should find only the multi-match technique
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["name"], "Multi Match Technique")
