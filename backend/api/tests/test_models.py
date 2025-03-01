from django.test import TestCase
from api.models import Technique, Category, SubCategory, AssuranceGoal
from api.tests.factories import (
    TechniqueFactory, 
    CategoryFactory, 
    SubCategoryFactory, 
    AssuranceGoalFactory
)

class ModelTestCase(TestCase):
    def test_category_creation(self):
        """Test that a Category can be created"""
        category = CategoryFactory(name="Test Category")
        self.assertEqual(category.name, "Test Category")
        self.assertTrue(category.id)
        self.assertEqual(str(category), "Test Category")

    def test_subcategory_creation(self):
        """Test that a SubCategory can be created"""
        category = CategoryFactory()
        subcategory = SubCategoryFactory(name="Test SubCategory", category=category)
        self.assertEqual(subcategory.name, "Test SubCategory")
        self.assertEqual(subcategory.category, category)
        self.assertEqual(str(subcategory), "Test SubCategory")

    def test_assurance_goal_creation(self):
        """Test that an AssuranceGoal can be created"""
        goal = AssuranceGoalFactory(name="Test Goal", description="Test description")
        self.assertEqual(goal.name, "Test Goal")
        self.assertEqual(goal.description, "Test description")
        self.assertEqual(str(goal), "Test Goal")

    def test_technique_creation(self):
        """Test that a Technique can be created"""
        technique = TechniqueFactory(
            name="Test Technique",
            description="Test description",
            model_dependency="Agnostic",
            example_use_case="Test use case"
        )
        self.assertEqual(technique.name, "Test Technique")
        self.assertEqual(technique.description, "Test description")
        self.assertEqual(technique.model_dependency, "Agnostic")
        self.assertEqual(technique.example_use_case, "Test use case")
        self.assertEqual(str(technique), "Test Technique")

    def test_technique_relationships(self):
        """Test that a Technique can have relationships with other models"""
        category = CategoryFactory()
        subcategory = SubCategoryFactory(category=category)
        goal = AssuranceGoalFactory()
        technique = TechniqueFactory(
            categories=[category],
            subcategories=[subcategory],
            assurance_goals=[goal]
        )
        
        # Test relationships
        self.assertEqual(technique.categories.count(), 1)
        self.assertEqual(technique.categories.first(), category)
        
        self.assertEqual(technique.subcategories.count(), 1)
        self.assertEqual(technique.subcategories.first(), subcategory)
        
        self.assertEqual(technique.assurance_goals.count(), 1)
        self.assertEqual(technique.assurance_goals.first(), goal)