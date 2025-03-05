from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from api.models import (
    Technique,
    AssuranceGoal,
    Category,
    SubCategory,
    Tag,
    AttributeType,
    AttributeValue,
    ResourceType,
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
import json


class ApiEndpointTestCase(APITestCase):
    """Test that all API endpoints return 200 OK"""

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

    def test_api_root(self):
        """Test that API root works"""
        url = reverse("api-root")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_assurance_goals_list(self):
        """Test the assurance goals endpoint"""
        url = reverse("assurance-goals-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_categories_list(self):
        """Test the categories endpoint"""
        url = reverse("categories-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_subcategories_list(self):
        """Test the subcategories endpoint"""
        url = reverse("subcategories-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_tags_list(self):
        """Test the tags endpoint"""
        url = reverse("tags-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_techniques_list(self):
        """Test the techniques endpoint"""
        url = reverse("techniques-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_attribute_types_list(self):
        """Test the attribute types endpoint"""
        url = reverse("attribute-types-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_attribute_values_list(self):
        """Test the attribute values endpoint"""
        url = reverse("attribute-values-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_resource_types_list(self):
        """Test the resource types endpoint"""
        url = reverse("resource-types-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class TechniqueAPITestCase(APITestCase):
    """Test Techniques API CRUD operations"""

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
        self.technique_list_url = reverse("techniques-list")

    def test_get_technique_list(self):
        """Test retrieving a list of techniques"""
        response = self.client.get(self.technique_list_url)
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
        url = reverse("techniques-detail", args=[self.technique1.id])
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
            self.technique_list_url,
            data=json.dumps(data),
            content_type="application/json",
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
        self.assertEqual(created_technique.attributes.count(), 1)
        self.assertEqual(created_technique.resources.count(), 2)
        self.assertEqual(created_technique.example_use_cases.count(), 1)
        self.assertEqual(created_technique.limitations.count(), 2)

    def test_update_technique(self):
        """Test updating a technique"""
        url = reverse("techniques-detail", args=[self.technique1.id])

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
        url = reverse("techniques-detail", args=[self.technique1.id])

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
        url = reverse("techniques-detail", args=[self.technique1.id])
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
        url = f"{self.technique_list_url}?assurance_goals={self.assurance_goal.id}"
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
        url = f"{self.technique_list_url}?categories={self.category.id}"
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
        url = f"{self.technique_list_url}?search=SHAP"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertGreaterEqual(data["count"], 1)
        technique_names = [t["name"] for t in data["results"]]
        self.assertIn(self.technique1.name, technique_names)

        # Search by partial description
        url = f"{self.technique_list_url}?search=Class+Activation"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertGreaterEqual(data["count"], 1)
        technique_names = [t["name"] for t in data["results"]]
        self.assertIn(self.technique2.name, technique_names)

    def test_filter_techniques_by_model_dependency(self):
        """Test filtering techniques by model dependency"""
        url = f"{self.technique_list_url}?model_dependency=Model-Agnostic"
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
        url = f"{self.technique_list_url}?tags={self.tag1.id}"
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
        response = self.client.get(self.technique_list_url)
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
        url = reverse("categories-by-goal", args=[self.assurance_goal.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should include the category created in setup
        category_ids = [c["id"] for c in data]
        self.assertIn(self.category.id, category_ids)

        # Test subcategories by category
        url = reverse("subcategories-by-category", args=[self.category.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should include the subcategory created in setup
        subcategory_ids = [sc["id"] for sc in data]
        self.assertIn(self.subcategory.id, subcategory_ids)

    def test_debug_endpoint(self):
        """Test that the debug endpoint works"""
        url = reverse("debug-endpoint")

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
