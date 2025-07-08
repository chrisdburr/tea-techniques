# api/tests/unit/models/test_base_models.py
"""
Unit tests for base models: AssuranceGoal, Tag, and ResourceType.

Tests cover basic functionality, validation, constraints, and relationships
for the foundational models that support techniques.
"""

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from api.models import AssuranceGoal, ResourceType, Tag, Technique
from api.tests.factories import (
    AssuranceGoalFactory,
    ResourceTypeFactory,
    TagFactory,
    TechniqueFactory,
)


class AssuranceGoalModelTests(TestCase):
    """Test AssuranceGoal model functionality."""

    def test_assurance_goal_creation(self):
        """Test creating an assurance goal with valid data."""
        goal = AssuranceGoal.objects.create(
            name="Explainability",
            description="Techniques for making AI decisions interpretable",
        )

        self.assertEqual(goal.name, "Explainability")
        self.assertEqual(
            goal.description, "Techniques for making AI decisions interpretable"
        )
        self.assertTrue(goal.id)

    def test_assurance_goal_string_representation(self):
        """Test the string representation of an assurance goal."""
        goal = AssuranceGoalFactory(name="Fairness")
        self.assertEqual(str(goal), "Fairness")

    def test_assurance_goal_name_required(self):
        """Test that assurance goal name is required."""
        with self.assertRaises(ValidationError):
            goal = AssuranceGoal(name="", description="Valid description")
            goal.full_clean()

    def test_assurance_goal_name_cannot_be_null(self):
        """Test that assurance goal name cannot be null."""
        with self.assertRaises(IntegrityError):
            AssuranceGoal.objects.create(name=None, description="Valid description")

    def test_assurance_goal_description_required(self):
        """Test that assurance goal description is required."""
        with self.assertRaises(ValidationError):
            goal = AssuranceGoal(name="Valid Name", description="")
            goal.full_clean()

    def test_assurance_goal_description_cannot_be_null(self):
        """Test that assurance goal description cannot be null."""
        with self.assertRaises(IntegrityError):
            AssuranceGoal.objects.create(name="Valid Name", description=None)

    def test_assurance_goal_name_uniqueness(self):
        """Test that assurance goal names must be unique."""
        AssuranceGoal.objects.create(
            name="Transparency", description="Test description"
        )

        with self.assertRaises(IntegrityError):
            AssuranceGoal.objects.create(
                name="Transparency", description="Another description"
            )

    def test_assurance_goal_relationship_with_techniques(self):
        """Test the many-to-many relationship with techniques."""
        goal = AssuranceGoalFactory()
        technique1 = TechniqueFactory()
        technique2 = TechniqueFactory()

        # Add techniques to goal
        goal.techniques.add(technique1, technique2)

        # Verify relationship
        self.assertEqual(goal.techniques.count(), 2)
        self.assertIn(technique1, goal.techniques.all())
        self.assertIn(technique2, goal.techniques.all())

        # Verify reverse relationship
        self.assertIn(goal, technique1.assurance_goals.all())
        self.assertIn(goal, technique2.assurance_goals.all())

    def test_assurance_goal_cascade_on_delete(self):
        """Test that deleting a goal doesn't delete associated techniques."""
        goal = AssuranceGoalFactory()
        technique = TechniqueFactory()

        # Clear any auto-created relationships and add only our test goal
        technique.assurance_goals.clear()
        technique.assurance_goals.add(goal)

        # Store technique slug and initial count
        technique_slug = technique.slug
        initial_count = technique.assurance_goals.count()
        self.assertEqual(initial_count, 1)

        # Delete goal
        goal.delete()

        # Verify technique still exists
        technique.refresh_from_db()
        self.assertEqual(technique.slug, technique_slug)
        self.assertEqual(technique.assurance_goals.count(), 0)

    def test_assurance_goal_with_special_characters(self):
        """Test assurance goal with special characters."""
        goal = AssuranceGoal.objects.create(
            name="Privacy & Security",
            description="Techniques for ensuring data privacy & system security 🔒",
        )

        self.assertEqual(goal.name, "Privacy & Security")
        self.assertIn("🔒", goal.description)

    def test_assurance_goal_ordering(self):
        """Test assurance goal default ordering."""
        goal_z = AssuranceGoalFactory(name="Z Goal")
        goal_a = AssuranceGoalFactory(name="A Goal")
        goal_m = AssuranceGoalFactory(name="M Goal")

        # Test ordering by name
        goals = list(AssuranceGoal.objects.order_by("name"))
        expected_order = [goal_a, goal_m, goal_z]

        self.assertEqual(goals, expected_order)


class TagModelTests(TestCase):
    """Test Tag model functionality."""

    def test_tag_creation(self):
        """Test creating a tag with valid data."""
        tag = Tag.objects.create(name="interpretability")

        self.assertEqual(tag.name, "interpretability")
        self.assertTrue(tag.id)

    def test_tag_string_representation(self):
        """Test the string representation of a tag."""
        tag = TagFactory(name="model-agnostic")
        self.assertEqual(str(tag), "model-agnostic")

    def test_tag_name_required(self):
        """Test that tag name is required."""
        with self.assertRaises(ValidationError):
            tag = Tag(name="")
            tag.full_clean()

    def test_tag_name_cannot_be_null(self):
        """Test that tag name cannot be null."""
        with self.assertRaises(IntegrityError):
            Tag.objects.create(name=None)

    def test_tag_name_uniqueness(self):
        """Test that tag names must be unique."""
        Tag.objects.create(name="post-hoc")

        with self.assertRaises(IntegrityError):
            Tag.objects.create(name="post-hoc")

    def test_tag_relationship_with_techniques(self):
        """Test the many-to-many relationship with techniques."""
        tag = TagFactory()
        technique1 = TechniqueFactory()
        technique2 = TechniqueFactory()

        # Add techniques to tag
        tag.techniques.add(technique1, technique2)

        # Verify relationship
        self.assertEqual(tag.techniques.count(), 2)
        self.assertIn(technique1, tag.techniques.all())
        self.assertIn(technique2, tag.techniques.all())

        # Verify reverse relationship
        self.assertIn(tag, technique1.tags.all())
        self.assertIn(tag, technique2.tags.all())

    def test_tag_cascade_on_delete(self):
        """Test that deleting a tag doesn't delete associated techniques."""
        tag = TagFactory()
        technique = TechniqueFactory()

        # Clear any auto-created relationships and add only our test tag
        technique.tags.clear()
        technique.tags.add(tag)

        # Store technique slug and initial count
        technique_slug = technique.slug
        initial_count = technique.tags.count()
        self.assertEqual(initial_count, 1)

        # Delete tag
        tag.delete()

        # Verify technique still exists
        technique.refresh_from_db()
        self.assertEqual(technique.slug, technique_slug)
        self.assertEqual(technique.tags.count(), 0)

    def test_tag_with_special_characters(self):
        """Test tag with special characters and various formats."""
        special_tags = [
            "machine-learning",
            "nlp_processing",
            "computer.vision",
            "data_science",
            "ai-ethics",
            "privacy&security",
        ]

        for tag_name in special_tags:
            with self.subTest(tag_name=tag_name):
                tag = Tag.objects.create(name=tag_name)
                self.assertEqual(tag.name, tag_name)

    def test_tag_case_sensitivity(self):
        """Test that tag names are case sensitive."""
        tag1 = TagFactory(name="interpretability")
        tag2 = TagFactory(name="Interpretability")  # Different case

        # Both should exist as different tags
        self.assertNotEqual(tag1.name, tag2.name)
        self.assertEqual(Tag.objects.count(), 2)

    def test_multiple_techniques_with_same_tag(self):
        """Test that multiple techniques can share the same tag."""
        tag = TagFactory(name="shared-tag")
        techniques = [TechniqueFactory() for _ in range(5)]

        # Add the same tag to all techniques
        for technique in techniques:
            technique.tags.add(tag)

        # Verify all techniques have the tag
        self.assertEqual(tag.techniques.count(), 5)

        for technique in techniques:
            self.assertIn(tag, technique.tags.all())


class ResourceTypeModelTests(TestCase):
    """Test ResourceType model functionality."""

    def test_resource_type_creation(self):
        """Test creating a resource type with valid data."""
        resource_type = ResourceType.objects.create(
            name="Technical Paper", icon="technical_paper"
        )

        self.assertEqual(resource_type.name, "Technical Paper")
        self.assertEqual(resource_type.icon, "technical_paper")
        self.assertTrue(resource_type.id)

    def test_resource_type_string_representation(self):
        """Test the string representation of a resource type."""
        resource_type = ResourceTypeFactory(name="GitHub Repository")
        self.assertEqual(str(resource_type), "GitHub Repository")

    def test_resource_type_name_required(self):
        """Test that resource type name is required."""
        with self.assertRaises(ValidationError):
            resource_type = ResourceType(name="", icon="valid_icon")
            resource_type.full_clean()

    def test_resource_type_name_cannot_be_null(self):
        """Test that resource type name cannot be null."""
        with self.assertRaises(IntegrityError):
            ResourceType.objects.create(name=None, icon="valid_icon")

    def test_resource_type_icon_optional(self):
        """Test that resource type icon is optional."""
        # Icon can be empty since it's blank=True
        resource_type = ResourceType(name="Valid Name", icon="")
        resource_type.full_clean()  # Should not raise

        resource_type = ResourceType.objects.create(name="Valid Name", icon="")
        self.assertEqual(resource_type.icon, "")

    def test_resource_type_icon_cannot_be_null(self):
        """Test that resource type icon cannot be null."""
        with self.assertRaises(IntegrityError):
            ResourceType.objects.create(name="Valid Name", icon=None)

    def test_resource_type_name_uniqueness(self):
        """Test that resource type names must be unique."""
        ResourceType.objects.create(name="Documentation", icon="documentation")

        with self.assertRaises(IntegrityError):
            ResourceType.objects.create(name="Documentation", icon="documentation2")

    def test_resource_type_icon_format(self):
        """Test various icon formats are accepted."""
        icon_formats = [
            "simple_icon",
            "icon-with-dashes",
            "icon_with_underscores",
            "icon123",
            "UPPERCASE_ICON",
            "mixedCase_Icon",
        ]

        for i, icon in enumerate(icon_formats):
            with self.subTest(icon=icon):
                resource_type = ResourceType.objects.create(
                    name=f"Test Resource {i}", icon=icon
                )
                self.assertEqual(resource_type.icon, icon)

    def test_resource_type_with_resources(self):
        """Test resource type relationship with technique resources."""
        from api.tests.factories import TechniqueResourceFactory

        resource_type = ResourceTypeFactory()

        # Create resources with this type
        resource1 = TechniqueResourceFactory(resource_type=resource_type)
        resource2 = TechniqueResourceFactory(resource_type=resource_type)

        # Verify reverse relationship exists
        # Note: This tests the foreign key relationship, not M2M
        self.assertEqual(resource1.resource_type, resource_type)
        self.assertEqual(resource2.resource_type, resource_type)

    def test_resource_type_protected_deletion(self):
        """Test that resource type deletion is protected when resources exist."""
        from django.db.models.deletion import ProtectedError

        from api.tests.factories import TechniqueResourceFactory

        resource_type = ResourceTypeFactory()
        resource = TechniqueResourceFactory(resource_type=resource_type)

        # Deletion should fail because of PROTECT constraint
        with self.assertRaises(ProtectedError):
            resource_type.delete()

        # Resource and resource type should still exist
        resource.refresh_from_db()
        resource_type.refresh_from_db()
        self.assertEqual(resource.resource_type, resource_type)

    def test_resource_type_deletion_when_no_resources(self):
        """Test that resource type can be deleted when no resources exist."""
        resource_type = ResourceTypeFactory()
        resource_type_id = resource_type.id

        # Should be able to delete when no resources exist
        resource_type.delete()

        # Verify it's deleted
        with self.assertRaises(ResourceType.DoesNotExist):
            ResourceType.objects.get(id=resource_type_id)

    def test_resource_type_ordering(self):
        """Test resource type ordering."""
        type_z = ResourceTypeFactory(name="Z Type")
        type_a = ResourceTypeFactory(name="A Type")
        type_m = ResourceTypeFactory(name="M Type")

        # Test ordering by name
        types = list(ResourceType.objects.order_by("name"))
        expected_order = [type_a, type_m, type_z]

        self.assertEqual(types, expected_order)

    def test_resource_type_with_special_characters(self):
        """Test resource type with special characters."""
        resource_type = ResourceType.objects.create(
            name="Law/Policy Document", icon="law_policy"
        )

        self.assertEqual(resource_type.name, "Law/Policy Document")
        self.assertEqual(resource_type.icon, "law_policy")


class BaseModelsIntegrationTests(TestCase):
    """Test integration between base models."""

    def test_technique_with_all_base_model_relationships(self):
        """Test a technique with relationships to all base models."""
        # Create base model instances
        goal1 = AssuranceGoalFactory(name="Explainability")
        goal2 = AssuranceGoalFactory(name="Fairness")
        tag1 = TagFactory(name="interpretability")
        tag2 = TagFactory(name="post-hoc")

        # Create technique and clear auto-created relationships
        technique = TechniqueFactory()
        technique.assurance_goals.clear()
        technique.tags.clear()

        # Add our specific relationships
        technique.assurance_goals.add(goal1, goal2)
        technique.tags.add(tag1, tag2)

        # Verify all relationships
        self.assertEqual(technique.assurance_goals.count(), 2)
        self.assertEqual(technique.tags.count(), 2)

        # Verify reverse relationships
        self.assertEqual(goal1.techniques.count(), 1)
        self.assertEqual(goal2.techniques.count(), 1)
        self.assertEqual(tag1.techniques.count(), 1)
        self.assertEqual(tag2.techniques.count(), 1)

    def test_base_models_deletion_impact(self):
        """Test impact of deleting base models on existing techniques."""
        # Create interconnected data
        goal = AssuranceGoalFactory()
        tag = TagFactory()
        technique = TechniqueFactory()

        # Clear auto-created relationships and add our specific ones
        technique.assurance_goals.clear()
        technique.tags.clear()
        technique.assurance_goals.add(goal)
        technique.tags.add(tag)

        # Verify setup
        self.assertEqual(technique.assurance_goals.count(), 1)
        self.assertEqual(technique.tags.count(), 1)

        # Store initial counts
        initial_technique_count = Technique.objects.count()

        # Delete base models
        goal.delete()
        tag.delete()

        # Verify technique still exists
        self.assertEqual(Technique.objects.count(), initial_technique_count)

        # Verify relationships are cleared
        technique.refresh_from_db()
        self.assertEqual(technique.assurance_goals.count(), 0)
        self.assertEqual(technique.tags.count(), 0)

    def test_base_models_bulk_operations(self):
        """Test bulk operations with base models."""
        # Bulk create assurance goals
        goal_names = ["Goal1", "Goal2", "Goal3"]
        goals = [
            AssuranceGoal(name=name, description=f"Description for {name}")
            for name in goal_names
        ]
        AssuranceGoal.objects.bulk_create(goals)

        # Bulk create tags
        tag_names = ["tag1", "tag2", "tag3"]
        tags = [Tag(name=name) for name in tag_names]
        Tag.objects.bulk_create(tags)

        # Verify bulk creation
        self.assertEqual(AssuranceGoal.objects.count(), 3)
        self.assertEqual(Tag.objects.count(), 3)

        # Verify all names are present
        actual_goal_names = set(AssuranceGoal.objects.values_list("name", flat=True))
        actual_tag_names = set(Tag.objects.values_list("name", flat=True))

        self.assertEqual(actual_goal_names, set(goal_names))
        self.assertEqual(actual_tag_names, set(tag_names))
