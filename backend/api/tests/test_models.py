from django.test import TestCase
from django.core.exceptions import ValidationError
from api.models import (
    Technique,
    AssuranceGoal,
    Tag,
    ResourceType,
    TechniqueResource,
    TechniqueExampleUseCase,
    TechniqueLimitation,
)
from api.tests.factories import (
    TechniqueFactory,
    AssuranceGoalFactory,
    TagFactory,
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


    def test_tag_creation(self):
        """Test that a Tag can be created"""
        tag = TagFactory(name="TestTag")
        self.assertEqual(tag.name, "TestTag")
        self.assertEqual(str(tag), "TestTag")


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
        )
        self.assertEqual(technique.name, "Test Technique")
        self.assertEqual(technique.description, "Test description")
        self.assertEqual(str(technique), "Test Technique")

    def test_technique_relationships(self):
        """Test that a Technique can have relationships with other models"""
        goal = AssuranceGoalFactory()
        tag = TagFactory()

        technique = TechniqueFactory(
            assurance_goals=[goal],
            tags=[tag],
        )

        # Test relationships
        self.assertEqual(technique.assurance_goals.count(), 1)
        self.assertEqual(technique.assurance_goals.first(), goal)

        self.assertEqual(technique.tags.count(), 1)
        self.assertEqual(technique.tags.first(), tag)

    def test_technique_related_techniques(self):
        """Test that a Technique can have related techniques"""
        technique1 = TechniqueFactory(name="Technique 1")
        technique2 = TechniqueFactory(name="Technique 2")
        technique3 = TechniqueFactory(name="Technique 3")
        
        # Add related techniques
        technique1.related_techniques.add(technique2, technique3)
        
        self.assertEqual(technique1.related_techniques.count(), 2)
        self.assertIn(technique2, technique1.related_techniques.all())
        self.assertIn(technique3, technique1.related_techniques.all())
        
        # The relationship is not symmetrical
        self.assertEqual(technique2.related_techniques.count(), 0)

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
