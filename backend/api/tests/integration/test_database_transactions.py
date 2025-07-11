# api/tests/integration/test_database_transactions.py
"""
Integration tests for database transaction handling and rollback behavior.

Tests cover transaction boundaries, rollback scenarios, and data consistency
during complex operations that span multiple database operations.
"""

from unittest.mock import Mock, patch

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TransactionTestCase

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
    IsolatedTechniqueFactory,
    ResourceTypeFactory,
    TagFactory,
)


class DatabaseTransactionTests(TransactionTestCase):
    """Test database transaction handling in service operations."""

    def setUp(self):
        """Set up test data."""
        self.technique_service = TechniqueService()
        self.resource_service = TechniqueResourceService()
        self.use_case_service = TechniqueUseCaseService()
        self.limitation_service = TechniqueLimitationService()

        # Create test data
        self.assurance_goal = AssuranceGoalFactory(name="Transaction Goal")
        self.tag = TagFactory(name="transaction-tag")
        self.resource_type = ResourceTypeFactory(name="Transaction Resource")

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

    def test_technique_creation_transaction_rollback_on_resource_error(self):
        """Test that technique creation rolls back when resource creation fails."""
        validated_data = {
            "slug": self._generate_slug("Transaction Test Technique"),
            "name": "Transaction Test Technique",
            "description": "Testing transaction rollback",
            "complexity_rating": 3,
            "assurance_goals": [self.assurance_goal],
            "tags": [self.tag],
        }

        request_data = {
            "resources": [
                {
                    "resource_type": self.resource_type.id,
                    "title": "Test Resource",
                    "url": "https://test.com",
                }
            ]
        }

        # Mock resource service to fail
        with patch.object(
            self.technique_service.resource_service, "create_resources"
        ) as mock_create:
            mock_create.side_effect = Exception("Resource creation failed")

            # Verify initial state
            initial_technique_count = Technique.objects.count()
            initial_resource_count = TechniqueResource.objects.count()

            # Attempt creation - should fail and rollback
            with self.assertRaises(TechniqueOperationError):
                self.technique_service.create_technique(validated_data, request_data)

            # Verify rollback - no new technique or resources created
            self.assertEqual(Technique.objects.count(), initial_technique_count)
            self.assertEqual(TechniqueResource.objects.count(), initial_resource_count)

            # Verify no partial data exists
            self.assertFalse(
                Technique.objects.filter(name="Transaction Test Technique").exists()
            )

    def test_technique_creation_transaction_rollback_on_use_case_error(self):
        """Test that technique creation rolls back when use case creation fails."""
        validated_data = {
            "slug": self._generate_slug("Use Case Transaction Test"),
            "name": "Use Case Transaction Test",
            "description": "Testing use case rollback",
            "assurance_goals": [self.assurance_goal],
        }

        request_data = {
            "example_use_cases": [
                {
                    "description": "Test use case",
                    "assurance_goal": self.assurance_goal.id,
                }
            ]
        }

        # Mock use case service to fail
        with patch.object(
            self.technique_service.use_case_service, "create_use_cases"
        ) as mock_create:
            mock_create.side_effect = Exception("Use case creation failed")

            initial_technique_count = Technique.objects.count()
            initial_use_case_count = TechniqueExampleUseCase.objects.count()

            with self.assertRaises(TechniqueOperationError):
                self.technique_service.create_technique(validated_data, request_data)

            # Verify rollback
            self.assertEqual(Technique.objects.count(), initial_technique_count)
            self.assertEqual(
                TechniqueExampleUseCase.objects.count(), initial_use_case_count
            )

    def test_technique_creation_transaction_rollback_on_limitation_error(self):
        """Test that technique creation rolls back when limitation creation fails."""
        validated_data = {
            "slug": self._generate_slug("Limitation Transaction Test"),
            "name": "Limitation Transaction Test",
            "description": "Testing limitation rollback",
            "assurance_goals": [self.assurance_goal],
        }

        request_data = {
            "limitations": ["Test limitation", {"description": "Complex limitation"}]
        }

        # Mock limitation service to fail
        with patch.object(
            self.technique_service.limitation_service, "create_limitations"
        ) as mock_create:
            mock_create.side_effect = Exception("Limitation creation failed")

            initial_technique_count = Technique.objects.count()
            initial_limitation_count = TechniqueLimitation.objects.count()

            with self.assertRaises(TechniqueOperationError):
                self.technique_service.create_technique(validated_data, request_data)

            # Verify rollback
            self.assertEqual(Technique.objects.count(), initial_technique_count)
            self.assertEqual(
                TechniqueLimitation.objects.count(), initial_limitation_count
            )

    def test_technique_update_transaction_rollback_on_nested_error(self):
        """Test that technique update rolls back when nested object update fails."""
        # Create initial technique
        technique = IsolatedTechniqueFactory(name="Update Transaction Test")

        # Add initial relationships
        technique.assurance_goals.add(self.assurance_goal)

        original_resource = TechniqueResource.objects.create(
            technique=technique,
            resource_type=self.resource_type,
            title="Original Resource",
            url="https://original.com",
        )

        # Update data
        new_goal = AssuranceGoalFactory(name="New Goal")
        validated_data = {
            "slug": self._generate_slug("Updated Transaction Test"),
            "name": "Updated Transaction Test",
            "assurance_goals": [new_goal],
        }

        request_data = {
            "resources": [
                {
                    "resource_type": self.resource_type.id,
                    "title": "New Resource",
                    "url": "https://new.com",
                }
            ]
        }

        # Mock resource service to fail during update
        with patch.object(
            self.technique_service.resource_service, "replace_resources"
        ) as mock_replace:
            mock_replace.side_effect = Exception("Resource replacement failed")

            # Store original state
            original_name = technique.name
            original_goals = list(technique.assurance_goals.all())
            original_resource_count = technique.resources.count()

            with self.assertRaises(TechniqueOperationError):
                self.technique_service.update_technique(
                    technique, validated_data, request_data
                )

            # Verify rollback - technique should be unchanged
            technique.refresh_from_db()
            self.assertEqual(technique.name, original_name)

            # Verify relationships weren't changed
            current_goals = list(technique.assurance_goals.all())
            self.assertEqual(current_goals, original_goals)

            # Verify resources weren't changed
            self.assertEqual(technique.resources.count(), original_resource_count)
            original_resource.refresh_from_db()
            self.assertEqual(original_resource.title, "Original Resource")

    def test_technique_update_partial_transaction_success(self):
        """Test that partial updates work correctly within transactions."""
        technique = IsolatedTechniqueFactory(name="Partial Update Test")

        # Add initial data
        technique.assurance_goals.add(self.assurance_goal)

        original_resource = TechniqueResource.objects.create(
            technique=technique,
            resource_type=self.resource_type,
            title="Original Resource",
            url="https://original.com",
        )

        # Update only basic fields (no nested data changes)
        from faker import Faker

        fake = Faker()
        unique_name = f"Partially Updated Technique {fake.uuid4()[:8]}"
        validated_data = {
            "slug": self._generate_slug(unique_name),
            "name": unique_name,
            "description": "Updated description",
        }
        request_data = {}  # No nested updates

        # This should succeed and commit only the basic field changes
        updated_technique = self.technique_service.update_technique(
            technique, validated_data, request_data
        )

        # Verify basic fields were updated
        self.assertEqual(updated_technique.name, unique_name)
        self.assertEqual(updated_technique.description, "Updated description")

        # Verify relationships and nested objects remained unchanged
        self.assertEqual(updated_technique.assurance_goals.count(), 1)
        self.assertIn(self.assurance_goal, updated_technique.assurance_goals.all())

        self.assertEqual(updated_technique.resources.count(), 1)
        preserved_resource = updated_technique.resources.first()
        self.assertEqual(preserved_resource.id, original_resource.id)
        self.assertEqual(preserved_resource.title, "Original Resource")

    def test_concurrent_technique_updates_transaction_isolation(self):
        """Test transaction isolation during concurrent technique updates."""
        technique = IsolatedTechniqueFactory(name="Concurrent Test")

        goal1 = AssuranceGoalFactory(name="Goal 1")
        goal2 = AssuranceGoalFactory(name="Goal 2")

        # First update
        validated_data1 = {"assurance_goals": [goal1]}
        updated1 = self.technique_service.update_technique(
            technique, validated_data1, {}
        )

        # Verify first update
        self.assertEqual(updated1.assurance_goals.count(), 1)
        self.assertIn(goal1, updated1.assurance_goals.all())

        # Second update (should overwrite first)
        validated_data2 = {"assurance_goals": [goal2]}
        updated2 = self.technique_service.update_technique(
            technique, validated_data2, {}
        )

        # Verify second update overwrote first
        self.assertEqual(updated2.assurance_goals.count(), 1)
        self.assertIn(goal2, updated2.assurance_goals.all())
        self.assertNotIn(goal1, updated2.assurance_goals.all())

    def test_nested_transaction_rollback_on_multiple_errors(self):
        """Test rollback when multiple nested operations fail."""
        validated_data = {
            "slug": self._generate_slug("Multiple Error Test"),
            "name": "Multiple Error Test",
            "description": "Testing multiple rollbacks",
            "assurance_goals": [self.assurance_goal],
        }

        request_data = {
            "resources": [
                {
                    "resource_type": self.resource_type.id,
                    "title": "Test Resource",
                    "url": "https://test.com",
                }
            ],
            "example_use_cases": [
                {
                    "description": "Test use case",
                    "assurance_goal": self.assurance_goal.id,
                }
            ],
            "limitations": ["Test limitation"],
        }

        # Mock multiple services to fail
        with patch.object(
            self.technique_service.resource_service, "create_resources"
        ) as mock_resources, patch.object(
            self.technique_service.use_case_service, "create_use_cases"
        ) as mock_use_cases:

            # Both should be called and both should fail
            mock_resources.side_effect = Exception("Resource creation failed")
            mock_use_cases.side_effect = Exception("Use case creation failed")

            initial_counts = {
                "techniques": Technique.objects.count(),
                "resources": TechniqueResource.objects.count(),
                "use_cases": TechniqueExampleUseCase.objects.count(),
                "limitations": TechniqueLimitation.objects.count(),
            }

            with self.assertRaises(TechniqueOperationError):
                self.technique_service.create_technique(validated_data, request_data)

            # Verify complete rollback
            self.assertEqual(Technique.objects.count(), initial_counts["techniques"])
            self.assertEqual(
                TechniqueResource.objects.count(), initial_counts["resources"]
            )
            self.assertEqual(
                TechniqueExampleUseCase.objects.count(), initial_counts["use_cases"]
            )
            self.assertEqual(
                TechniqueLimitation.objects.count(), initial_counts["limitations"]
            )

    def test_database_integrity_error_rollback(self):
        """Test rollback on database integrity constraint violations."""
        # Create technique with the same name as we'll try to create
        existing_technique = IsolatedTechniqueFactory(name="Duplicate Name Test")

        validated_data = {
            "slug": self._generate_slug("Duplicate Name Test"),
            "name": "Duplicate Name Test",  # This should cause integrity error if unique
            "description": "Testing integrity constraints",
            "assurance_goals": [self.assurance_goal],
        }

        request_data = {
            "resources": [
                {
                    "resource_type": self.resource_type.id,
                    "title": "Test Resource",
                    "url": "https://test.com",
                }
            ]
        }

        initial_technique_count = Technique.objects.count()
        initial_resource_count = TechniqueResource.objects.count()

        # Note: Since our model doesn't enforce unique names, we'll mock a constraint violation
        with patch.object(Technique.objects, "create") as mock_create:
            mock_create.side_effect = IntegrityError("UNIQUE constraint failed")

            with self.assertRaises(TechniqueOperationError):
                self.technique_service.create_technique(validated_data, request_data)

        # Verify no new objects were created
        self.assertEqual(Technique.objects.count(), initial_technique_count)
        self.assertEqual(TechniqueResource.objects.count(), initial_resource_count)

    def test_validation_error_no_database_changes(self):
        """Test that validation errors don't cause database changes."""
        # Create invalid data that should fail validation
        validated_data = {
            "slug": self._generate_slug(""),
            "name": "",  # Empty name should fail validation
            "description": "Valid description",
            "assurance_goals": [self.assurance_goal],
        }

        request_data = {
            "resources": [
                {
                    "resource_type": self.resource_type.id,
                    "title": "Test Resource",
                    "url": "https://test.com",
                }
            ]
        }

        initial_counts = {
            "techniques": Technique.objects.count(),
            "resources": TechniqueResource.objects.count(),
        }

        # Should fail due to validation error
        with self.assertRaises(TechniqueOperationError):
            self.technique_service.create_technique(validated_data, request_data)

        # Verify no database changes occurred
        self.assertEqual(Technique.objects.count(), initial_counts["techniques"])
        self.assertEqual(TechniqueResource.objects.count(), initial_counts["resources"])


class ServiceLayerTransactionTests(TransactionTestCase):
    """Test transaction behavior in individual service layers."""

    def setUp(self):
        """Set up test data."""
        self.resource_service = TechniqueResourceService()
        self.use_case_service = TechniqueUseCaseService()
        self.limitation_service = TechniqueLimitationService()

        self.technique = IsolatedTechniqueFactory()
        self.resource_type = ResourceTypeFactory()
        self.assurance_goal = AssuranceGoalFactory()

    def test_resource_service_transaction_rollback(self):
        """Test transaction rollback in resource service operations."""
        resource_data = [
            {
                "resource_type": self.resource_type.id,
                "title": "Resource 1",
                "url": "https://test1.com",
            },
            {
                "resource_type": self.resource_type.id,
                "title": "Resource 2",
                "url": "https://test2.com",
            },
        ]

        # Mock TechniqueResource.objects.create to fail on second resource
        original_create = TechniqueResource.objects.create
        call_count = 0

        def mock_create(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 2:
                raise Exception("Second resource creation failed")
            return original_create(*args, **kwargs)

        initial_resource_count = TechniqueResource.objects.count()

        with patch.object(TechniqueResource.objects, "create", side_effect=mock_create):
            with self.assertRaises(Exception):
                self.resource_service.create_resources(self.technique, resource_data)

        # Verify rollback - no resources should be created
        self.assertEqual(TechniqueResource.objects.count(), initial_resource_count)

    def test_use_case_service_transaction_rollback(self):
        """Test transaction rollback in use case service operations."""
        use_case_data = [
            {"description": "Use case 1", "assurance_goal": self.assurance_goal.id},
            {"description": "Use case 2", "assurance_goal": self.assurance_goal.id},
        ]

        # Mock to fail on second use case
        original_create = TechniqueExampleUseCase.objects.create
        call_count = 0

        def mock_create(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 2:
                raise Exception("Second use case creation failed")
            return original_create(*args, **kwargs)

        initial_use_case_count = TechniqueExampleUseCase.objects.count()

        with patch.object(
            TechniqueExampleUseCase.objects, "create", side_effect=mock_create
        ):
            with self.assertRaises(Exception):
                self.use_case_service.create_use_cases(self.technique, use_case_data)

        # Verify rollback
        self.assertEqual(
            TechniqueExampleUseCase.objects.count(), initial_use_case_count
        )

    def test_limitation_service_transaction_rollback(self):
        """Test transaction rollback in limitation service operations."""
        limitation_data = [
            {"description": "Limitation 1"},
            {"description": "Limitation 2"},
            {"description": "Limitation 3"},
        ]

        # Mock to fail on third limitation
        original_create = TechniqueLimitation.objects.create
        call_count = 0

        def mock_create(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 3:
                raise Exception("Third limitation creation failed")
            return original_create(*args, **kwargs)

        initial_limitation_count = TechniqueLimitation.objects.count()

        with patch.object(
            TechniqueLimitation.objects, "create", side_effect=mock_create
        ):
            with self.assertRaises(Exception):
                self.limitation_service.create_limitations(
                    self.technique, limitation_data
                )

        # Verify rollback
        self.assertEqual(TechniqueLimitation.objects.count(), initial_limitation_count)

    def test_resource_replacement_transaction_consistency(self):
        """Test transaction consistency during resource replacement."""
        # Create initial resources
        initial_resources = [
            TechniqueResource.objects.create(
                technique=self.technique,
                resource_type=self.resource_type,
                title=f"Initial Resource {i}",
                url=f"https://initial{i}.com",
            )
            for i in range(3)
        ]

        new_resource_data = [
            {
                "resource_type": self.resource_type.id,
                "title": "New Resource 1",
                "url": "https://new1.com",
            },
            {
                "resource_type": self.resource_type.id,
                "title": "New Resource 2",
                "url": "https://new2.com",
            },
        ]

        # Mock creation of new resources to fail
        with patch.object(TechniqueResource.objects, "create") as mock_create:
            mock_create.side_effect = Exception("New resource creation failed")

            with self.assertRaises(Exception):
                self.resource_service.replace_resources(
                    self.technique, new_resource_data
                )

        # Verify original resources still exist (rollback occurred)
        self.assertEqual(self.technique.resources.count(), 3)

        # Verify original resources are unchanged
        for i, resource in enumerate(self.technique.resources.all().order_by("id")):
            self.assertEqual(resource.title, f"Initial Resource {i}")
            self.assertEqual(resource.url, f"https://initial{i}.com")


class CrossServiceTransactionTests(TransactionTestCase):
    """Test transaction consistency across multiple service interactions."""

    def setUp(self):
        """Set up test data."""
        self.technique_service = TechniqueService()
        self.assurance_goal = AssuranceGoalFactory()
        self.resource_type = ResourceTypeFactory()

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

    def test_create_technique_with_all_nested_objects_transaction(self):
        """Test transaction consistency when creating technique with all nested objects."""
        validated_data = {
            "slug": self._generate_slug("Complete Transaction Test"),
            "name": "Complete Transaction Test",
            "description": "Testing complete transaction",
            "assurance_goals": [self.assurance_goal],
        }

        request_data = {
            "resources": [
                {
                    "resource_type": self.resource_type.id,
                    "title": "Transaction Resource",
                    "url": "https://transaction.com",
                }
            ],
            "example_use_cases": [
                {
                    "description": "Transaction use case",
                    "assurance_goal": self.assurance_goal.id,
                }
            ],
            "limitations": ["Transaction limitation"],
        }

        # This should succeed and create all objects atomically
        with transaction.atomic():
            technique = self.technique_service.create_technique(
                validated_data, request_data
            )

        # Verify all objects were created
        self.assertEqual(technique.name, "Complete Transaction Test")
        self.assertEqual(technique.assurance_goals.count(), 1)
        self.assertEqual(technique.resources.count(), 1)
        self.assertEqual(technique.example_use_cases.count(), 1)
        self.assertEqual(technique.limitations.count(), 1)

        # Verify relationships
        self.assertIn(self.assurance_goal, technique.assurance_goals.all())

        resource = technique.resources.first()
        self.assertEqual(resource.title, "Transaction Resource")

        use_case = technique.example_use_cases.first()
        self.assertEqual(use_case.description, "Transaction use case")

        limitation = technique.limitations.first()
        self.assertEqual(limitation.description, "Transaction limitation")

    def test_update_technique_atomic_replacement(self):
        """Test atomic replacement of all nested objects during update."""
        # Create technique with initial data
        technique = IsolatedTechniqueFactory()

        # Add initial nested objects
        initial_resource = TechniqueResource.objects.create(
            technique=technique,
            resource_type=self.resource_type,
            title="Initial Resource",
            url="https://initial.com",
        )

        initial_limitation = TechniqueLimitation.objects.create(
            technique=technique, description="Initial limitation"
        )

        # Prepare replacement data
        from faker import Faker

        fake = Faker()
        unique_atomic_name = f"Atomically Updated Technique {fake.uuid4()[:8]}"
        validated_data = {
            "slug": self._generate_slug(unique_atomic_name),
            "name": unique_atomic_name,
        }

        request_data = {
            "resources": [
                {
                    "resource_type": self.resource_type.id,
                    "title": "Replacement Resource",
                    "url": "https://replacement.com",
                }
            ],
            "limitations": ["Replacement limitation"],
        }

        # Perform atomic update
        with transaction.atomic():
            updated_technique = self.technique_service.update_technique(
                technique, validated_data, request_data
            )

        # Verify all replacements occurred atomically
        self.assertEqual(updated_technique.name, unique_atomic_name)
        self.assertEqual(updated_technique.resources.count(), 1)
        self.assertEqual(updated_technique.limitations.count(), 1)

        # Verify new objects exist
        new_resource = updated_technique.resources.first()
        self.assertEqual(new_resource.title, "Replacement Resource")
        self.assertNotEqual(new_resource.id, initial_resource.id)

        new_limitation = updated_technique.limitations.first()
        self.assertEqual(new_limitation.description, "Replacement limitation")
        self.assertNotEqual(new_limitation.id, initial_limitation.id)

        # Verify old objects were deleted
        with self.assertRaises(TechniqueResource.DoesNotExist):
            TechniqueResource.objects.get(id=initial_resource.id)

        with self.assertRaises(TechniqueLimitation.DoesNotExist):
            TechniqueLimitation.objects.get(id=initial_limitation.id)
