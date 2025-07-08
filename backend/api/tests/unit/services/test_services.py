# api/tests/unit/services/test_services.py
"""
Unit tests for service layer classes.

Tests cover business logic, transaction handling, error conditions,
and integration between different service components.
"""

from unittest.mock import MagicMock, Mock, patch

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase, TransactionTestCase

from api.models import (
    AssuranceGoal,
    ResourceType,
    Tag,
    Technique,
    TechniqueExampleUseCase,
    TechniqueLimitation,
    TechniqueResource,
)
from api.services import (
    TechniqueLimitationService,
    TechniqueOperationError,
    TechniqueResourceService,
    TechniqueService,
    TechniqueUseCaseService,
)
from api.tests.factories import (
    AssuranceGoalFactory,
    ResourceTypeFactory,
    TagFactory,
    TechniqueExampleUseCaseFactory,
    TechniqueFactory,
    TechniqueLimitationFactory,
    TechniqueResourceFactory,
)


class TechniqueServiceTests(TransactionTestCase):
    """Test TechniqueService functionality."""

    def setUp(self):
        """Set up test data."""
        self.service = TechniqueService()
        self.assurance_goal = AssuranceGoalFactory(name="Explainability")
        self.tag = TagFactory(name="interpretability")
        self.resource_type = ResourceTypeFactory(name="Technical Paper")

    def test_service_initialization(self):
        """Test that service initializes with all specialized services."""
        self.assertIsNotNone(self.service.resource_service)
        self.assertIsNotNone(self.service.use_case_service)
        self.assertIsNotNone(self.service.limitation_service)

        # Verify correct types
        self.assertIsInstance(self.service.resource_service, TechniqueResourceService)
        self.assertIsInstance(self.service.use_case_service, TechniqueUseCaseService)
        self.assertIsInstance(
            self.service.limitation_service, TechniqueLimitationService
        )

    def _generate_slug(self, name: str) -> str:
        """Helper to generate slug from name like the model does."""
        import re

        slug = re.sub(r"[^\w\s-]", "", name.lower())
        slug = re.sub(r"[-\s]+", "-", slug)
        return slug.strip("-")

    def test_create_technique_basic(self):
        """Test creating a technique with basic data only."""
        validated_data = {
            "slug": self._generate_slug("Test Technique"),
            "name": "Test Technique",
            "description": "Test description",
            "complexity_rating": 3,
            "computational_cost_rating": 2,
        }
        request_data = {}

        technique = self.service.create_technique(validated_data, request_data)

        self.assertEqual(technique.name, "Test Technique")
        self.assertEqual(technique.description, "Test description")
        self.assertEqual(technique.complexity_rating, 3)
        self.assertEqual(technique.computational_cost_rating, 2)
        self.assertTrue(technique.slug)

    def test_create_technique_with_m2m_relationships(self):
        """Test creating a technique with M2M relationships."""
        validated_data = {
            "slug": self._generate_slug("Test Technique"),
            "name": "Test Technique",
            "description": "Test description",
            "assurance_goals": [self.assurance_goal],
            "tags": [self.tag],
        }
        request_data = {}

        technique = self.service.create_technique(validated_data, request_data)

        self.assertEqual(technique.name, "Test Technique")
        self.assertEqual(technique.assurance_goals.count(), 1)
        self.assertEqual(technique.tags.count(), 1)
        self.assertIn(self.assurance_goal, technique.assurance_goals.all())
        self.assertIn(self.tag, technique.tags.all())

    def test_create_technique_with_nested_objects(self):
        """Test creating a technique with nested objects."""
        validated_data = {
            "slug": self._generate_slug("Test Technique"),
            "name": "Test Technique",
            "description": "Test description",
        }
        request_data = {
            "resources": [
                {
                    "resource_type": self.resource_type.id,
                    "title": "Test Resource",
                    "url": "https://example.com",
                    "description": "Test resource description",
                }
            ],
            "example_use_cases": [
                {
                    "description": "Test use case",
                    "assurance_goal": self.assurance_goal.id,
                }
            ],
            "limitations": [{"description": "Test limitation"}],
        }

        technique = self.service.create_technique(validated_data, request_data)

        self.assertEqual(technique.name, "Test Technique")
        self.assertEqual(technique.resources.count(), 1)
        self.assertEqual(technique.example_use_cases.count(), 1)
        self.assertEqual(technique.limitations.count(), 1)

        # Verify nested objects
        resource = technique.resources.first()
        self.assertEqual(resource.title, "Test Resource")
        self.assertEqual(resource.resource_type, self.resource_type)

        use_case = technique.example_use_cases.first()
        self.assertEqual(use_case.description, "Test use case")
        self.assertEqual(use_case.assurance_goal, self.assurance_goal)

        limitation = technique.limitations.first()
        self.assertEqual(limitation.description, "Test limitation")

    @patch("api.services.logger")
    def test_create_technique_with_error(self, mock_logger):
        """Test that create_technique handles errors correctly."""
        # Create invalid data that will cause an error
        validated_data = {
            "name": None,  # This will cause an IntegrityError
            "description": "Test description",
        }
        request_data = {}

        with self.assertRaises(TechniqueOperationError) as context:
            self.service.create_technique(validated_data, request_data)

        # Verify error message
        self.assertIn("Failed to create technique", str(context.exception))

        # Verify logging
        mock_logger.error.assert_called_once()

    def test_update_technique_basic_fields(self):
        """Test updating basic fields of a technique."""
        technique = TechniqueFactory(name="Original Name")

        validated_data = {
            "name": "Updated Name",
            "description": "Updated description",
        }
        request_data = {}

        updated_technique = self.service.update_technique(
            technique, validated_data, request_data
        )

        self.assertEqual(updated_technique.name, "Updated Name")
        self.assertEqual(updated_technique.description, "Updated description")
        self.assertEqual(updated_technique.slug, technique.slug)  # Same instance

    def test_update_technique_m2m_relationships(self):
        """Test updating M2M relationships."""
        technique = TechniqueFactory()
        original_goal = AssuranceGoalFactory(name="Original Goal")
        technique.assurance_goals.add(original_goal)

        new_goal = AssuranceGoalFactory(name="New Goal")
        validated_data = {
            "assurance_goals": [new_goal],
            "tags": [self.tag],
        }
        request_data = {}

        updated_technique = self.service.update_technique(
            technique, validated_data, request_data
        )

        # Verify relationships were updated
        self.assertEqual(updated_technique.assurance_goals.count(), 1)
        self.assertEqual(updated_technique.tags.count(), 1)
        self.assertNotIn(original_goal, updated_technique.assurance_goals.all())
        self.assertIn(new_goal, updated_technique.assurance_goals.all())
        self.assertIn(self.tag, updated_technique.tags.all())

    def test_update_technique_nested_objects_replacement(self):
        """Test that updating nested objects replaces existing ones."""
        technique = TechniqueFactory()

        # Create existing objects
        existing_resource = TechniqueResourceFactory(technique=technique)
        existing_limitation = TechniqueLimitationFactory(technique=technique)

        # Store IDs to verify deletion
        existing_resource_id = existing_resource.id
        existing_limitation_id = existing_limitation.id

        validated_data = {}
        request_data = {
            "resources": [
                {
                    "resource_type": self.resource_type.id,
                    "title": "New Resource",
                    "url": "https://new-example.com",
                }
            ],
            "limitations": [{"description": "New limitation"}],
        }

        updated_technique = self.service.update_technique(
            technique, validated_data, request_data
        )

        # Verify old objects were replaced
        self.assertEqual(updated_technique.resources.count(), 1)
        self.assertEqual(updated_technique.limitations.count(), 1)

        # Verify new objects exist
        new_resource = updated_technique.resources.first()
        self.assertEqual(new_resource.title, "New Resource")
        self.assertNotEqual(new_resource.id, existing_resource_id)

        new_limitation = updated_technique.limitations.first()
        self.assertEqual(new_limitation.description, "New limitation")
        self.assertNotEqual(new_limitation.id, existing_limitation_id)

        # Verify old objects are deleted
        with self.assertRaises(TechniqueResource.DoesNotExist):
            TechniqueResource.objects.get(id=existing_resource_id)

        with self.assertRaises(TechniqueLimitation.DoesNotExist):
            TechniqueLimitation.objects.get(id=existing_limitation_id)

    @patch("api.services.logger")
    def test_update_technique_with_error(self, mock_logger):
        """Test that update_technique handles errors correctly."""
        technique = TechniqueFactory()

        # Mock the _update_basic_fields method to raise an error
        with patch.object(
            self.service, "_update_basic_fields", side_effect=Exception("Update error")
        ):
            validated_data = {"name": "New Name"}
            request_data = {}

            with self.assertRaises(TechniqueOperationError) as context:
                self.service.update_technique(technique, validated_data, request_data)

            # Verify error message includes technique ID
            self.assertIn("Failed to update technique", str(context.exception))

            # Verify logging
            mock_logger.error.assert_called_once()

    def test_extract_m2m_relationships(self):
        """Test extraction of M2M relationship data."""
        validated_data = {
            "name": "Test",
            "assurance_goals": [self.assurance_goal],
            "tags": [self.tag],
            "other_field": "value",
        }

        m2m_data = self.service._extract_m2m_relationships(validated_data)

        # Verify M2M data extracted
        self.assertEqual(m2m_data["assurance_goals"], [self.assurance_goal])
        self.assertEqual(m2m_data["tags"], [self.tag])
        self.assertIsNone(m2m_data["related_techniques"])

        # Verify M2M fields removed from validated_data
        self.assertNotIn("assurance_goals", validated_data)
        self.assertNotIn("tags", validated_data)
        self.assertIn("name", validated_data)
        self.assertIn("other_field", validated_data)

    def test_extract_nested_data(self):
        """Test extraction of nested relationship data."""
        request_data = {
            "name": "Test",
            "resources": [{"title": "Resource"}],
            "example_use_cases": [{"description": "Use case"}],
            "other_field": "value",
        }

        nested_data = self.service._extract_nested_data(request_data)

        self.assertEqual(nested_data["resources"], [{"title": "Resource"}])
        self.assertEqual(
            nested_data["example_use_cases"], [{"description": "Use case"}]
        )
        self.assertIsNone(nested_data["limitations"])

    def test_set_m2m_relationships(self):
        """Test setting M2M relationships."""
        technique = TechniqueFactory()
        m2m_data = {
            "assurance_goals": [self.assurance_goal],
            "tags": [self.tag],
            "related_techniques": None,
        }

        self.service._set_m2m_relationships(technique, m2m_data)

        self.assertEqual(technique.assurance_goals.count(), 1)
        self.assertEqual(technique.tags.count(), 1)
        self.assertEqual(technique.related_techniques.count(), 0)
        self.assertIn(self.assurance_goal, technique.assurance_goals.all())
        self.assertIn(self.tag, technique.tags.all())

    def test_update_basic_fields(self):
        """Test updating basic fields."""
        technique = TechniqueFactory(name="Original")
        validated_data = {
            "name": "Updated",
            "description": "New description",
            "complexity_rating": 5,
        }

        self.service._update_basic_fields(technique, validated_data)

        technique.refresh_from_db()
        self.assertEqual(technique.name, "Updated")
        self.assertEqual(technique.description, "New description")
        self.assertEqual(technique.complexity_rating, 5)

    def test_transaction_rollback_on_create_error(self):
        """Test that transaction rolls back on creation error."""
        # Mock the nested object creation to fail after technique is created
        with patch.object(
            self.service,
            "_create_nested_objects",
            side_effect=Exception("Nested error"),
        ):
            validated_data = {
                "name": "Test Technique",
                "description": "Test description",
            }
            request_data = {"resources": [{"title": "Test"}]}

            with self.assertRaises(TechniqueOperationError):
                self.service.create_technique(validated_data, request_data)

            # Verify no technique was created due to transaction rollback
            self.assertFalse(Technique.objects.filter(name="Test Technique").exists())

    def test_transaction_rollback_on_update_error(self):
        """Test that transaction rolls back on update error."""
        technique = TechniqueFactory(name="Original")
        original_name = technique.name
        original_goal_count = technique.assurance_goals.count()
        original_goal_ids = set(technique.assurance_goals.values_list("id", flat=True))

        # Mock the basic field update to fail after M2M relationships are set
        with patch.object(
            self.service, "_update_basic_fields", side_effect=Exception("Update error")
        ):
            validated_data = {
                "name": "Should Not Be Saved",
                "assurance_goals": [self.assurance_goal],
            }
            request_data = {}

            with self.assertRaises(TechniqueOperationError):
                self.service.update_technique(technique, validated_data, request_data)

            # Verify technique wasn't updated due to transaction rollback
            technique.refresh_from_db()
            self.assertEqual(technique.name, original_name)
            self.assertEqual(technique.assurance_goals.count(), original_goal_count)
            current_goal_ids = set(
                technique.assurance_goals.values_list("id", flat=True)
            )
            self.assertEqual(current_goal_ids, original_goal_ids)


class TechniqueResourceServiceTests(TestCase):
    """Test TechniqueResourceService functionality."""

    def setUp(self):
        """Set up test data."""
        self.service = TechniqueResourceService()
        self.technique = TechniqueFactory()
        self.resource_type = ResourceTypeFactory()

    def test_create_resources(self):
        """Test creating multiple resources."""
        resources_data = [
            {
                "resource_type": self.resource_type.id,
                "title": "Resource 1",
                "url": "https://example.com/1",
                "description": "First resource",
            },
            {
                "resource_type": self.resource_type.id,
                "title": "Resource 2",
                "url": "https://example.com/2",
                "description": "Second resource",
            },
        ]

        self.service.create_resources(self.technique, resources_data)

        self.assertEqual(self.technique.resources.count(), 2)

        resource1 = self.technique.resources.get(title="Resource 1")
        self.assertEqual(resource1.url, "https://example.com/1")
        self.assertEqual(resource1.resource_type, self.resource_type)

        resource2 = self.technique.resources.get(title="Resource 2")
        self.assertEqual(resource2.url, "https://example.com/2")
        self.assertEqual(resource2.resource_type, self.resource_type)

    def test_replace_resources(self):
        """Test replacing existing resources."""
        # Create existing resources
        existing1 = TechniqueResourceFactory(
            technique=self.technique, title="Existing 1"
        )
        existing2 = TechniqueResourceFactory(
            technique=self.technique, title="Existing 2"
        )

        # Store IDs to verify deletion
        existing1_id = existing1.id
        existing2_id = existing2.id

        # New resources data
        new_resources_data = [
            {
                "resource_type": self.resource_type.id,
                "title": "New Resource",
                "url": "https://example.com/new",
            }
        ]

        self.service.replace_resources(self.technique, new_resources_data)

        # Verify old resources are deleted and new one created
        self.assertEqual(self.technique.resources.count(), 1)

        new_resource = self.technique.resources.first()
        self.assertEqual(new_resource.title, "New Resource")
        self.assertNotEqual(new_resource.id, existing1_id)
        self.assertNotEqual(new_resource.id, existing2_id)

        # Verify old resources no longer exist
        with self.assertRaises(TechniqueResource.DoesNotExist):
            TechniqueResource.objects.get(id=existing1_id)
        with self.assertRaises(TechniqueResource.DoesNotExist):
            TechniqueResource.objects.get(id=existing2_id)

    def test_create_single_resource_with_resource_type_id(self):
        """Test creating a resource with resource_type as ID."""
        resource_data = {
            "resource_type": self.resource_type.id,
            "title": "Test Resource",
            "url": "https://example.com",
        }

        self.service._create_single_resource(self.technique, resource_data)

        resource = self.technique.resources.first()
        self.assertEqual(resource.title, "Test Resource")
        self.assertEqual(resource.resource_type, self.resource_type)

    def test_create_single_resource_with_resource_type_instance(self):
        """Test creating a resource with resource_type as instance."""
        resource_data = {
            "resource_type": self.resource_type,
            "title": "Test Resource",
            "url": "https://example.com",
        }

        self.service._create_single_resource(self.technique, resource_data)

        resource = self.technique.resources.first()
        self.assertEqual(resource.title, "Test Resource")
        self.assertEqual(resource.resource_type, self.resource_type)

    def test_create_single_resource_with_invalid_resource_type_id(self):
        """Test creating a resource with invalid resource_type ID."""
        resource_data = {
            "resource_type": 99999,  # Non-existent ID
            "title": "Test Resource",
            "url": "https://example.com",
        }

        # Should raise TechniqueOperationError for invalid resource type
        with self.assertRaises(TechniqueOperationError) as context:
            self.service._create_single_resource(self.technique, resource_data)

        # Verify the error message
        self.assertIn(
            "ResourceType with ID 99999 does not exist", str(context.exception)
        )

        # Verify no resource was created
        self.assertEqual(self.technique.resources.count(), 0)


class TechniqueUseCaseServiceTests(TestCase):
    """Test TechniqueUseCaseService functionality."""

    def setUp(self):
        """Set up test data."""
        self.service = TechniqueUseCaseService()
        self.technique = TechniqueFactory()
        self.assurance_goal = AssuranceGoalFactory()

    def test_create_use_cases(self):
        """Test creating multiple use cases."""
        use_cases_data = [
            {"description": "Use case 1", "assurance_goal": self.assurance_goal.id},
            {"description": "Use case 2", "assurance_goal": None},
        ]

        self.service.create_use_cases(self.technique, use_cases_data)

        self.assertEqual(self.technique.example_use_cases.count(), 2)

        use_case1 = self.technique.example_use_cases.get(description="Use case 1")
        self.assertEqual(use_case1.assurance_goal, self.assurance_goal)

        use_case2 = self.technique.example_use_cases.get(description="Use case 2")
        self.assertIsNone(use_case2.assurance_goal)

    def test_replace_use_cases(self):
        """Test replacing existing use cases."""
        # Create existing use cases
        existing1 = TechniqueExampleUseCaseFactory(technique=self.technique)
        existing2 = TechniqueExampleUseCaseFactory(technique=self.technique)

        existing1_id = existing1.id
        existing2_id = existing2.id

        # New use cases data
        new_use_cases_data = [
            {"description": "New use case", "assurance_goal": self.assurance_goal.id}
        ]

        self.service.replace_use_cases(self.technique, new_use_cases_data)

        # Verify replacement
        self.assertEqual(self.technique.example_use_cases.count(), 1)

        new_use_case = self.technique.example_use_cases.first()
        self.assertEqual(new_use_case.description, "New use case")
        self.assertNotEqual(new_use_case.id, existing1_id)
        self.assertNotEqual(new_use_case.id, existing2_id)

    def test_create_single_use_case_with_goal_id(self):
        """Test creating a use case with assurance_goal as ID."""
        use_case_data = {
            "description": "Test use case",
            "assurance_goal": self.assurance_goal.id,
        }

        self.service._create_single_use_case(self.technique, use_case_data)

        use_case = self.technique.example_use_cases.first()
        self.assertEqual(use_case.description, "Test use case")
        self.assertEqual(use_case.assurance_goal, self.assurance_goal)

    def test_create_single_use_case_with_goal_instance(self):
        """Test creating a use case with assurance_goal as instance."""
        use_case_data = {
            "description": "Test use case",
            "assurance_goal": self.assurance_goal,
        }

        self.service._create_single_use_case(self.technique, use_case_data)

        use_case = self.technique.example_use_cases.first()
        self.assertEqual(use_case.description, "Test use case")
        self.assertEqual(use_case.assurance_goal, self.assurance_goal)

    @patch("api.services.logger")
    def test_create_single_use_case_with_invalid_goal_id(self, mock_logger):
        """Test creating a use case with invalid assurance_goal ID."""
        use_case_data = {
            "description": "Test use case",
            "assurance_goal": 99999,  # Non-existent ID
        }

        self.service._create_single_use_case(self.technique, use_case_data)

        # Verify use case was created but with null goal
        use_case = self.technique.example_use_cases.first()
        self.assertEqual(use_case.description, "Test use case")
        self.assertIsNone(use_case.assurance_goal)

        # Verify warning was logged
        mock_logger.warning.assert_called_once()


class TechniqueLimitationServiceTests(TestCase):
    """Test TechniqueLimitationService functionality."""

    def setUp(self):
        """Set up test data."""
        self.service = TechniqueLimitationService()
        self.technique = TechniqueFactory()

    def test_create_limitations_with_dict_format(self):
        """Test creating limitations with dictionary format."""
        limitations_data = [
            {"description": "Limitation 1"},
            {"description": "Limitation 2"},
        ]

        self.service.create_limitations(self.technique, limitations_data)

        self.assertEqual(self.technique.limitations.count(), 2)

        descriptions = list(
            self.technique.limitations.values_list("description", flat=True)
        )
        self.assertIn("Limitation 1", descriptions)
        self.assertIn("Limitation 2", descriptions)

    def test_create_limitations_with_string_format(self):
        """Test creating limitations with string format."""
        limitations_data = ["String limitation 1", "String limitation 2"]

        self.service.create_limitations(self.technique, limitations_data)

        self.assertEqual(self.technique.limitations.count(), 2)

        descriptions = list(
            self.technique.limitations.values_list("description", flat=True)
        )
        self.assertIn("String limitation 1", descriptions)
        self.assertIn("String limitation 2", descriptions)

    def test_create_limitations_mixed_formats(self):
        """Test creating limitations with mixed formats."""
        limitations_data = ["String limitation", {"description": "Dict limitation"}]

        self.service.create_limitations(self.technique, limitations_data)

        self.assertEqual(self.technique.limitations.count(), 2)

        descriptions = list(
            self.technique.limitations.values_list("description", flat=True)
        )
        self.assertIn("String limitation", descriptions)
        self.assertIn("Dict limitation", descriptions)

    def test_replace_limitations(self):
        """Test replacing existing limitations."""
        # Create existing limitations
        existing1 = TechniqueLimitationFactory(technique=self.technique)
        existing2 = TechniqueLimitationFactory(technique=self.technique)

        existing1_id = existing1.id
        existing2_id = existing2.id

        # New limitations data
        new_limitations_data = ["New limitation 1", {"description": "New limitation 2"}]

        self.service.replace_limitations(self.technique, new_limitations_data)

        # Verify replacement
        self.assertEqual(self.technique.limitations.count(), 2)

        descriptions = list(
            self.technique.limitations.values_list("description", flat=True)
        )
        self.assertIn("New limitation 1", descriptions)
        self.assertIn("New limitation 2", descriptions)

        # Verify old limitations are gone
        self.assertFalse(
            TechniqueLimitation.objects.filter(
                id__in=[existing1_id, existing2_id]
            ).exists()
        )

    def test_create_single_limitation_string(self):
        """Test creating a single limitation from string."""
        self.service._create_single_limitation(self.technique, "Test limitation")

        limitation = self.technique.limitations.first()
        self.assertEqual(limitation.description, "Test limitation")
        self.assertEqual(limitation.technique, self.technique)

    def test_create_single_limitation_dict(self):
        """Test creating a single limitation from dictionary."""
        limitation_data = {"description": "Dict limitation"}

        self.service._create_single_limitation(self.technique, limitation_data)

        limitation = self.technique.limitations.first()
        self.assertEqual(limitation.description, "Dict limitation")
        self.assertEqual(limitation.technique, self.technique)


class ServiceIntegrationTests(TransactionTestCase):
    """Test integration between different services."""

    def setUp(self):
        """Set up test data."""
        self.technique_service = TechniqueService()
        self.assurance_goal = AssuranceGoalFactory()
        self.tag = TagFactory()
        self.resource_type = ResourceTypeFactory()

    def _generate_slug(self, name: str) -> str:
        """Helper to generate slug from name like the model does."""
        import re

        slug = re.sub(r"[^\w\s-]", "", name.lower())
        slug = re.sub(r"[-\s]+", "-", slug)
        return slug.strip("-")

    def test_complete_technique_creation_workflow(self):
        """Test creating a technique with all types of relationships."""
        validated_data = {
            "slug": self._generate_slug("Complete Technique"),
            "name": "Complete Technique",
            "description": "A technique with all relationships",
            "complexity_rating": 4,
            "computational_cost_rating": 3,
            "assurance_goals": [self.assurance_goal],
            "tags": [self.tag],
        }

        request_data = {
            "resources": [
                {
                    "resource_type": self.resource_type.id,
                    "title": "Complete Resource",
                    "url": "https://example.com",
                    "description": "Resource description",
                }
            ],
            "example_use_cases": [
                {
                    "description": "Complete use case",
                    "assurance_goal": self.assurance_goal.id,
                }
            ],
            "limitations": ["String limitation", {"description": "Dict limitation"}],
        }

        technique = self.technique_service.create_technique(
            validated_data, request_data
        )

        # Verify all aspects were created correctly
        self.assertEqual(technique.name, "Complete Technique")
        self.assertEqual(technique.complexity_rating, 4)
        self.assertEqual(technique.computational_cost_rating, 3)

        # Verify M2M relationships
        self.assertEqual(technique.assurance_goals.count(), 1)
        self.assertEqual(technique.tags.count(), 1)
        self.assertIn(self.assurance_goal, technique.assurance_goals.all())
        self.assertIn(self.tag, technique.tags.all())

        # Verify nested objects
        self.assertEqual(technique.resources.count(), 1)
        self.assertEqual(technique.example_use_cases.count(), 1)
        self.assertEqual(technique.limitations.count(), 2)

        # Verify specific nested object details
        resource = technique.resources.first()
        self.assertEqual(resource.title, "Complete Resource")
        self.assertEqual(resource.resource_type, self.resource_type)

        use_case = technique.example_use_cases.first()
        self.assertEqual(use_case.description, "Complete use case")
        self.assertEqual(use_case.assurance_goal, self.assurance_goal)

        limitations = technique.limitations.all()
        descriptions = [l.description for l in limitations]
        self.assertIn("String limitation", descriptions)
        self.assertIn("Dict limitation", descriptions)

    def test_complete_technique_update_workflow(self):
        """Test updating a technique with all types of relationships."""
        # Create initial technique
        technique = TechniqueFactory(name="Original Technique")
        original_goal = AssuranceGoalFactory(name="Original Goal")
        technique.assurance_goals.add(original_goal)

        # Add some initial nested objects
        TechniqueResourceFactory(technique=technique, title="Original Resource")
        TechniqueLimitationFactory(
            technique=technique, description="Original limitation"
        )

        # Update data
        new_goal = AssuranceGoalFactory(name="New Goal")
        validated_data = {
            "name": "Updated Technique",
            "assurance_goals": [new_goal],
            "tags": [self.tag],
        }

        request_data = {
            "resources": [
                {
                    "resource_type": self.resource_type.id,
                    "title": "Updated Resource",
                    "url": "https://updated.com",
                }
            ],
            "limitations": ["Updated limitation"],
        }

        updated_technique = self.technique_service.update_technique(
            technique, validated_data, request_data
        )

        # Verify updates
        self.assertEqual(updated_technique.name, "Updated Technique")

        # Verify M2M relationships were updated
        self.assertEqual(updated_technique.assurance_goals.count(), 1)
        self.assertEqual(updated_technique.tags.count(), 1)
        self.assertNotIn(original_goal, updated_technique.assurance_goals.all())
        self.assertIn(new_goal, updated_technique.assurance_goals.all())
        self.assertIn(self.tag, updated_technique.tags.all())

        # Verify nested objects were replaced
        self.assertEqual(updated_technique.resources.count(), 1)
        self.assertEqual(updated_technique.limitations.count(), 1)

        resource = updated_technique.resources.first()
        self.assertEqual(resource.title, "Updated Resource")

        limitation = updated_technique.limitations.first()
        self.assertEqual(limitation.description, "Updated limitation")

    def test_service_error_handling_consistency(self):
        """Test that all services handle errors consistently."""
        technique = TechniqueFactory()

        # Test each specialized service error handling
        resource_service = TechniqueResourceService()
        use_case_service = TechniqueUseCaseService()
        limitation_service = TechniqueLimitationService()

        # Invalid resource data (missing required fields)
        with self.assertRaises(Exception):
            resource_service.create_resources(technique, [{"title": ""}])  # Missing URL

        # Invalid use case data
        with self.assertRaises(Exception):
            use_case_service.create_use_cases(
                technique, [{"description": ""}]
            )  # Empty description

        # Services should handle errors gracefully without breaking the database state
        self.assertEqual(technique.resources.count(), 0)
        self.assertEqual(technique.example_use_cases.count(), 0)
        self.assertEqual(technique.limitations.count(), 0)


class TechniqueSlugUpdateTests(TransactionTestCase):
    """Test slug update functionality including FK relationship preservation."""

    def setUp(self):
        """Set up test data."""
        self.service = TechniqueService()
        self.technique = TechniqueFactory(slug="original-technique")

        # Create relationships that need to be preserved
        self.assurance_goal = AssuranceGoalFactory()
        self.tag = TagFactory()
        self.related_technique = TechniqueFactory()

        self.technique.assurance_goals.add(self.assurance_goal)
        self.technique.tags.add(self.tag)
        self.technique.related_techniques.add(self.related_technique)

        # Create FK relationships that need to be preserved
        self.resource = TechniqueResourceFactory(technique=self.technique)
        self.use_case = TechniqueExampleUseCaseFactory(technique=self.technique)
        self.limitation = TechniqueLimitationFactory(technique=self.technique)

    def test_update_technique_slug_preserves_fk_relationships(self):
        """Test that FK relationships are preserved when slug changes."""
        original_resource_id = self.resource.id
        original_use_case_id = self.use_case.id
        original_limitation_id = self.limitation.id

        # Store original counts
        original_resource_count = self.technique.resources.count()
        original_use_case_count = self.technique.example_use_cases.count()
        original_limitation_count = self.technique.limitations.count()

        # Update the slug
        validated_data = {"slug": "updated-technique-slug"}
        request_data = {}

        updated_technique = self.service.update_technique(
            self.technique, validated_data, request_data
        )

        # Verify the slug changed
        self.assertEqual(updated_technique.slug, "updated-technique-slug")

        # Verify FK relationships were preserved
        self.assertEqual(updated_technique.resources.count(), original_resource_count)
        self.assertEqual(
            updated_technique.example_use_cases.count(), original_use_case_count
        )
        self.assertEqual(
            updated_technique.limitations.count(), original_limitation_count
        )

        # Verify the same objects are still connected (by their IDs)
        preserved_resource = updated_technique.resources.first()
        preserved_use_case = updated_technique.example_use_cases.first()
        preserved_limitation = updated_technique.limitations.first()

        self.assertEqual(preserved_resource.id, original_resource_id)
        self.assertEqual(preserved_use_case.id, original_use_case_id)
        self.assertEqual(preserved_limitation.id, original_limitation_id)

        # Verify FK references were updated
        self.assertEqual(preserved_resource.technique, updated_technique)
        self.assertEqual(preserved_use_case.technique, updated_technique)
        self.assertEqual(preserved_limitation.technique, updated_technique)

    def test_update_technique_slug_preserves_m2m_relationships(self):
        """Test that M2M relationships are preserved when slug changes."""
        # Update the slug
        validated_data = {"slug": "slug-with-m2m-preservation"}
        request_data = {}

        updated_technique = self.service.update_technique(
            self.technique, validated_data, request_data
        )

        # Verify M2M relationships were preserved
        self.assertEqual(updated_technique.assurance_goals.count(), 1)
        self.assertEqual(updated_technique.tags.count(), 1)
        self.assertEqual(updated_technique.related_techniques.count(), 1)

        self.assertIn(self.assurance_goal, updated_technique.assurance_goals.all())
        self.assertIn(self.tag, updated_technique.tags.all())
        self.assertIn(
            self.related_technique, updated_technique.related_techniques.all()
        )

    def test_update_technique_slug_with_multiple_fk_objects(self):
        """Test slug update with multiple FK objects of each type."""
        # Add more FK objects
        resource2 = TechniqueResourceFactory(technique=self.technique)
        use_case2 = TechniqueExampleUseCaseFactory(technique=self.technique)
        limitation2 = TechniqueLimitationFactory(technique=self.technique)

        # Store IDs
        resource_ids = [self.resource.id, resource2.id]
        use_case_ids = [self.use_case.id, use_case2.id]
        limitation_ids = [self.limitation.id, limitation2.id]

        # Update the slug
        validated_data = {"slug": "multiple-fk-objects-slug"}
        request_data = {}

        updated_technique = self.service.update_technique(
            self.technique, validated_data, request_data
        )

        # Verify all FK objects are preserved
        self.assertEqual(updated_technique.resources.count(), 2)
        self.assertEqual(updated_technique.example_use_cases.count(), 2)
        self.assertEqual(updated_technique.limitations.count(), 2)

        # Verify all specific objects are still connected
        preserved_resource_ids = list(
            updated_technique.resources.values_list("id", flat=True)
        )
        preserved_use_case_ids = list(
            updated_technique.example_use_cases.values_list("id", flat=True)
        )
        preserved_limitation_ids = list(
            updated_technique.limitations.values_list("id", flat=True)
        )

        self.assertEqual(set(preserved_resource_ids), set(resource_ids))
        self.assertEqual(set(preserved_use_case_ids), set(use_case_ids))
        self.assertEqual(set(preserved_limitation_ids), set(limitation_ids))

    def test_update_technique_slug_transaction_rollback_on_fk_error(self):
        """Test that transaction rolls back if FK update fails."""
        # Mock the update operation to fail for one of the FK models
        with patch("api.models.TechniqueResource.objects.filter") as mock_filter:
            mock_queryset = Mock()
            mock_queryset.update.side_effect = Exception("FK update failed")
            mock_filter.return_value = mock_queryset

            validated_data = {"slug": "should-fail-slug"}
            request_data = {}

            # The update should raise an exception
            with self.assertRaises(Exception):
                self.service.update_technique(
                    self.technique, validated_data, request_data
                )

            # Verify the original technique still exists with original slug
            # (transaction should have rolled back)
            original_technique = Technique.objects.get(id=self.technique.id)
            self.assertEqual(original_technique.slug, "original-technique")

    def test_update_technique_without_slug_change_skips_fk_preservation(self):
        """Test that FK preservation logic is skipped when slug doesn't change."""
        # Update without changing slug
        validated_data = {"name": "Updated Name Only"}
        request_data = {}

        # Mock the _update_technique_slug method to verify it's not called
        with patch.object(self.service, "_update_technique_slug") as mock_slug_update:
            updated_technique = self.service.update_technique(
                self.technique, validated_data, request_data
            )

            # Verify slug update method was not called
            mock_slug_update.assert_not_called()

            # Verify the name was updated but slug remained the same
            self.assertEqual(updated_technique.name, "Updated Name Only")
            self.assertEqual(updated_technique.slug, "original-technique")
