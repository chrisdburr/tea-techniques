# api/tests/unit/serializers/test_serializers.py
"""
Unit tests for API serializers.

Tests cover field validation, data transformation, nested relationships,
and integration with the service layer for complex operations.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from django.test import TestCase
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIRequestFactory

from api.serializers import (
    AssuranceGoalSerializer,
    TagSerializer,
    ResourceTypeSerializer,
    TechniqueResourceSerializer,
    TechniqueExampleUseCaseSerializer,
    TechniqueLimitationSerializer,
    TechniqueSerializer,
)
from api.models import (
    AssuranceGoal,
    Tag,
    ResourceType,
    Technique,
    TechniqueResource,
    TechniqueExampleUseCase,
    TechniqueLimitation,
)
from api.services import TechniqueOperationError
from api.tests.factories import (
    AssuranceGoalFactory,
    TagFactory,
    ResourceTypeFactory,
    TechniqueFactory,
    TechniqueResourceFactory,
    TechniqueExampleUseCaseFactory,
    TechniqueLimitationFactory,
)


class AssuranceGoalSerializerTests(TestCase):
    """Test AssuranceGoal serializer functionality."""
    
    def test_serialize_assurance_goal(self):
        """Test serializing an assurance goal to JSON."""
        goal = AssuranceGoalFactory(
            name="Explainability",
            description="Techniques for making AI decisions interpretable"
        )
        
        serializer = AssuranceGoalSerializer(goal)
        data = serializer.data
        
        self.assertEqual(data['name'], "Explainability")
        self.assertEqual(data['description'], "Techniques for making AI decisions interpretable")
        self.assertIn('id', data)
    
    def test_deserialize_valid_assurance_goal(self):
        """Test deserializing valid JSON to create an assurance goal."""
        data = {
            'name': 'Fairness',
            'description': 'Techniques for ensuring AI fairness'
        }
        
        serializer = AssuranceGoalSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        goal = serializer.save()
        self.assertEqual(goal.name, 'Fairness')
        self.assertEqual(goal.description, 'Techniques for ensuring AI fairness')
    
    def test_deserialize_invalid_assurance_goal(self):
        """Test deserializing invalid data raises validation errors."""
        invalid_data_sets = [
            {'name': '', 'description': 'Valid description'},  # Empty name
            {'name': 'Valid Name', 'description': ''},  # Empty description
            {'description': 'Missing name field'},  # Missing name
            {'name': 'Missing description field'},  # Missing description
        ]
        
        for invalid_data in invalid_data_sets:
            with self.subTest(data=invalid_data):
                serializer = AssuranceGoalSerializer(data=invalid_data)
                self.assertFalse(serializer.is_valid())
    
    def test_update_assurance_goal(self):
        """Test updating an existing assurance goal."""
        goal = AssuranceGoalFactory()
        
        update_data = {
            'name': 'Updated Explainability',
            'description': 'Updated description for explainability techniques'
        }
        
        serializer = AssuranceGoalSerializer(goal, data=update_data, partial=True)
        self.assertTrue(serializer.is_valid())
        
        updated_goal = serializer.save()
        self.assertEqual(updated_goal.name, 'Updated Explainability')
        self.assertEqual(updated_goal.description, 'Updated description for explainability techniques')


class TagSerializerTests(TestCase):
    """Test Tag serializer functionality."""
    
    def test_serialize_tag(self):
        """Test serializing a tag to JSON."""
        tag = TagFactory(name="interpretability")
        
        serializer = TagSerializer(tag)
        data = serializer.data
        
        self.assertEqual(data['name'], "interpretability")
        self.assertIn('id', data)
    
    def test_deserialize_valid_tag(self):
        """Test deserializing valid JSON to create a tag."""
        data = {'name': 'model-agnostic'}
        
        serializer = TagSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        tag = serializer.save()
        self.assertEqual(tag.name, 'model-agnostic')
    
    def test_deserialize_invalid_tag(self):
        """Test deserializing invalid data raises validation errors."""
        invalid_data_sets = [
            {'name': ''},  # Empty name
            {},  # Missing name
        ]
        
        for invalid_data in invalid_data_sets:
            with self.subTest(data=invalid_data):
                serializer = TagSerializer(data=invalid_data)
                self.assertFalse(serializer.is_valid())


class ResourceTypeSerializerTests(TestCase):
    """Test ResourceType serializer functionality."""
    
    def test_serialize_resource_type(self):
        """Test serializing a resource type to JSON."""
        resource_type = ResourceTypeFactory(
            name="Technical Paper",
            icon="technical_paper"
        )
        
        serializer = ResourceTypeSerializer(resource_type)
        data = serializer.data
        
        self.assertEqual(data['name'], "Technical Paper")
        self.assertEqual(data['icon'], "technical_paper")
        self.assertIn('id', data)
    
    def test_deserialize_valid_resource_type(self):
        """Test deserializing valid JSON to create a resource type."""
        data = {
            'name': 'GitHub Repository',
            'icon': 'github_repository'
        }
        
        serializer = ResourceTypeSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        resource_type = serializer.save()
        self.assertEqual(resource_type.name, 'GitHub Repository')
        self.assertEqual(resource_type.icon, 'github_repository')
    
    def test_deserialize_invalid_resource_type(self):
        """Test deserializing invalid data raises validation errors."""
        invalid_data_sets = [
            {'name': '', 'icon': 'valid_icon'},  # Empty name
            {'name': 'Valid Name', 'icon': ''},  # Empty icon
            {'icon': 'missing_name'},  # Missing name
            {'name': 'missing_icon'},  # Missing icon
        ]
        
        for invalid_data in invalid_data_sets:
            with self.subTest(data=invalid_data):
                serializer = ResourceTypeSerializer(data=invalid_data)
                self.assertFalse(serializer.is_valid())


class TechniqueResourceSerializerTests(TestCase):
    """Test TechniqueResource serializer functionality."""
    
    def setUp(self):
        """Set up test data."""
        self.technique = TechniqueFactory()
        self.resource_type = ResourceTypeFactory(name="Technical Paper")
    
    def test_serialize_technique_resource(self):
        """Test serializing a technique resource with resource_type_name field."""
        resource = TechniqueResourceFactory(
            technique=self.technique,
            resource_type=self.resource_type,
            title="SHAP Paper"
        )
        
        serializer = TechniqueResourceSerializer(resource)
        data = serializer.data
        
        self.assertEqual(data['title'], "SHAP Paper")
        self.assertEqual(data['resource_type'], self.resource_type.id)
        self.assertEqual(data['resource_type_name'], "Technical Paper")
        self.assertIn('url', data)
        self.assertIn('description', data)
        self.assertIn('authors', data)
        self.assertIn('publication_date', data)
        self.assertIn('source_type', data)
    
    def test_resource_type_name_is_read_only(self):
        """Test that resource_type_name cannot be set during creation."""
        data = {
            'technique': self.technique.id,
            'resource_type': self.resource_type.id,
            'resource_type_name': 'Should Be Ignored',
            'title': 'Test Resource',
            'url': 'https://example.com'
        }
        
        serializer = TechniqueResourceSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        resource = serializer.save()
        # resource_type_name should come from the actual resource_type, not the input
        self.assertEqual(resource.resource_type.name, "Technical Paper")
    
    def test_deserialize_valid_technique_resource(self):
        """Test deserializing valid JSON to create a technique resource."""
        data = {
            'technique': self.technique.id,
            'resource_type': self.resource_type.id,
            'title': 'Test Resource',
            'url': 'https://example.com/resource',
            'description': 'A test resource',
            'authors': 'Test Author',
            'source_type': 'Technical Paper'
        }
        
        serializer = TechniqueResourceSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        resource = serializer.save()
        self.assertEqual(resource.title, 'Test Resource')
        self.assertEqual(resource.url, 'https://example.com/resource')
        self.assertEqual(resource.technique, self.technique)
        self.assertEqual(resource.resource_type, self.resource_type)


class TechniqueExampleUseCaseSerializerTests(TestCase):
    """Test TechniqueExampleUseCase serializer functionality."""
    
    def setUp(self):
        """Set up test data."""
        self.technique = TechniqueFactory()
        self.assurance_goal = AssuranceGoalFactory(name="Explainability")
    
    def test_serialize_use_case_with_goal(self):
        """Test serializing a use case with an assurance goal."""
        use_case = TechniqueExampleUseCaseFactory(
            technique=self.technique,
            assurance_goal=self.assurance_goal,
            description="Loan approval explanation"
        )
        
        serializer = TechniqueExampleUseCaseSerializer(use_case)
        data = serializer.data
        
        self.assertEqual(data['description'], "Loan approval explanation")
        self.assertEqual(data['assurance_goal'], self.assurance_goal.id)
        self.assertEqual(data['assurance_goal_name'], "Explainability")
    
    def test_serialize_use_case_without_goal(self):
        """Test serializing a use case without an assurance goal."""
        use_case = TechniqueExampleUseCaseFactory(
            technique=self.technique,
            assurance_goal=None,
            description="General use case"
        )
        
        serializer = TechniqueExampleUseCaseSerializer(use_case)
        data = serializer.data
        
        self.assertEqual(data['description'], "General use case")
        self.assertIsNone(data['assurance_goal'])
        self.assertIsNone(data['assurance_goal_name'])
    
    def test_get_assurance_goal_name_method(self):
        """Test the get_assurance_goal_name method directly."""
        serializer = TechniqueExampleUseCaseSerializer()
        
        # Test with goal
        use_case_with_goal = TechniqueExampleUseCaseFactory(
            assurance_goal=self.assurance_goal
        )
        goal_name = serializer.get_assurance_goal_name(use_case_with_goal)
        self.assertEqual(goal_name, "Explainability")
        
        # Test without goal
        use_case_without_goal = TechniqueExampleUseCaseFactory(
            assurance_goal=None
        )
        goal_name = serializer.get_assurance_goal_name(use_case_without_goal)
        self.assertIsNone(goal_name)


class TechniqueLimitationSerializerTests(TestCase):
    """Test TechniqueLimitation serializer functionality."""
    
    def test_serialize_limitation(self):
        """Test serializing a technique limitation."""
        limitation = TechniqueLimitationFactory(
            description="Computational limitations with large datasets"
        )
        
        serializer = TechniqueLimitationSerializer(limitation)
        data = serializer.data
        
        self.assertEqual(data['description'], "Computational limitations with large datasets")
        self.assertIn('id', data)
        # Technique field should not be included
        self.assertNotIn('technique', data)
    
    def test_deserialize_valid_limitation(self):
        """Test deserializing valid JSON to create a limitation."""
        technique = TechniqueFactory()
        data = {
            'technique': technique.id,
            'description': 'Test limitation'
        }
        
        serializer = TechniqueLimitationSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        limitation = serializer.save()
        self.assertEqual(limitation.description, 'Test limitation')


class TechniqueSerializerTests(TestCase):
    """Test TechniqueSerializer functionality."""
    
    def setUp(self):
        """Set up test data."""
        self.factory = APIRequestFactory()
        self.assurance_goal = AssuranceGoalFactory(name="Explainability")
        self.tag = TagFactory(name="interpretability")
        self.related_technique = TechniqueFactory(name="Related Technique")
    
    def test_serialize_technique_with_relationships(self):
        """Test serializing a technique with all relationships."""
        technique = TechniqueFactory(name="SHAP Analysis")
        technique.assurance_goals.add(self.assurance_goal)
        technique.tags.add(self.tag)
        technique.related_techniques.add(self.related_technique)
        
        # Add related objects
        resource = TechniqueResourceFactory(technique=technique)
        use_case = TechniqueExampleUseCaseFactory(technique=technique)
        limitation = TechniqueLimitationFactory(technique=technique)
        
        serializer = TechniqueSerializer(technique)
        data = serializer.data
        
        # Check basic fields
        self.assertEqual(data['name'], "SHAP Analysis")
        self.assertIn('description', data)
        self.assertIn('complexity_rating', data)
        self.assertIn('computational_cost_rating', data)
        
        # Check relationships
        self.assertEqual(len(data['assurance_goals']), 1)
        self.assertEqual(data['assurance_goals'][0]['name'], "Explainability")
        
        self.assertEqual(len(data['tags']), 1)
        self.assertEqual(data['tags'][0]['name'], "interpretability")
        
        self.assertEqual(len(data['related_techniques']), 1)
        self.assertEqual(data['related_techniques'][0], self.related_technique.id)
        
        # Check nested objects
        self.assertEqual(len(data['resources']), 1)
        self.assertEqual(len(data['example_use_cases']), 1)
        self.assertEqual(len(data['limitations']), 1)
    
    def test_serialize_technique_without_relationships(self):
        """Test serializing a technique without relationships."""
        technique = TechniqueFactory()
        
        serializer = TechniqueSerializer(technique)
        data = serializer.data
        
        # Relationships should be empty lists
        self.assertEqual(data['assurance_goals'], [])
        self.assertEqual(data['tags'], [])
        self.assertEqual(data['related_techniques'], [])
        self.assertEqual(data['resources'], [])
        self.assertEqual(data['example_use_cases'], [])
        self.assertEqual(data['limitations'], [])
    
    def test_writable_id_fields_present(self):
        """Test that writable ID fields are present in serializer fields."""
        serializer = TechniqueSerializer()
        
        # Check write-only fields are present
        self.assertIn('assurance_goal_ids', serializer.fields)
        self.assertIn('tag_ids', serializer.fields)
        self.assertIn('related_technique_ids', serializer.fields)
        
        # Check they are write-only
        self.assertTrue(serializer.fields['assurance_goal_ids'].write_only)
        self.assertTrue(serializer.fields['tag_ids'].write_only)
        self.assertTrue(serializer.fields['related_technique_ids'].write_only)
    
    @patch('api.serializers.TechniqueService')
    def test_create_technique_success(self, mock_service_class):
        """Test successful technique creation using TechniqueService."""
        # Setup mock
        mock_service = Mock()
        mock_service_class.return_value = mock_service
        mock_technique = TechniqueFactory.build()
        mock_service.create_technique.return_value = mock_technique
        
        # Prepare data
        data = {
            'name': 'Test Technique',
            'description': 'Test description',
            'assurance_goal_ids': [self.assurance_goal.id],
            'tag_ids': [self.tag.id],
        }
        
        # Create request context
        request = self.factory.post('/techniques/', data)
        context = {'request': request}
        
        # Test creation
        serializer = TechniqueSerializer(data=data, context=context)
        self.assertTrue(serializer.is_valid())
        
        result = serializer.save()
        
        # Verify service was called correctly
        mock_service.create_technique.assert_called_once()
        self.assertEqual(result, mock_technique)
    
    @patch('api.serializers.TechniqueService')
    def test_create_technique_service_error(self, mock_service_class):
        """Test technique creation when service raises TechniqueOperationError."""
        # Setup mock to raise error
        mock_service = Mock()
        mock_service_class.return_value = mock_service
        mock_service.create_technique.side_effect = TechniqueOperationError("Service error")
        
        # Prepare data
        data = {
            'name': 'Test Technique',
            'description': 'Test description',
        }
        
        # Create request context
        request = self.factory.post('/techniques/', data)
        context = {'request': request}
        
        # Test creation with error
        serializer = TechniqueSerializer(data=data, context=context)
        self.assertTrue(serializer.is_valid())
        
        with self.assertRaises(ValidationError) as context_manager:
            serializer.save()
        
        # Check error message
        self.assertIn("Failed to create technique", str(context_manager.exception))
    
    @patch('api.serializers.TechniqueService')
    def test_update_technique_success(self, mock_service_class):
        """Test successful technique update using TechniqueService."""
        # Setup mock
        mock_service = Mock()
        mock_service_class.return_value = mock_service
        technique = TechniqueFactory()
        mock_service.update_technique.return_value = technique
        
        # Prepare update data
        update_data = {
            'name': 'Updated Technique',
            'description': 'Updated description',
        }
        
        # Create request context
        request = self.factory.put('/techniques/1/', update_data)
        context = {'request': request}
        
        # Test update
        serializer = TechniqueSerializer(technique, data=update_data, context=context, partial=True)
        self.assertTrue(serializer.is_valid())
        
        result = serializer.save()
        
        # Verify service was called correctly
        mock_service.update_technique.assert_called_once()
        self.assertEqual(result, technique)
    
    @patch('api.serializers.TechniqueService')
    def test_update_technique_service_error(self, mock_service_class):
        """Test technique update when service raises TechniqueOperationError."""
        # Setup mock to raise error
        mock_service = Mock()
        mock_service_class.return_value = mock_service
        mock_service.update_technique.side_effect = TechniqueOperationError("Update error")
        
        technique = TechniqueFactory()
        update_data = {'name': 'Updated Technique'}
        
        # Create request context
        request = self.factory.put('/techniques/1/', update_data)
        context = {'request': request}
        
        # Test update with error
        serializer = TechniqueSerializer(technique, data=update_data, context=context, partial=True)
        self.assertTrue(serializer.is_valid())
        
        with self.assertRaises(ValidationError) as context_manager:
            serializer.save()
        
        # Check error message
        self.assertIn("Failed to update technique", str(context_manager.exception))
    
    def test_technique_service_initialization(self):
        """Test that TechniqueService is properly initialized in __init__."""
        serializer = TechniqueSerializer()
        self.assertIsNotNone(serializer.technique_service)
        # Verify it's the correct type (use hasattr to avoid import issues)
        self.assertTrue(hasattr(serializer.technique_service, 'create_technique'))
        self.assertTrue(hasattr(serializer.technique_service, 'update_technique'))
    
    def test_validation_with_invalid_ids(self):
        """Test validation when providing invalid IDs for relationships."""
        data = {
            'name': 'Test Technique',
            'description': 'Test description',
            'assurance_goal_ids': [99999],  # Non-existent ID
            'tag_ids': [99999],  # Non-existent ID
            'related_technique_ids': [99999],  # Non-existent ID
        }
        
        serializer = TechniqueSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        
        # Check that validation errors mention the invalid objects
        errors = serializer.errors
        self.assertIn('assurance_goal_ids', errors)
        self.assertIn('tag_ids', errors)
        self.assertIn('related_technique_ids', errors)
    
    def test_validation_with_valid_ids(self):
        """Test validation with valid IDs for relationships."""
        data = {
            'name': 'Test Technique',
            'description': 'Test description',
            'assurance_goal_ids': [self.assurance_goal.id],
            'tag_ids': [self.tag.id],
            'related_technique_ids': [self.related_technique.id],
        }
        
        serializer = TechniqueSerializer(data=data)
        self.assertTrue(serializer.is_valid())
    
    def test_field_sources_mapping(self):
        """Test that write-only fields map to correct sources."""
        serializer = TechniqueSerializer()
        
        # Check source mappings
        self.assertEqual(serializer.fields['assurance_goal_ids'].source, 'assurance_goals')
        self.assertEqual(serializer.fields['tag_ids'].source, 'tags')
        self.assertEqual(serializer.fields['related_technique_ids'].source, 'related_techniques')


class SerializerIntegrationTests(TestCase):
    """Test integration between different serializers."""
    
    def test_nested_serializer_consistency(self):
        """Test that nested serializers produce consistent output."""
        # Create a complete technique with all relationships
        technique = TechniqueFactory()
        assurance_goal = AssuranceGoalFactory()
        tag = TagFactory()
        technique.assurance_goals.add(assurance_goal)
        technique.tags.add(tag)
        
        resource = TechniqueResourceFactory(technique=technique)
        use_case = TechniqueExampleUseCaseFactory(technique=technique, assurance_goal=assurance_goal)
        limitation = TechniqueLimitationFactory(technique=technique)
        
        # Serialize the technique
        technique_serializer = TechniqueSerializer(technique)
        technique_data = technique_serializer.data
        
        # Serialize individual components
        goal_serializer = AssuranceGoalSerializer(assurance_goal)
        tag_serializer = TagSerializer(tag)
        resource_serializer = TechniqueResourceSerializer(resource)
        use_case_serializer = TechniqueExampleUseCaseSerializer(use_case)
        limitation_serializer = TechniqueLimitationSerializer(limitation)
        
        # Verify consistency
        self.assertEqual(technique_data['assurance_goals'][0], goal_serializer.data)
        self.assertEqual(technique_data['tags'][0], tag_serializer.data)
        self.assertEqual(technique_data['resources'][0], resource_serializer.data)
        self.assertEqual(technique_data['example_use_cases'][0], use_case_serializer.data)
        self.assertEqual(technique_data['limitations'][0], limitation_serializer.data)
    
    def test_serializer_performance_with_large_datasets(self):
        """Test serializer performance with techniques containing many relationships."""
        technique = TechniqueFactory()
        
        # Add many relationships
        goals = [AssuranceGoalFactory() for _ in range(5)]
        tags = [TagFactory() for _ in range(10)]
        
        for goal in goals:
            technique.assurance_goals.add(goal)
        for tag in tags:
            technique.tags.add(tag)
        
        # Add many related objects
        for _ in range(10):
            TechniqueResourceFactory(technique=technique)
            TechniqueExampleUseCaseFactory(technique=technique)
            TechniqueLimitationFactory(technique=technique)
        
        # Test that serialization completes without error
        serializer = TechniqueSerializer(technique)
        data = serializer.data
        
        # Verify all relationships are included
        self.assertEqual(len(data['assurance_goals']), 5)
        self.assertEqual(len(data['tags']), 10)
        self.assertEqual(len(data['resources']), 10)
        self.assertEqual(len(data['example_use_cases']), 10)
        self.assertEqual(len(data['limitations']), 10)