# api/tests/unit/admin/test_admin.py
"""
Unit tests for admin interface configuration.

Tests cover admin site registration, custom display methods,
and inline configurations.
"""

import pytest
from django.contrib import admin
from django.contrib.admin.sites import AdminSite
from django.test import TestCase
from faker import Faker

fake = Faker()

from api.admin import (TagAdmin, TechniqueAdmin, TechniqueExampleUseCaseInline,
                       TechniqueLimitationInline, TechniqueResourceInline)
from api.models import (AssuranceGoal, ResourceType, Tag, Technique,
                        TechniqueExampleUseCase, TechniqueLimitation,
                        TechniqueResource)
from api.tests.factories import (AssuranceGoalFactory,
                                 IsolatedTechniqueFactory, TagFactory,
                                 TechniqueExampleUseCaseFactory,
                                 TechniqueFactory, TechniqueLimitationFactory,
                                 TechniqueResourceFactory)


class AdminRegistrationTests(TestCase):
    """Test that all models are properly registered in admin."""

    def test_admin_site_registration(self):
        """Test that all models are registered in the admin site."""
        # Check that models are registered
        self.assertIn(Technique, admin.site._registry)
        self.assertIn(Tag, admin.site._registry)
        self.assertIn(AssuranceGoal, admin.site._registry)
        self.assertIn(ResourceType, admin.site._registry)
        self.assertIn(TechniqueResource, admin.site._registry)
        self.assertIn(TechniqueExampleUseCase, admin.site._registry)
        self.assertIn(TechniqueLimitation, admin.site._registry)

    def test_technique_admin_configuration(self):
        """Test TechniqueAdmin configuration."""
        admin_instance = admin.site._registry[Technique]
        self.assertIsInstance(admin_instance, TechniqueAdmin)

        # Check list_display configuration
        expected_list_display = [
            "name",
            "complexity_rating",
            "computational_cost_rating",
            "get_tags_count",
            "get_goals_count",
        ]
        self.assertEqual(list(admin_instance.list_display), expected_list_display)

        # Check filter configuration
        expected_list_filter = [
            "complexity_rating",
            "computational_cost_rating",
            "assurance_goals",
            "tags",
        ]
        self.assertEqual(list(admin_instance.list_filter), expected_list_filter)

        # Check search fields
        expected_search_fields = ["name", "description"]
        self.assertEqual(list(admin_instance.search_fields), expected_search_fields)

        # Check filter_horizontal
        expected_filter_horizontal = ["assurance_goals", "tags", "related_techniques"]
        self.assertEqual(
            list(admin_instance.filter_horizontal), expected_filter_horizontal
        )

    def test_tag_admin_configuration(self):
        """Test TagAdmin configuration."""
        admin_instance = admin.site._registry[Tag]
        self.assertIsInstance(admin_instance, TagAdmin)

        # Check list_display configuration
        expected_list_display = ["name", "get_techniques_count"]
        self.assertEqual(list(admin_instance.list_display), expected_list_display)

        # Check search fields
        expected_search_fields = ["name"]
        self.assertEqual(list(admin_instance.search_fields), expected_search_fields)


class TechniqueAdminTests(TestCase):
    """Test TechniqueAdmin functionality."""

    def setUp(self):
        """Set up test data."""
        self.admin_instance = TechniqueAdmin(Technique, AdminSite())
        # Use IsolatedTechniqueFactory to avoid automatic relationships
        self.technique = IsolatedTechniqueFactory()

        # Add some relationships for testing count methods
        self.tag1 = TagFactory(name=f"admin-test-tag-1-{fake.uuid4()[:8]}")
        self.tag2 = TagFactory(name=f"admin-test-tag-2-{fake.uuid4()[:8]}")
        self.goal1 = AssuranceGoalFactory(name=f"Admin Test Goal 1 {fake.uuid4()[:8]}")
        self.goal2 = AssuranceGoalFactory(name=f"Admin Test Goal 2 {fake.uuid4()[:8]}")

        self.technique.tags.add(self.tag1, self.tag2)
        self.technique.assurance_goals.add(self.goal1, self.goal2)

    def test_get_tags_count_method(self):
        """Test the get_tags_count custom method."""
        result = self.admin_instance.get_tags_count(self.technique)
        self.assertEqual(result, 2)

        # Test with technique without tags
        technique_no_tags = IsolatedTechniqueFactory()
        result_no_tags = self.admin_instance.get_tags_count(technique_no_tags)
        self.assertEqual(result_no_tags, 0)

    def test_get_goals_count_method(self):
        """Test the get_goals_count custom method."""
        result = self.admin_instance.get_goals_count(self.technique)
        self.assertEqual(result, 2)

        # Test with technique without goals
        technique_no_goals = IsolatedTechniqueFactory()
        result_no_goals = self.admin_instance.get_goals_count(technique_no_goals)
        self.assertEqual(result_no_goals, 0)

    def test_custom_methods_short_descriptions(self):
        """Test that custom methods have proper short descriptions."""
        self.assertEqual(self.admin_instance.get_tags_count.short_description, "Tags")
        self.assertEqual(self.admin_instance.get_goals_count.short_description, "Goals")

    def test_fieldsets_configuration(self):
        """Test the fieldsets configuration."""
        expected_fieldsets = (
            ("Basic Information", {"fields": ("name", "description")}),
            ("Ratings", {"fields": ("complexity_rating", "computational_cost_rating")}),
            (
                "Classifications",
                {"fields": ("assurance_goals", "tags", "related_techniques")},
            ),
        )
        self.assertEqual(self.admin_instance.fieldsets, expected_fieldsets)

    def test_inlines_configuration(self):
        """Test that inlines are properly configured."""
        expected_inline_classes = [
            TechniqueResourceInline,
            TechniqueExampleUseCaseInline,
            TechniqueLimitationInline,
        ]

        # Inlines in Django admin are class references, not instances
        self.assertEqual(list(self.admin_instance.inlines), expected_inline_classes)


class TagAdminTests(TestCase):
    """Test TagAdmin functionality."""

    def setUp(self):
        """Set up test data."""
        self.admin_instance = TagAdmin(Tag, AdminSite())
        self.tag = TagFactory()

        # Add some techniques for testing count method
        self.technique1 = IsolatedTechniqueFactory()
        self.technique2 = IsolatedTechniqueFactory()
        self.technique3 = IsolatedTechniqueFactory()

        self.tag.techniques.add(self.technique1, self.technique2, self.technique3)

    def test_get_techniques_count_method(self):
        """Test the get_techniques_count custom method."""
        result = self.admin_instance.get_techniques_count(self.tag)
        self.assertEqual(result, 3)

        # Test with tag without techniques
        tag_no_techniques = TagFactory()
        result_no_techniques = self.admin_instance.get_techniques_count(
            tag_no_techniques
        )
        self.assertEqual(result_no_techniques, 0)

    def test_get_techniques_count_short_description(self):
        """Test that custom method has proper short description."""
        self.assertEqual(
            self.admin_instance.get_techniques_count.short_description, "Techniques"
        )


class AdminInlineTests(TestCase):
    """Test admin inline configurations."""

    def test_technique_resource_inline_configuration(self):
        """Test TechniqueResourceInline configuration."""
        inline = TechniqueResourceInline(TechniqueResource, AdminSite())

        self.assertEqual(inline.model, TechniqueResource)
        self.assertEqual(inline.extra, 1)

        expected_fields = [
            "resource_type",
            "title",
            "url",
            "source_type",
            "authors",
            "publication_date",
        ]
        self.assertEqual(list(inline.fields), expected_fields)

    def test_technique_use_case_inline_configuration(self):
        """Test TechniqueExampleUseCaseInline configuration."""
        inline = TechniqueExampleUseCaseInline(TechniqueExampleUseCase, AdminSite())

        self.assertEqual(inline.model, TechniqueExampleUseCase)
        self.assertEqual(inline.extra, 1)

        expected_fields = ["description", "assurance_goal"]
        self.assertEqual(list(inline.fields), expected_fields)

    def test_technique_limitation_inline_configuration(self):
        """Test TechniqueLimitationInline configuration."""
        inline = TechniqueLimitationInline(TechniqueLimitation, AdminSite())

        self.assertEqual(inline.model, TechniqueLimitation)
        self.assertEqual(inline.extra, 1)

        expected_fields = ["description"]
        self.assertEqual(list(inline.fields), expected_fields)

    def test_all_inlines_are_tabular(self):
        """Test that all inlines inherit from TabularInline."""
        from django.contrib.admin import TabularInline

        self.assertTrue(issubclass(TechniqueResourceInline, TabularInline))
        self.assertTrue(issubclass(TechniqueExampleUseCaseInline, TabularInline))
        self.assertTrue(issubclass(TechniqueLimitationInline, TabularInline))


class AdminIntegrationTests(TestCase):
    """Test admin interface integration."""

    def test_admin_interface_with_real_data(self):
        """Test admin interface methods with realistic data."""
        # Create a technique with realistic relationships
        technique = IsolatedTechniqueFactory(
            name="SHAP (SHapley Additive exPlanations)",
            description="A game theoretic approach to explain the output of any machine learning model.",
        )

        # Add multiple tags and goals
        tags = [TagFactory(name=f"Tag {i}") for i in range(5)]
        goals = [AssuranceGoalFactory(name=f"Goal {i}") for i in range(3)]

        for tag in tags:
            technique.tags.add(tag)
        for goal in goals:
            technique.assurance_goals.add(goal)

        # Test admin methods
        technique_admin = TechniqueAdmin(Technique, AdminSite())
        self.assertEqual(technique_admin.get_tags_count(technique), 5)
        self.assertEqual(technique_admin.get_goals_count(technique), 3)

        # Test tag admin with one of the tags
        tag_admin = TagAdmin(Tag, AdminSite())
        # Each tag should have 1 technique associated
        for tag in tags:
            self.assertEqual(tag_admin.get_techniques_count(tag), 1)
