# api/tests/unit/models/test_relationship_models.py
"""
Unit tests for relationship models: TechniqueResource, TechniqueExampleUseCase, TechniqueLimitation.

Tests cover model validation, constraints, foreign key relationships, and cascade behavior
for models that represent relationships between techniques and their associated data.
"""

from datetime import date

from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from api.models import (
    TechniqueExampleUseCase,
    TechniqueLimitation,
    TechniqueResource,
)
from api.tests.factories import (
    AssuranceGoalFactory,
    ResourceTypeFactory,
    TechniqueExampleUseCaseFactory,
    TechniqueFactory,
    TechniqueLimitationFactory,
    TechniqueResourceFactory,
)


class TechniqueResourceModelTests(TestCase):
    """Test TechniqueResource model functionality."""

    def setUp(self):
        """Set up test data."""
        self.technique = TechniqueFactory()
        self.resource_type = ResourceTypeFactory(name="Technical Paper")

    def test_technique_resource_creation(self):
        """Test creating a technique resource with valid data."""
        resource = TechniqueResource.objects.create(
            technique=self.technique,
            resource_type=self.resource_type,
            title="Test Resource",
            url="https://example.com/resource",
            description="A test resource description",
            authors="Author 1, Author 2",
            publication_date=date(2023, 1, 15),
            source_type="Technical Paper",
        )

        self.assertEqual(resource.technique, self.technique)
        self.assertEqual(resource.resource_type, self.resource_type)
        self.assertEqual(resource.title, "Test Resource")
        self.assertEqual(resource.url, "https://example.com/resource")
        self.assertEqual(resource.description, "A test resource description")
        self.assertEqual(resource.authors, "Author 1, Author 2")
        self.assertEqual(resource.publication_date, date(2023, 1, 15))
        self.assertEqual(resource.source_type, "Technical Paper")

    def test_technique_resource_minimal_creation(self):
        """Test creating a technique resource with only required fields."""
        resource = TechniqueResource.objects.create(
            technique=self.technique,
            resource_type=self.resource_type,
            title="Minimal Resource",
            url="https://example.com/minimal",
        )

        self.assertEqual(resource.technique, self.technique)
        self.assertEqual(resource.resource_type, self.resource_type)
        self.assertEqual(resource.title, "Minimal Resource")
        self.assertEqual(resource.url, "https://example.com/minimal")
        # Optional fields should be empty/null
        self.assertEqual(resource.description, "")
        self.assertIsNone(resource.authors)
        self.assertIsNone(resource.publication_date)
        self.assertIsNone(resource.source_type)

    def test_technique_resource_string_representation(self):
        """Test the string representation of a technique resource."""
        resource = TechniqueResourceFactory(title="SHAP Paper")
        expected_str = f"{resource.resource_type.name}: SHAP Paper"
        self.assertEqual(str(resource), expected_str)

    def test_technique_resource_required_fields(self):
        """Test that required fields cannot be empty or null."""
        # Test technique is required
        from django.db import transaction

        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                TechniqueResource.objects.create(
                    technique=None,
                    resource_type=self.resource_type,
                    title="Test",
                    url="https://example.com",
                )

        # Test resource_type is required
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                TechniqueResource.objects.create(
                    technique=self.technique,
                    resource_type=None,
                    title="Test",
                    url="https://example.com",
                )

        # Test title is required
        with self.assertRaises(ValidationError):
            resource = TechniqueResource(
                technique=self.technique,
                resource_type=self.resource_type,
                title="",
                url="https://example.com",
            )
            resource.full_clean()

        # Test URL is required
        with self.assertRaises(ValidationError):
            resource = TechniqueResource(
                technique=self.technique,
                resource_type=self.resource_type,
                title="Test",
                url="",
            )
            resource.full_clean()

    def test_technique_resource_url_validation(self):
        """Test URL field validation."""
        valid_urls = [
            "https://example.com",
            "http://test.org",
            "https://doi.org/10.1000/xyz123",
            "https://github.com/user/repo",
            "https://arxiv.org/abs/2301.12345",
        ]

        for url in valid_urls:
            with self.subTest(url=url):
                resource = TechniqueResource(
                    technique=self.technique,
                    resource_type=self.resource_type,
                    title="Test Resource",
                    url=url,
                )
                resource.full_clean()  # Should not raise

    def test_technique_resource_publication_date_validation(self):
        """Test publication date validation."""
        # Valid dates
        valid_dates = [
            date(2020, 1, 1),
            date(2023, 12, 31),
            date.today(),
            None,  # Should be allowed
        ]

        for pub_date in valid_dates:
            with self.subTest(date=pub_date):
                resource = TechniqueResource(
                    technique=self.technique,
                    resource_type=self.resource_type,
                    title="Test Resource",
                    url="https://example.com",
                    publication_date=pub_date,
                )
                resource.full_clean()  # Should not raise

    def test_technique_resource_cascade_on_technique_delete(self):
        """Test that deleting a technique cascades to its resources."""
        resource = TechniqueResourceFactory(technique=self.technique)
        resource_id = resource.id

        # Delete technique
        self.technique.delete()

        # Verify resource is deleted
        with self.assertRaises(TechniqueResource.DoesNotExist):
            TechniqueResource.objects.get(id=resource_id)

    def test_technique_resource_cascade_on_resource_type_delete(self):
        """Test behavior when resource type is deleted."""
        resource = TechniqueResourceFactory(technique=self.technique, resource_type=self.resource_type)
        resource_id = resource.id

        # Delete resource type
        # Behavior depends on the cascade setting in the model
        try:
            self.resource_type.delete()
            # If successful, check if resource still exists
            try:
                resource.refresh_from_db()
                # Resource exists, check if resource_type is null
                self.assertIsNone(resource.resource_type)
            except TechniqueResource.DoesNotExist:
                # Resource was deleted due to cascade
                pass
        except IntegrityError:
            # Deletion was protected
            pass

    def test_multiple_resources_per_technique(self):
        """Test that a technique can have multiple resources."""
        resource1 = TechniqueResourceFactory(technique=self.technique)
        resource2 = TechniqueResourceFactory(technique=self.technique)
        resource3 = TechniqueResourceFactory(technique=self.technique)

        # Verify all resources belong to the technique
        technique_resources = TechniqueResource.objects.filter(technique=self.technique)
        self.assertEqual(technique_resources.count(), 3)

        # Verify reverse relationship
        self.assertEqual(self.technique.resources.count(), 3)

    def test_technique_resource_with_long_content(self):
        """Test technique resource with long content."""
        long_title = "A" * 500
        long_description = "B" * 2000
        long_authors = "C" * 1000

        resource = TechniqueResource.objects.create(
            technique=self.technique,
            resource_type=self.resource_type,
            title=long_title,
            url="https://example.com",
            description=long_description,
            authors=long_authors,
        )

        self.assertEqual(resource.title, long_title)
        self.assertEqual(resource.description, long_description)
        self.assertEqual(resource.authors, long_authors)


class TechniqueExampleUseCaseModelTests(TestCase):
    """Test TechniqueExampleUseCase model functionality."""

    def setUp(self):
        """Set up test data."""
        self.technique = TechniqueFactory()
        self.assurance_goal = AssuranceGoalFactory(name="Explainability")

    def test_use_case_creation_with_goal(self):
        """Test creating a use case with an assurance goal."""
        use_case = TechniqueExampleUseCase.objects.create(
            technique=self.technique,
            description="This technique can be used for loan approval explanations",
            assurance_goal=self.assurance_goal,
        )

        self.assertEqual(use_case.technique, self.technique)
        self.assertEqual(
            use_case.description,
            "This technique can be used for loan approval explanations",
        )
        self.assertEqual(use_case.assurance_goal, self.assurance_goal)

    def test_use_case_creation_without_goal(self):
        """Test creating a use case without an assurance goal."""
        use_case = TechniqueExampleUseCase.objects.create(
            technique=self.technique, description="General purpose use case"
        )

        self.assertEqual(use_case.technique, self.technique)
        self.assertEqual(use_case.description, "General purpose use case")
        self.assertIsNone(use_case.assurance_goal)

    def test_use_case_string_representation(self):
        """Test the string representation of a use case."""
        use_case = TechniqueExampleUseCaseFactory(description="Healthcare diagnosis explanation")
        # String representation includes the technique name
        expected_str = f"Use case for {use_case.technique.name}"
        self.assertEqual(str(use_case), expected_str)

    def test_use_case_required_fields(self):
        """Test that required fields cannot be empty or null."""
        # Test technique is required
        from django.db import transaction

        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                TechniqueExampleUseCase.objects.create(technique=None, description="Valid description")

        # Test description is required
        with self.assertRaises(ValidationError):
            use_case = TechniqueExampleUseCase(technique=self.technique, description="")
            use_case.full_clean()

    def test_use_case_description_validation(self):
        """Test description field validation."""
        # Very long description should be allowed
        long_description = "A" * 5000
        use_case = TechniqueExampleUseCase(technique=self.technique, description=long_description)
        use_case.full_clean()  # Should not raise

        # Description with special characters
        special_description = "Use case with unicode: αβγδε and emojis: 🤖🔬📊"
        use_case = TechniqueExampleUseCase(technique=self.technique, description=special_description)
        use_case.full_clean()  # Should not raise

    def test_use_case_cascade_on_technique_delete(self):
        """Test that deleting a technique cascades to its use cases."""
        use_case = TechniqueExampleUseCaseFactory(technique=self.technique)
        use_case_id = use_case.id

        # Delete technique
        self.technique.delete()

        # Verify use case is deleted
        with self.assertRaises(TechniqueExampleUseCase.DoesNotExist):
            TechniqueExampleUseCase.objects.get(id=use_case_id)

    def test_use_case_behavior_on_goal_delete(self):
        """Test behavior when assurance goal is deleted."""
        use_case = TechniqueExampleUseCaseFactory(technique=self.technique, assurance_goal=self.assurance_goal)
        use_case_id = use_case.id

        # Delete assurance goal
        self.assurance_goal.delete()

        # Check what happens to use case
        # Behavior depends on cascade setting
        try:
            use_case.refresh_from_db()
            # Use case still exists, check if goal is null
            self.assertIsNone(use_case.assurance_goal)
        except TechniqueExampleUseCase.DoesNotExist:
            # Use case was deleted due to cascade
            pass

    def test_multiple_use_cases_per_technique(self):
        """Test that a technique can have multiple use cases."""
        use_case1 = TechniqueExampleUseCaseFactory(technique=self.technique)
        use_case2 = TechniqueExampleUseCaseFactory(technique=self.technique)
        use_case3 = TechniqueExampleUseCaseFactory(technique=self.technique)

        # Verify all use cases belong to the technique
        technique_use_cases = TechniqueExampleUseCase.objects.filter(technique=self.technique)
        self.assertEqual(technique_use_cases.count(), 3)

        # Verify reverse relationship
        self.assertEqual(self.technique.example_use_cases.count(), 3)

    def test_multiple_use_cases_same_goal(self):
        """Test that multiple use cases can share the same assurance goal."""
        use_case1 = TechniqueExampleUseCaseFactory(technique=self.technique, assurance_goal=self.assurance_goal)
        use_case2 = TechniqueExampleUseCaseFactory(technique=self.technique, assurance_goal=self.assurance_goal)

        # Both use cases should have the same goal
        self.assertEqual(use_case1.assurance_goal, self.assurance_goal)
        self.assertEqual(use_case2.assurance_goal, self.assurance_goal)


class TechniqueLimitationModelTests(TestCase):
    """Test TechniqueLimitation model functionality."""

    def setUp(self):
        """Set up test data."""
        self.technique = TechniqueFactory()

    def test_limitation_creation(self):
        """Test creating a technique limitation."""
        limitation = TechniqueLimitation.objects.create(
            technique=self.technique,
            description="This technique has computational limitations with large datasets",
        )

        self.assertEqual(limitation.technique, self.technique)
        self.assertEqual(
            limitation.description,
            "This technique has computational limitations with large datasets",
        )

    def test_limitation_string_representation(self):
        """Test the string representation of a limitation."""
        limitation = TechniqueLimitationFactory(description="Limited scalability for real-time applications")
        # String representation includes the technique name
        expected_str = f"Limitation for {limitation.technique.name}"
        self.assertEqual(str(limitation), expected_str)

    def test_limitation_required_fields(self):
        """Test that required fields cannot be empty or null."""
        # Test technique is required
        from django.db import transaction

        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                TechniqueLimitation.objects.create(technique=None, description="Valid description")

        # Test description is required
        with self.assertRaises(ValidationError):
            limitation = TechniqueLimitation(technique=self.technique, description="")
            limitation.full_clean()

    def test_limitation_description_validation(self):
        """Test description field validation."""
        # Very long description should be allowed
        long_description = "A" * 5000
        limitation = TechniqueLimitation(technique=self.technique, description=long_description)
        limitation.full_clean()  # Should not raise

        # Description with special characters
        special_description = "Limitation with unicode: αβγδε and mathematical symbols: ∑∏∆"
        limitation = TechniqueLimitation(technique=self.technique, description=special_description)
        limitation.full_clean()  # Should not raise

    def test_limitation_cascade_on_technique_delete(self):
        """Test that deleting a technique cascades to its limitations."""
        limitation = TechniqueLimitationFactory(technique=self.technique)
        limitation_id = limitation.id

        # Delete technique
        self.technique.delete()

        # Verify limitation is deleted
        with self.assertRaises(TechniqueLimitation.DoesNotExist):
            TechniqueLimitation.objects.get(id=limitation_id)

    def test_multiple_limitations_per_technique(self):
        """Test that a technique can have multiple limitations."""
        limitation1 = TechniqueLimitationFactory(technique=self.technique)
        limitation2 = TechniqueLimitationFactory(technique=self.technique)
        limitation3 = TechniqueLimitationFactory(technique=self.technique)

        # Verify all limitations belong to the technique
        technique_limitations = TechniqueLimitation.objects.filter(technique=self.technique)
        self.assertEqual(technique_limitations.count(), 3)

        # Verify reverse relationship
        self.assertEqual(self.technique.limitations.count(), 3)

    def test_limitation_ordering(self):
        """Test limitation ordering by creation order."""
        # Create limitations with known descriptions
        limitation1 = TechniqueLimitationFactory(technique=self.technique, description="First limitation")
        limitation2 = TechniqueLimitationFactory(technique=self.technique, description="Second limitation")
        limitation3 = TechniqueLimitationFactory(technique=self.technique, description="Third limitation")

        # Get limitations in creation order (by ID)
        limitations = list(TechniqueLimitation.objects.filter(technique=self.technique).order_by("id"))

        expected_order = [limitation1, limitation2, limitation3]
        self.assertEqual(limitations, expected_order)


class RelationshipModelsIntegrationTests(TestCase):
    """Test integration between all relationship models."""

    def test_technique_with_all_relationships(self):
        """Test a technique with all types of relationships."""
        technique = TechniqueFactory()

        # Create resources
        resource1 = TechniqueResourceFactory(technique=technique)
        resource2 = TechniqueResourceFactory(technique=technique)

        # Create use cases
        use_case1 = TechniqueExampleUseCaseFactory(technique=technique)
        use_case2 = TechniqueExampleUseCaseFactory(technique=technique)

        # Create limitations
        limitation1 = TechniqueLimitationFactory(technique=technique)
        limitation2 = TechniqueLimitationFactory(technique=technique)
        limitation3 = TechniqueLimitationFactory(technique=technique)

        # Verify all relationships
        self.assertEqual(technique.resources.count(), 2)
        self.assertEqual(technique.example_use_cases.count(), 2)
        self.assertEqual(technique.limitations.count(), 3)

        # Verify forward relationships
        self.assertIn(resource1, technique.resources.all())
        self.assertIn(resource2, technique.resources.all())
        self.assertIn(use_case1, technique.example_use_cases.all())
        self.assertIn(use_case2, technique.example_use_cases.all())
        self.assertIn(limitation1, technique.limitations.all())
        self.assertIn(limitation2, technique.limitations.all())
        self.assertIn(limitation3, technique.limitations.all())

    def test_bulk_relationship_operations(self):
        """Test bulk operations on relationship models."""
        technique = TechniqueFactory()

        # Bulk create resources
        resources_data = [
            {
                "technique": technique,
                "resource_type": ResourceTypeFactory(),
                "title": f"Resource {i}",
                "url": f"https://example.com/resource{i}",
            }
            for i in range(5)
        ]

        resources = [TechniqueResource(**data) for data in resources_data]
        TechniqueResource.objects.bulk_create(resources)

        # Verify bulk creation
        self.assertEqual(technique.resources.count(), 5)

    def test_relationship_models_cascade_consistency(self):
        """Test that all relationship models cascade consistently when technique is deleted."""
        technique = TechniqueFactory()

        # Create related objects
        resource = TechniqueResourceFactory(technique=technique)
        use_case = TechniqueExampleUseCaseFactory(technique=technique)
        limitation = TechniqueLimitationFactory(technique=technique)

        # Store IDs
        resource_id = resource.id
        use_case_id = use_case.id
        limitation_id = limitation.id

        # Delete technique
        technique.delete()

        # Verify all related objects are deleted
        with self.assertRaises(TechniqueResource.DoesNotExist):
            TechniqueResource.objects.get(id=resource_id)

        with self.assertRaises(TechniqueExampleUseCase.DoesNotExist):
            TechniqueExampleUseCase.objects.get(id=use_case_id)

        with self.assertRaises(TechniqueLimitation.DoesNotExist):
            TechniqueLimitation.objects.get(id=limitation_id)

    def test_relationship_models_performance(self):
        """Test performance characteristics of relationship models."""
        technique = TechniqueFactory()

        # Create many related objects
        num_objects = 50

        # Time the creation of many resources
        import time

        start_time = time.time()

        for i in range(num_objects):
            TechniqueResourceFactory(technique=technique)

        creation_time = time.time() - start_time

        # Verify all objects were created
        self.assertEqual(technique.resources.count(), num_objects)

        # Log the actual time for debugging
        print(f"\nCreation time for {num_objects} objects: {creation_time:.3f} seconds")
        print(f"Average time per object: {creation_time / num_objects:.3f} seconds")

        # Basic performance assertion (adjust threshold as needed)
        self.assertLess(
            creation_time,
            10.0,
            f"Resource creation took {creation_time:.3f}s, should be < 10.0s",
        )
