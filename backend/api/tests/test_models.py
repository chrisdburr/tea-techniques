from django.test import TestCase
from django.core.exceptions import ValidationError
from api.models import (
    Technique,
    Category,
    SubCategory,
    AssuranceGoal,
    Tag,
    AttributeType,
    AttributeValue,
    ResourceType,
    TechniqueResource,
    TechniqueExampleUseCase,
    TechniqueLimitation,
)
from api.tests.factories import (
    TechniqueFactory,
    CategoryFactory,
    SubCategoryFactory,
    AssuranceGoalFactory,
    TagFactory,
    AttributeTypeFactory,
    AttributeValueFactory,
    AttributeValueFactoryWithTechnique,
    ResourceTypeFactory,
    TechniqueResourceFactory,
    TechniqueExampleUseCaseFactory,
    TechniqueLimitationFactory,
)


class ModelTestCase(TestCase):
    def test_assurance_goal_creation(self):
        """Test that an AssuranceGoal can be created"""
        goal = AssuranceGoalFactory(name="Test Goal", description="Test description")
        self.assertEqual(goal.name, "Test Goal")
        self.assertEqual(goal.description, "Test description")
        self.assertEqual(str(goal), "Test Goal")

    def test_category_creation(self):
        """Test that a Category can be created"""
        goal = AssuranceGoalFactory()
        category = CategoryFactory(name="Test Category", assurance_goal=goal)
        self.assertEqual(category.name, "Test Category")
        self.assertTrue(category.id)
        self.assertEqual(category.assurance_goal, goal)
        self.assertIn(f"({goal.name})", str(category))

    def test_subcategory_creation(self):
        """Test that a SubCategory can be created"""
        category = CategoryFactory()
        subcategory = SubCategoryFactory(name="Test SubCategory", category=category)
        self.assertEqual(subcategory.name, "Test SubCategory")
        self.assertEqual(subcategory.category, category)
        self.assertIn(category.name, str(subcategory))

    def test_tag_creation(self):
        """Test that a Tag can be created"""
        tag = TagFactory(name="TestTag")
        self.assertEqual(tag.name, "TestTag")
        self.assertEqual(str(tag), "TestTag")

    def test_attribute_type_creation(self):
        """Test that an AttributeType can be created"""
        attr_type = AttributeTypeFactory(
            name="Test Type", description="Test description"
        )
        self.assertEqual(attr_type.name, "Test Type")
        self.assertEqual(attr_type.description, "Test description")
        self.assertEqual(str(attr_type), "Test Type")

    def test_attribute_value_creation(self):
        """Test that an AttributeValue can be created"""
        attr_type = AttributeTypeFactory(name="Test Type")
        technique = TechniqueFactory()
        attr_value = AttributeValueFactory(
            name="Test Value", 
            description="Test description", 
            attribute_type=attr_type,
            technique=technique
        )
        self.assertEqual(attr_value.name, "Test Value")
        self.assertEqual(attr_value.attribute_type, attr_type)
        self.assertEqual(attr_value.technique, technique)
        self.assertEqual(str(attr_value), "Test Type: Test Value")

    def test_resource_type_creation(self):
        """Test that a ResourceType can be created"""
        resource_type = ResourceTypeFactory(name="Test Resource", icon="test-icon")
        self.assertEqual(resource_type.name, "Test Resource")
        self.assertEqual(resource_type.icon, "test-icon")
        self.assertEqual(str(resource_type), "Test Resource")

    def test_technique_creation(self):
        """Test that a Technique can be created"""
        technique = TechniqueFactory(
            name="Test Technique",
            description="Test description",
            model_dependency="Model-Agnostic",
        )
        self.assertEqual(technique.name, "Test Technique")
        self.assertEqual(technique.description, "Test description")
        self.assertEqual(technique.model_dependency, "Model-Agnostic")
        self.assertEqual(str(technique), "Test Technique")

    def test_technique_relationships(self):
        """Test that a Technique can have relationships with other models"""
        goal = AssuranceGoalFactory()
        category = CategoryFactory(assurance_goal=goal)
        subcategory = SubCategoryFactory(category=category)
        tag = TagFactory()

        technique = TechniqueFactory(
            assurance_goals=[goal],
            categories=[category],
            subcategories=[subcategory],
            tags=[tag],
        )

        # Test relationships
        self.assertEqual(technique.assurance_goals.count(), 1)
        self.assertEqual(technique.assurance_goals.first(), goal)

        self.assertEqual(technique.categories.count(), 1)
        self.assertEqual(technique.categories.first(), category)

        self.assertEqual(technique.subcategories.count(), 1)
        self.assertEqual(technique.subcategories.first(), subcategory)

        self.assertEqual(technique.tags.count(), 1)
        self.assertEqual(technique.tags.first(), tag)

    def test_technique_attribute_relationship(self):
        """Test that a Technique can have attributes"""
        technique = TechniqueFactory()
        attr_type = AttributeTypeFactory(name="Scope")
        
        # Now AttributeValue links directly to Technique
        attr_value = AttributeValueFactoryWithTechnique(
            technique=technique, 
            attribute_type=attr_type,
            name="Global"
        )

        self.assertEqual(attr_value.technique, technique)
        self.assertEqual(attr_value.attribute_type, attr_type)
        self.assertEqual(attr_value.name, "Global")
        self.assertEqual(str(attr_value), "Scope: Global")

    def test_technique_resource_relationship(self):
        """Test that a Technique can have resources"""
        technique = TechniqueFactory()
        resource_type = ResourceTypeFactory(name="Paper")

        resource = TechniqueResourceFactory(
            technique=technique,
            resource_type=resource_type,
            title="Test Paper",
            url="https://example.com/paper",
            description="A test paper",
        )

        self.assertEqual(resource.technique, technique)
        self.assertEqual(resource.resource_type, resource_type)
        self.assertEqual(resource.title, "Test Paper")
        self.assertEqual(resource.url, "https://example.com/paper")
        self.assertEqual(str(resource), "Paper: Test Paper")

    def test_technique_use_case_relationship(self):
        """Test that a Technique can have example use cases"""
        technique = TechniqueFactory()
        goal = AssuranceGoalFactory()

        use_case = TechniqueExampleUseCaseFactory(
            technique=technique, description="Test use case", assurance_goal=goal
        )

        self.assertEqual(use_case.technique, technique)
        self.assertEqual(use_case.description, "Test use case")
        self.assertEqual(use_case.assurance_goal, goal)
        self.assertIn(technique.name, str(use_case))

    def test_technique_limitation_relationship(self):
        """Test that a Technique can have limitations"""
        technique = TechniqueFactory()

        limitation = TechniqueLimitationFactory(
            technique=technique, description="Test limitation"
        )

        self.assertEqual(limitation.technique, technique)
        self.assertEqual(limitation.description, "Test limitation")
        self.assertIn(technique.name, str(limitation))

    def test_technique_rating_validators(self):
        """Test that rating validators enforce the correct range"""
        # Test valid values (1-5)
        for valid_value in range(1, 6):
            technique = TechniqueFactory(
                complexity_rating=valid_value,
                computational_cost_rating=valid_value
            )
            technique.full_clean()  # Should not raise exception
            self.assertEqual(technique.complexity_rating, valid_value)
            self.assertEqual(technique.computational_cost_rating, valid_value)

        # Test invalid values
        invalid_values = [0, 6, -1, 10]
        for invalid_value in invalid_values:
            # Test complexity_rating validator
            technique = TechniqueFactory()
            technique.complexity_rating = invalid_value
            with self.assertRaises(ValidationError):
                technique.full_clean()

            # Test computational_cost_rating validator
            technique = TechniqueFactory()
            technique.computational_cost_rating = invalid_value
            with self.assertRaises(ValidationError):
                technique.full_clean()
