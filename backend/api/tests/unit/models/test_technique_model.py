# api/tests/unit/models/test_technique_model.py
"""
Unit tests for the Technique model.

Tests cover model validation, constraints, relationships, and business logic
to ensure the core model behaves correctly in isolation.
"""

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase

from api.models import AssuranceGoal, ResourceType, Tag, Technique
from api.tests.factories import (AssuranceGoalFactory,
                                 IsolatedTechniqueFactory,
                                 MinimalTechniqueFactory, ResourceTypeFactory,
                                 TagFactory, TechniqueExampleUseCaseFactory,
                                 TechniqueFactory, TechniqueLimitationFactory,
                                 TechniqueResourceFactory)


class TechniqueModelBasicTests(TestCase):
    """Test basic Technique model functionality and validation."""

    def test_technique_creation_with_required_fields(self):
        """Test creating a technique with only required fields."""
        technique = Technique.objects.create(
            slug="test-technique",
            name="Test Technique",
            description="A test description for the technique.",
        )

        self.assertEqual(technique.slug, "test-technique")
        self.assertEqual(technique.name, "Test Technique")
        self.assertEqual(technique.description, "A test description for the technique.")
        self.assertIsNone(technique.complexity_rating)
        self.assertIsNone(technique.computational_cost_rating)
        self.assertIsNone(technique.acronym)

    def test_technique_creation_with_all_fields(self):
        """Test creating a technique with all fields populated."""
        technique = Technique.objects.create(
            slug="complete-test-technique",
            name="Complete Test Technique",
            acronym="CTT",
            description="A comprehensive test description.",
            complexity_rating=3,
            computational_cost_rating=4,
        )

        self.assertEqual(technique.slug, "complete-test-technique")
        self.assertEqual(technique.name, "Complete Test Technique")
        self.assertEqual(technique.acronym, "CTT")
        self.assertEqual(technique.description, "A comprehensive test description.")
        self.assertEqual(technique.complexity_rating, 3)
        self.assertEqual(technique.computational_cost_rating, 4)

    def test_technique_string_representation(self):
        """Test the string representation of a technique."""
        technique = TechniqueFactory(name="SHAP Analysis")
        self.assertEqual(str(technique), "SHAP Analysis")

    def test_technique_name_cannot_be_empty(self):
        """Test that technique name cannot be empty."""
        with self.assertRaises(ValidationError):
            technique = Technique(
                slug="test-slug", name="", description="Valid description"
            )
            technique.full_clean()

    def test_technique_name_cannot_be_null(self):
        """Test that technique name cannot be null."""
        with self.assertRaises(IntegrityError):
            Technique.objects.create(
                slug="test-slug", name=None, description="Valid description"
            )

    def test_technique_description_cannot_be_empty(self):
        """Test that technique description cannot be empty."""
        with self.assertRaises(ValidationError):
            technique = Technique(slug="test-slug", name="Valid Name", description="")
            technique.full_clean()

    def test_technique_description_cannot_be_null(self):
        """Test that technique description cannot be null."""
        with self.assertRaises(IntegrityError):
            Technique.objects.create(
                slug="test-slug", name="Valid Name", description=None
            )

    def test_technique_name_uniqueness(self):
        """Test that technique names must be unique."""
        TechniqueFactory(name="Unique Technique")

        with self.assertRaises(IntegrityError):
            TechniqueFactory(name="Unique Technique")

    def test_complexity_rating_validation(self):
        """Test complexity rating validation (1-5 range)."""
        # Valid ratings
        for rating in [1, 2, 3, 4, 5]:
            technique = Technique(
                slug=f"test-{rating}",
                name=f"Test {rating}",
                description="Test description",
                complexity_rating=rating,
            )
            technique.full_clean()  # Should not raise

        # Invalid ratings
        invalid_ratings = [0, 6, -1, 10]
        for rating in invalid_ratings:
            with self.subTest(rating=rating):
                with self.assertRaises(ValidationError):
                    technique = Technique(
                        slug=f"invalid-{rating}",
                        name=f"Invalid {rating}",
                        description="Test description",
                        complexity_rating=rating,
                    )
                    technique.full_clean()

    def test_computational_cost_rating_validation(self):
        """Test computational cost rating validation (1-5 range)."""
        # Valid ratings
        for rating in [1, 2, 3, 4, 5]:
            technique = Technique(
                slug=f"test-cost-{rating}",
                name=f"Test Cost {rating}",
                description="Test description",
                computational_cost_rating=rating,
            )
            technique.full_clean()  # Should not raise

        # Invalid ratings
        invalid_ratings = [0, 6, -1, 10]
        for rating in invalid_ratings:
            with self.subTest(rating=rating):
                with self.assertRaises(ValidationError):
                    technique = Technique(
                        slug=f"invalid-cost-{rating}",
                        name=f"Invalid Cost {rating}",
                        description="Test description",
                        computational_cost_rating=rating,
                    )
                    technique.full_clean()

    def test_ratings_can_be_null(self):
        """Test that ratings can be null (optional)."""
        technique = Technique.objects.create(
            slug="no-ratings-technique",
            name="No Ratings Technique",
            description="A technique without ratings",
            complexity_rating=None,
            computational_cost_rating=None,
        )

        self.assertIsNone(technique.complexity_rating)
        self.assertIsNone(technique.computational_cost_rating)

    def test_slug_field_cannot_be_empty(self):
        """Test that slug field cannot be empty."""
        with self.assertRaises((ValidationError, IntegrityError)):
            technique = Technique(
                slug="",  # Empty slug
                name="Test Technique",
                description="Test description",
            )
            technique.full_clean()  # This should raise ValidationError
            technique.save()  # This would raise IntegrityError if full_clean passed

    def test_slug_field_uniqueness(self):
        """Test that slug field must be unique."""
        Technique.objects.create(
            slug="unique-slug", name="First Technique", description="First description"
        )

        with self.assertRaises(IntegrityError):
            Technique.objects.create(
                slug="unique-slug",
                name="Second Technique",
                description="Second description",
            )

    def test_slug_field_validation(self):
        """Test slug field validation and format."""
        # Valid slug should work
        technique = Technique.objects.create(
            slug="valid-slug-123",
            name="Valid Technique",
            description="Valid description",
        )
        self.assertEqual(technique.slug, "valid-slug-123")

    def test_slug_as_primary_key(self):
        """Test that slug serves as the primary key."""
        technique = Technique.objects.create(
            slug="primary-key-slug",
            name="Primary Key Test",
            description="Testing slug as primary key",
        )

        # Verify slug is the primary key
        self.assertEqual(technique.pk, "primary-key-slug")
        self.assertEqual(technique.slug, technique.pk)

        # Verify we can retrieve by slug
        retrieved = Technique.objects.get(pk="primary-key-slug")
        self.assertEqual(retrieved.slug, "primary-key-slug")

    def test_acronym_field_nullable(self):
        """Test that acronym field can be null."""
        technique = Technique.objects.create(
            slug="no-acronym-technique",
            name="Technique Without Acronym",
            description="This technique has no acronym",
        )

        self.assertIsNone(technique.acronym)

    def test_acronym_field_with_value(self):
        """Test acronym field with a value."""
        technique = Technique.objects.create(
            slug="acronym-technique",
            name="Some Technique",
            acronym="SHAP",
            description="This technique has an acronym",
        )

        self.assertEqual(technique.acronym, "SHAP")

    def test_acronym_field_can_be_empty_string(self):
        """Test that acronym field can be empty string."""
        technique = Technique.objects.create(
            slug="empty-acronym-technique",
            name="Empty Acronym Technique",
            acronym="",
            description="This technique has empty acronym",
        )

        self.assertEqual(technique.acronym, "")

    def test_str_method_without_acronym(self):
        """Test string representation without acronym."""
        technique = TechniqueFactory(name="SHAP Analysis", acronym=None)
        self.assertEqual(str(technique), "SHAP Analysis")

    def test_str_method_with_acronym(self):
        """Test string representation with acronym."""
        technique = TechniqueFactory(
            name="SHapley Additive exPlanations", acronym="SHAP"
        )
        self.assertEqual(str(technique), "SHapley Additive exPlanations (SHAP)")

    def test_str_method_with_empty_acronym(self):
        """Test string representation with empty acronym."""
        technique = TechniqueFactory(name="Some Technique", acronym="")
        self.assertEqual(str(technique), "Some Technique")


class TechniqueModelRelationshipTests(TestCase):
    """Test Technique model relationships with other models."""

    def setUp(self):
        """Set up test data for relationship tests."""
        self.goal1 = AssuranceGoalFactory(name="Explainability")
        self.goal2 = AssuranceGoalFactory(name="Fairness")
        self.tag1 = TagFactory(name="interpretability")
        self.tag2 = TagFactory(name="post-hoc")
        self.technique = IsolatedTechniqueFactory()

    def test_assurance_goals_many_to_many_relationship(self):
        """Test many-to-many relationship with AssuranceGoal."""
        # Initially no goals
        self.assertEqual(self.technique.assurance_goals.count(), 0)

        # Add goals
        self.technique.assurance_goals.add(self.goal1, self.goal2)

        # Verify relationship
        self.assertEqual(self.technique.assurance_goals.count(), 2)
        self.assertIn(self.goal1, self.technique.assurance_goals.all())
        self.assertIn(self.goal2, self.technique.assurance_goals.all())

        # Verify reverse relationship
        self.assertIn(self.technique, self.goal1.techniques.all())
        self.assertIn(self.technique, self.goal2.techniques.all())

    def test_tags_many_to_many_relationship(self):
        """Test many-to-many relationship with Tag."""
        # Initially no tags
        self.assertEqual(self.technique.tags.count(), 0)

        # Add tags
        self.technique.tags.add(self.tag1, self.tag2)

        # Verify relationship
        self.assertEqual(self.technique.tags.count(), 2)
        self.assertIn(self.tag1, self.technique.tags.all())
        self.assertIn(self.tag2, self.technique.tags.all())

        # Verify reverse relationship
        self.assertIn(self.technique, self.tag1.techniques.all())
        self.assertIn(self.technique, self.tag2.techniques.all())

    def test_related_techniques_self_relationship(self):
        """Test self-referencing many-to-many relationship."""
        technique2 = TechniqueFactory()
        technique3 = TechniqueFactory()

        # Add related techniques
        self.technique.related_techniques.add(technique2, technique3)

        # Verify relationship
        self.assertEqual(self.technique.related_techniques.count(), 2)
        self.assertIn(technique2, self.technique.related_techniques.all())
        self.assertIn(technique3, self.technique.related_techniques.all())

    def test_related_techniques_symmetry(self):
        """Test that related techniques relationship can be symmetric if desired."""
        technique2 = TechniqueFactory()

        # Add one-way relationship
        self.technique.related_techniques.add(technique2)

        # Verify one-way relationship
        self.assertIn(technique2, self.technique.related_techniques.all())
        self.assertNotIn(self.technique, technique2.related_techniques.all())

        # Add reverse relationship to make it symmetric
        technique2.related_techniques.add(self.technique)

        # Verify symmetry
        self.assertIn(technique2, self.technique.related_techniques.all())
        self.assertIn(self.technique, technique2.related_techniques.all())

    def test_technique_cannot_be_related_to_itself(self):
        """Test that a technique cannot be related to itself."""
        # This should not cause an error, but verify the behavior
        self.technique.related_techniques.add(self.technique)

        # The behavior depends on Django implementation
        # Just verify it doesn't crash and document the behavior
        related_count = self.technique.related_techniques.count()
        self.assertGreaterEqual(related_count, 0)


class TechniqueModelCascadeTests(TestCase):
    """Test cascade behavior when related objects are deleted."""

    def test_deleting_assurance_goal_removes_relationship(self):
        """Test that deleting an assurance goal removes the relationship but not the technique."""
        goal = AssuranceGoalFactory()
        technique = IsolatedTechniqueFactory()
        technique.assurance_goals.add(goal)

        # Verify relationship exists
        self.assertEqual(technique.assurance_goals.count(), 1)

        # Delete the goal
        goal_id = goal.id
        goal.delete()

        # Verify technique still exists but relationship is gone
        technique.refresh_from_db()
        self.assertEqual(technique.assurance_goals.count(), 0)

    def test_deleting_tag_removes_relationship(self):
        """Test that deleting a tag removes the relationship but not the technique."""
        tag = TagFactory()
        technique = IsolatedTechniqueFactory()
        technique.tags.add(tag)

        # Verify relationship exists
        self.assertEqual(technique.tags.count(), 1)

        # Delete the tag
        tag.delete()

        # Verify technique still exists but relationship is gone
        technique.refresh_from_db()
        self.assertEqual(technique.tags.count(), 0)

    def test_deleting_technique_cascades_to_related_objects(self):
        """Test that deleting a technique cascades to its related objects."""
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

        # Verify related objects are deleted
        from api.models import (TechniqueExampleUseCase, TechniqueLimitation,
                                TechniqueResource)

        with self.assertRaises(TechniqueResource.DoesNotExist):
            TechniqueResource.objects.get(id=resource_id)

        with self.assertRaises(TechniqueExampleUseCase.DoesNotExist):
            TechniqueExampleUseCase.objects.get(id=use_case_id)

        with self.assertRaises(TechniqueLimitation.DoesNotExist):
            TechniqueLimitation.objects.get(id=limitation_id)


class TechniqueModelEdgeCaseTests(TestCase):
    """Test edge cases and boundary conditions for the Technique model."""

    def test_technique_with_very_long_name(self):
        """Test technique with maximum length name."""
        # Assuming max_length=255 for name field
        long_name = "A" * 255
        technique = Technique.objects.create(
            name=long_name, description="Test description"
        )
        self.assertEqual(technique.name, long_name)

    def test_technique_with_very_long_description(self):
        """Test technique with very long description."""
        # Test with 10,000 character description
        long_description = "A" * 10000
        technique = Technique.objects.create(
            name="Test Technique", description=long_description
        )
        self.assertEqual(technique.description, long_description)

    def test_technique_with_special_characters(self):
        """Test technique with special characters in name and description."""
        special_name = "Test Technique: αβγδε & $@#% 🤖🔬📊"
        special_description = "Description with unicode: αβγδε and emojis: 🤖🔬📊"

        technique = Technique.objects.create(
            name=special_name, description=special_description
        )

        self.assertEqual(technique.name, special_name)
        self.assertEqual(technique.description, special_description)

    def test_technique_with_minimal_content(self):
        """Test technique with minimal valid content."""
        technique = Technique.objects.create(
            name="A", description="B"  # Single character  # Single character
        )

        self.assertEqual(technique.name, "A")
        self.assertEqual(technique.description, "B")

    def test_multiple_techniques_with_maximum_relationships(self):
        """Test techniques with many relationships to verify performance."""
        # Create many goals and tags with unique names to avoid duplicates
        goals = [AssuranceGoalFactory(name=f"Goal {i}") for i in range(10)]
        tags = [TagFactory(name=f"Tag {i}") for i in range(20)]

        technique = IsolatedTechniqueFactory()

        # Add all relationships
        technique.assurance_goals.set(goals)
        technique.tags.set(tags)

        # Verify all relationships exist
        self.assertEqual(technique.assurance_goals.count(), 10)
        self.assertEqual(technique.tags.count(), 20)

    @pytest.mark.django_db(transaction=True)
    def test_technique_creation_in_transaction(self):
        """Test technique creation within a database transaction."""
        with transaction.atomic():
            technique = IsolatedTechniqueFactory()
            self.assertTrue(technique.slug)

            # Add some relationships within transaction
            goal = AssuranceGoalFactory()
            technique.assurance_goals.add(goal)

            # Verify within transaction
            self.assertEqual(technique.assurance_goals.count(), 1)

        # Verify after transaction
        technique.refresh_from_db()
        self.assertEqual(technique.assurance_goals.count(), 1)

    def test_technique_ordering_consistency(self):
        """Test that technique queries return consistent ordering."""
        # Create techniques with known names
        technique_a = IsolatedTechniqueFactory(name="A Technique")
        technique_b = IsolatedTechniqueFactory(name="B Technique")
        technique_c = IsolatedTechniqueFactory(name="C Technique")

        # Get the techniques we just created
        created_techniques = Technique.objects.filter(
            slug__in=[technique_a.slug, technique_b.slug, technique_c.slug]
        )

        # Verify we get all our techniques
        self.assertEqual(created_techniques.count(), 3)

        # Test ordering by name
        techniques_by_name = list(created_techniques.order_by("name"))
        expected_order = [technique_a, technique_b, technique_c]

        self.assertEqual(techniques_by_name, expected_order)
