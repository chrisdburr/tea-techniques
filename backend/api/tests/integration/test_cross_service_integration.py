# api/tests/integration/test_cross_service_integration.py
"""
Integration tests for cross-service interactions.

Tests how different services work together, data flows between components,
and complex workflows that span multiple service layers.
"""

import json
from unittest.mock import Mock, patch

import pytest
from django.core.exceptions import ValidationError
from django.db import transaction
from django.test import TransactionTestCase

from api.models import (AssuranceGoal, ResourceType, Tag, Technique,
                        TechniqueExampleUseCase, TechniqueLimitation,
                        TechniqueResource)
from api.serializers import TechniqueSerializer
from api.services import (TechniqueLimitationService, TechniqueOperationError,
                          TechniqueResourceService, TechniqueService,
                          TechniqueUseCaseService)
from api.tests.factories import (AssuranceGoalFactory,
                                 IsolatedTechniqueFactory, ResourceTypeFactory,
                                 TagFactory, TechniqueFactory)
from api.utils import DataValidationError, TechniqueDataExtractor


class ServiceLayerIntegrationTests(TransactionTestCase):
    """Test integration between different service components."""

    def setUp(self):
        """Set up test data."""
        self.technique_service = TechniqueService()
        self.resource_service = TechniqueResourceService()
        self.use_case_service = TechniqueUseCaseService()
        self.limitation_service = TechniqueLimitationService()

        # Create test data
        self.assurance_goal = AssuranceGoalFactory(name="Test Goal")
        self.tag = TagFactory(name="test-tag")
        self.resource_type = ResourceTypeFactory(name="Test Resource")

    def _generate_slug(self, name: str) -> str:
        """Helper to generate slug from name like the model does."""
        import re

        from faker import Faker

        fake = Faker()
        slug = re.sub(r"[^\w\s-]", "", name.lower())
        slug = re.sub(r"[-\s]+", "-", slug)
        # Add UUID to ensure uniqueness in tests
        slug = f"{slug.strip('-')}-{fake.uuid4()[:8]}"
        return slug

    def test_complete_technique_creation_workflow(self):
        """Test creating a technique with all related objects through services."""
        validated_data = {
            "slug": self._generate_slug("Integration Test Technique"),
            "name": "Integration Test Technique",
            "description": "Testing cross-service integration",
            "complexity_rating": 3,
            "computational_cost_rating": 2,
            "assurance_goals": [self.assurance_goal],
            "tags": [self.tag],
        }

        request_data = {
            "resources": [
                {
                    "resource_type": self.resource_type.id,
                    "title": "Integration Resource",
                    "url": "https://integration-test.com",
                    "description": "Resource for testing",
                }
            ],
            "example_use_cases": [
                {
                    "description": "Integration use case",
                    "assurance_goal": self.assurance_goal.id,
                }
            ],
            "limitations": [
                "Integration test limitation",
                {"description": "Complex limitation structure"},
            ],
        }

        # Create technique through service
        technique = self.technique_service.create_technique(
            validated_data, request_data
        )

        # Verify all components were created correctly
        self.assertEqual(technique.name, "Integration Test Technique")
        self.assertEqual(technique.assurance_goals.count(), 1)
        self.assertEqual(technique.tags.count(), 1)
        self.assertEqual(technique.resources.count(), 1)
        self.assertEqual(technique.example_use_cases.count(), 1)
        self.assertEqual(technique.limitations.count(), 2)

        # Verify relationships
        self.assertIn(self.assurance_goal, technique.assurance_goals.all())
        self.assertIn(self.tag, technique.tags.all())

        # Verify nested objects
        resource = technique.resources.first()
        self.assertEqual(resource.title, "Integration Resource")
        self.assertEqual(resource.resource_type, self.resource_type)

        use_case = technique.example_use_cases.first()
        self.assertEqual(use_case.description, "Integration use case")
        self.assertEqual(use_case.assurance_goal, self.assurance_goal)

        limitations = technique.limitations.all()
        descriptions = [l.description for l in limitations]
        self.assertIn("Integration test limitation", descriptions)
        self.assertIn("Complex limitation structure", descriptions)

    def test_technique_update_with_replacement_workflow(self):
        """Test updating a technique with complete replacement of nested objects."""
        # Create initial technique
        technique = IsolatedTechniqueFactory(name="Original Technique")

        # Add initial relationships and objects
        original_goal = AssuranceGoalFactory(name="Original Goal")
        technique.assurance_goals.add(original_goal)

        original_resource = TechniqueResource.objects.create(
            technique=technique,
            resource_type=self.resource_type,
            title="Original Resource",
            url="https://original.com",
        )

        original_limitation = TechniqueLimitation.objects.create(
            technique=technique, description="Original limitation"
        )

        # Update data with new objects
        new_goal = AssuranceGoalFactory(name="New Goal")
        new_tag = TagFactory(name="new-tag")

        from faker import Faker

        fake = Faker()
        unique_updated_name = f"Updated Technique {fake.uuid4()[:8]}"
        validated_data = {
            "slug": self._generate_slug(unique_updated_name),
            "name": unique_updated_name,
            "assurance_goals": [new_goal],
            "tags": [new_tag],
        }

        request_data = {
            "resources": [
                {
                    "resource_type": self.resource_type.id,
                    "title": "New Resource",
                    "url": "https://new.com",
                }
            ],
            "limitations": ["New limitation"],
        }

        # Update through service
        updated_technique = self.technique_service.update_technique(
            technique, validated_data, request_data
        )

        # Verify updates
        self.assertEqual(updated_technique.name, unique_updated_name)

        # Verify relationships were replaced
        self.assertEqual(updated_technique.assurance_goals.count(), 1)
        self.assertEqual(updated_technique.tags.count(), 1)
        self.assertNotIn(original_goal, updated_technique.assurance_goals.all())
        self.assertIn(new_goal, updated_technique.assurance_goals.all())
        self.assertIn(new_tag, updated_technique.tags.all())

        # Verify nested objects were replaced
        self.assertEqual(updated_technique.resources.count(), 1)
        self.assertEqual(updated_technique.limitations.count(), 1)

        new_resource = updated_technique.resources.first()
        self.assertEqual(new_resource.title, "New Resource")
        self.assertNotEqual(new_resource.id, original_resource.id)

        new_limitation = updated_technique.limitations.first()
        self.assertEqual(new_limitation.description, "New limitation")
        self.assertNotEqual(new_limitation.id, original_limitation.id)

        # Verify old objects were deleted
        with self.assertRaises(TechniqueResource.DoesNotExist):
            TechniqueResource.objects.get(id=original_resource.id)

        with self.assertRaises(TechniqueLimitation.DoesNotExist):
            TechniqueLimitation.objects.get(id=original_limitation.id)

    def test_service_error_propagation(self):
        """Test that errors propagate correctly through service layers."""
        # Test with invalid data that should cause service error
        validated_data = {
            "slug": self._generate_slug("Error Test Technique"),
            "name": "Error Test Technique",
            "description": "Testing error handling",
        }

        # Mock the resource service to raise an error
        with patch.object(
            self.technique_service.resource_service, "create_resources"
        ) as mock_create:
            mock_create.side_effect = Exception("Resource creation failed")

            request_data = {
                "resources": [
                    {
                        "resource_type": self.resource_type.id,
                        "title": "Test Resource",
                        "url": "https://test.com",
                    }
                ]
            }

            # Should raise TechniqueOperationError
            with self.assertRaises(TechniqueOperationError) as context:
                self.technique_service.create_technique(validated_data, request_data)

            # Verify error message
            self.assertIn("Failed to create technique", str(context.exception))
            self.assertIn("Resource creation failed", str(context.exception))

            # Verify no technique was created due to transaction rollback
            self.assertFalse(
                Technique.objects.filter(name="Error Test Technique").exists()
            )

    def test_partial_update_workflow(self):
        """Test updating only specific parts of a technique."""
        # Create technique with all components
        technique = IsolatedTechniqueFactory()
        original_goal = AssuranceGoalFactory()
        technique.assurance_goals.add(original_goal)

        original_resource = TechniqueResource.objects.create(
            technique=technique,
            resource_type=self.resource_type,
            title="Original Resource",
            url="https://original.com",
        )

        # Update only basic fields (no nested data)
        from faker import Faker

        fake = Faker()
        unique_name = f"Partially Updated Technique {fake.uuid4()[:8]}"
        validated_data = {
            "slug": self._generate_slug(unique_name),
            "name": unique_name,
            "description": "Updated description only",
        }
        request_data = {}  # No nested updates

        updated_technique = self.technique_service.update_technique(
            technique, validated_data, request_data
        )

        # Verify basic fields were updated
        self.assertEqual(updated_technique.name, unique_name)
        self.assertEqual(updated_technique.description, "Updated description only")

        # Verify relationships and nested objects were preserved
        self.assertEqual(updated_technique.assurance_goals.count(), 1)
        self.assertIn(original_goal, updated_technique.assurance_goals.all())

        self.assertEqual(updated_technique.resources.count(), 1)
        preserved_resource = updated_technique.resources.first()
        self.assertEqual(preserved_resource.id, original_resource.id)
        self.assertEqual(preserved_resource.title, "Original Resource")


class SerializerServiceIntegrationTests(TransactionTestCase):
    """Test integration between serializers and services."""

    def setUp(self):
        """Set up test data."""
        self.assurance_goal = AssuranceGoalFactory(name="Serializer Goal")
        self.tag = TagFactory(name="serializer-tag")
        self.resource_type = ResourceTypeFactory(name="Serializer Resource")

    def _generate_slug(self, name: str) -> str:
        """Helper to generate slug from name like the model does."""
        import re

        from faker import Faker

        fake = Faker()
        slug = re.sub(r"[^\w\s-]", "", name.lower())
        slug = re.sub(r"[-\s]+", "-", slug)
        # Add UUID to ensure uniqueness in tests
        slug = f"{slug.strip('-')}-{fake.uuid4()[:8]}"
        return slug

    def test_serializer_to_service_data_flow(self):
        """Test data flow from serializer validation to service execution."""
        # Prepare serializer data
        data = {
            "name": "Serializer Integration Test",
            "description": "Testing serializer-service integration",
            "complexity_rating": 4,
            "assurance_goal_ids": [self.assurance_goal.id],
            "tag_ids": [self.tag.id],
        }

        # Mock request with nested data
        from rest_framework.test import APIRequestFactory

        factory = APIRequestFactory()

        request_data = {
            "name": "Serializer Integration Test",
            "description": "Testing serializer-service integration",
            "complexity_rating": 4,
            "assurance_goal_ids": [self.assurance_goal.id],
            "tag_ids": [self.tag.id],
            "resources": [
                {
                    "resource_type": self.resource_type.id,
                    "title": "Serializer Resource",
                    "url": "https://serializer-test.com",
                }
            ],
        }

        request = factory.post("/techniques/", request_data, format="json")
        request.data = request_data

        # Test through serializer
        serializer = TechniqueSerializer(data=data, context={"request": request})

        # Verify validation
        self.assertTrue(
            serializer.is_valid(), f"Validation errors: {serializer.errors}"
        )

        # Create through serializer (which uses service)
        technique = serializer.save()

        # Verify integration worked correctly
        self.assertEqual(technique.name, "Serializer Integration Test")
        self.assertEqual(technique.complexity_rating, 4)

        # Verify relationships were set correctly
        self.assertEqual(technique.assurance_goals.count(), 1)
        self.assertEqual(technique.tags.count(), 1)
        self.assertIn(self.assurance_goal, technique.assurance_goals.all())
        self.assertIn(self.tag, technique.tags.all())

        # Verify nested objects were created
        self.assertEqual(technique.resources.count(), 1)
        resource = technique.resources.first()
        self.assertEqual(resource.title, "Serializer Resource")
        self.assertEqual(resource.resource_type, self.resource_type)

    def test_serializer_validation_integration(self):
        """Test that serializer validation integrates with service validation."""
        # Test with invalid rating values
        data = {
            "name": "Invalid Rating Test",
            "description": "Testing validation integration",
            "complexity_rating": 10,  # Invalid: out of range
            "computational_cost_rating": 0,  # Invalid: out of range
            "assurance_goal_ids": [99999],  # Invalid: non-existent ID
        }

        request = Mock()
        request.data = data

        serializer = TechniqueSerializer(data=data, context={"request": request})

        # Verify validation fails
        self.assertFalse(serializer.is_valid())

        # Check specific validation errors
        errors = serializer.errors
        self.assertIn("complexity_rating", errors)
        self.assertIn("computational_cost_rating", errors)
        self.assertIn("assurance_goal_ids", errors)


class UtilsServiceIntegrationTests(TransactionTestCase):
    """Test integration between utilities and services."""

    def setUp(self):
        """Set up test data."""
        self.extractor = TechniqueDataExtractor()
        self.technique_service = TechniqueService()
        self.resource_type = ResourceTypeFactory(name="Utils Resource")
        self.assurance_goal = AssuranceGoalFactory(name="Utils Goal")

    def _generate_slug(self, name: str) -> str:
        """Helper to generate slug from name like the model does."""
        import re

        from faker import Faker

        fake = Faker()
        slug = re.sub(r"[^\w\s-]", "", name.lower())
        slug = re.sub(r"[-\s]+", "-", slug)
        # Add UUID to ensure uniqueness in tests
        slug = f"{slug.strip('-')}-{fake.uuid4()[:8]}"
        return slug

    def test_data_extraction_to_service_workflow(self):
        """Test workflow from data extraction to service execution."""
        # Raw technique data (as might come from import)
        raw_data = {
            "name": "Extracted Technique",
            "description": "Technique created from extracted data",
            "complexity_rating": 3,
            "computational_cost_rating": 2,
            "assurance_goals": ["Utils Goal"],
            "tags": ["extracted-tag"],
            "resources": [
                {
                    "type": "Utils Resource",
                    "title": "Extracted Resource",
                    "url": "https://extracted.com",
                    "authors": ["Author 1", "Author 2"],
                    "publication_date": "2023-01-15",
                }
            ],
            "limitations": [
                "Extracted limitation",
                {"description": "Complex extracted limitation"},
            ],
        }

        # Extract and process data
        basic_data = self.extractor.extract_basic_data(raw_data)
        relationship_data = self.extractor.extract_relationship_data(raw_data)
        nested_data = self.extractor.extract_nested_data(raw_data)

        # Process nested data
        processed_resources = []
        for resource_data in nested_data["resources"]:
            processed_resource = self.extractor.process_resource_data(resource_data)
            processed_resources.append(processed_resource)

        processed_limitations = self.extractor.process_limitation_data(
            nested_data["limitations"]
        )

        # Prepare service data
        validated_data = {
            **basic_data,
            "slug": self._generate_slug(
                "Extracted Technique"
            ),  # Override extractor's empty slug
            "assurance_goals": [self.assurance_goal],  # Resolved from names
        }

        request_data = {
            "resources": [
                {
                    "resource_type": self.resource_type.id,
                    "title": processed_resources[0]["title"],
                    "url": processed_resources[0]["url"],
                    "authors": processed_resources[0]["authors"],
                    "publication_date": processed_resources[0][
                        "parsed_publication_date"
                    ],
                }
            ],
            "limitations": [{"description": desc} for desc in processed_limitations],
        }

        # Create through service
        technique = self.technique_service.create_technique(
            validated_data, request_data
        )

        # Verify integration worked
        self.assertEqual(technique.name, "Extracted Technique")
        self.assertEqual(technique.complexity_rating, 3)
        self.assertEqual(technique.computational_cost_rating, 2)

        # Verify relationships
        self.assertEqual(technique.assurance_goals.count(), 1)
        self.assertIn(self.assurance_goal, technique.assurance_goals.all())

        # Verify processed resource
        self.assertEqual(technique.resources.count(), 1)
        resource = technique.resources.first()
        self.assertEqual(resource.title, "Extracted Resource")
        self.assertEqual(resource.authors, "Author 1, Author 2")
        self.assertEqual(resource.publication_date.strftime("%Y-%m-%d"), "2023-01-15")

        # Verify processed limitations
        self.assertEqual(technique.limitations.count(), 2)
        limitation_descriptions = [l.description for l in technique.limitations.all()]
        self.assertIn("Extracted limitation", limitation_descriptions)
        self.assertIn("Complex extracted limitation", limitation_descriptions)

    def test_validation_integration_with_services(self):
        """Test that utility validation integrates with service validation."""
        from api.utils import TechniqueDataValidator

        # Test with invalid data
        invalid_data = {
            "name": "",  # Invalid: empty name
            "description": "Valid description",
            "complexity_rating": 10,  # Invalid: out of range
        }

        # Utility validation should catch issues
        with self.assertRaises(DataValidationError):
            TechniqueDataValidator.validate_required_fields(invalid_data)

        # Rating validation should fail
        self.assertFalse(TechniqueDataValidator.validate_ratings(invalid_data))

        # Service should also handle invalid data gracefully
        validated_data = {
            "slug": self._generate_slug(""),
            "name": "",
            "description": "Valid description",
        }

        with self.assertRaises(TechniqueOperationError):
            self.technique_service.create_technique(validated_data, {})


class CrossComponentDataFlowTests(TransactionTestCase):
    """Test data flow across multiple components in complex scenarios."""

    def _generate_slug(self, name: str) -> str:
        """Helper to generate slug from name like the model does."""
        import re

        from faker import Faker

        fake = Faker()
        slug = re.sub(r"[^\w\s-]", "", name.lower())
        slug = re.sub(r"[-\s]+", "-", slug)
        # Add UUID to ensure uniqueness in tests
        slug = f"{slug.strip('-')}-{fake.uuid4()[:8]}"
        return slug

    def test_end_to_end_technique_lifecycle(self):
        """Test complete technique lifecycle from creation to deletion."""
        # Setup
        goal = AssuranceGoalFactory(name="Lifecycle Goal")
        tag = TagFactory(name="lifecycle-tag")
        resource_type = ResourceTypeFactory(name="Lifecycle Resource")

        # 1. Create technique with full data
        validated_data = {
            "slug": self._generate_slug("Lifecycle Test Technique"),
            "name": "Lifecycle Test Technique",
            "description": "Testing complete lifecycle",
            "complexity_rating": 3,
            "assurance_goals": [goal],
            "tags": [tag],
        }

        request_data = {
            "resources": [
                {
                    "resource_type": resource_type.id,
                    "title": "Lifecycle Resource",
                    "url": "https://lifecycle.com",
                }
            ],
            "example_use_cases": [
                {"description": "Lifecycle use case", "assurance_goal": goal.id}
            ],
            "limitations": ["Lifecycle limitation"],
        }

        service = TechniqueService()
        technique = service.create_technique(validated_data, request_data)

        # Verify creation
        technique_slug = technique.slug
        self.assertEqual(Technique.objects.filter(slug=technique_slug).count(), 1)
        self.assertEqual(technique.resources.count(), 1)
        self.assertEqual(technique.example_use_cases.count(), 1)
        self.assertEqual(technique.limitations.count(), 1)

        # 2. Update technique
        update_data = {
            "name": "Updated Lifecycle Technique",
            "description": "Updated description",
        }

        update_request_data = {
            "resources": [
                {
                    "resource_type": resource_type.id,
                    "title": "Updated Resource",
                    "url": "https://updated-lifecycle.com",
                }
            ]
        }

        updated_technique = service.update_technique(
            technique, update_data, update_request_data
        )

        # Verify update
        self.assertEqual(updated_technique.name, "Updated Lifecycle Technique")
        self.assertEqual(updated_technique.resources.count(), 1)
        updated_resource = updated_technique.resources.first()
        self.assertEqual(updated_resource.title, "Updated Resource")

        # 3. Delete technique and verify cascade
        resource_id = updated_resource.id
        use_case_id = updated_technique.example_use_cases.first().id
        limitation_id = updated_technique.limitations.first().id

        updated_technique.delete()

        # Verify cascade deletion
        with self.assertRaises(Technique.DoesNotExist):
            Technique.objects.get(slug=technique_slug)

        with self.assertRaises(TechniqueResource.DoesNotExist):
            TechniqueResource.objects.get(id=resource_id)

        with self.assertRaises(TechniqueExampleUseCase.DoesNotExist):
            TechniqueExampleUseCase.objects.get(id=use_case_id)

        with self.assertRaises(TechniqueLimitation.DoesNotExist):
            TechniqueLimitation.objects.get(id=limitation_id)

        # Verify M2M relationships don't affect other objects
        goal.refresh_from_db()
        tag.refresh_from_db()
        resource_type.refresh_from_db()
        self.assertTrue(goal.id)
        self.assertTrue(tag.id)
        self.assertTrue(resource_type.id)

    def test_concurrent_technique_operations(self):
        """Test handling of concurrent operations on techniques."""
        # Create technique
        technique = IsolatedTechniqueFactory(name="Concurrent Test")
        goal1 = AssuranceGoalFactory(name="Goal 1")
        goal2 = AssuranceGoalFactory(name="Goal 2")

        service = TechniqueService()

        # Simulate concurrent updates
        def update_with_goal1():
            validated_data = {"assurance_goals": [goal1]}
            return service.update_technique(technique, validated_data, {})

        def update_with_goal2():
            validated_data = {"assurance_goals": [goal2]}
            return service.update_technique(technique, validated_data, {})

        # Both operations should succeed (last one wins)
        result1 = update_with_goal1()
        result2 = update_with_goal2()

        # Verify final state
        final_technique = Technique.objects.get(slug=technique.slug)
        final_goals = list(final_technique.assurance_goals.all())

        # Should have the goal from the last operation
        self.assertEqual(len(final_goals), 1)
        self.assertEqual(final_goals[0], goal2)
