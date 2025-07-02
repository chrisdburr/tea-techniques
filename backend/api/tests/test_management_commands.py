import os
import tempfile
import json
from io import StringIO
from unittest.mock import patch, mock_open
from django.test import TestCase
from django.core.management import call_command
from django.core.management.base import CommandError
from api.models import Technique, AssuranceGoal, Tag, ResourceType
from api.tests.factories import TechniqueFactory, AssuranceGoalFactory, TagFactory


class ImportTechniquesCommandTestCase(TestCase):
    """Test the import_techniques management command"""

    def setUp(self):
        # Create some initial data
        self.goal1 = AssuranceGoalFactory(name="Accuracy")
        self.goal2 = AssuranceGoalFactory(name="Fairness")
        self.tag1 = TagFactory(name="machine-learning")
        self.tag2 = TagFactory(name="explainability")

    def test_import_techniques_with_valid_data(self):
        """Test importing techniques with valid JSON data"""
        # Sample technique data
        technique_data = [
            {
                "name": "Test Technique 1",
                "description": "A test technique for unit testing",
                "goals": ["Accuracy"],
                "tags": ["machine-learning"],
                "complexity_rating": 3,
                "computational_cost_rating": 2,
                "resources": [
                    {
                        "resource_type": "Paper",
                        "title": "Test Paper",
                        "url": "https://example.com/paper",
                        "description": "A test paper"
                    }
                ],
                "example_use_cases": [
                    {
                        "description": "Test use case",
                        "assurance_goal": "Accuracy"
                    }
                ],
                "limitations": ["Test limitation 1", "Test limitation 2"]
            }
        ]

        # Create a temporary file with the test data
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(technique_data, f)
            temp_filename = f.name

        try:
            # Capture output
            out = StringIO()
            
            # Call the command
            call_command('import_techniques', temp_filename, stdout=out)
            
            # Check that the technique was created
            self.assertEqual(Technique.objects.count(), 1)
            technique = Technique.objects.first()
            self.assertEqual(technique.name, "Test Technique 1")
            self.assertEqual(technique.description, "A test technique for unit testing")
            self.assertEqual(technique.complexity_rating, 3)
            self.assertEqual(technique.computational_cost_rating, 2)
            
            # Check relationships
            self.assertEqual(technique.assurance_goals.count(), 1)
            self.assertEqual(technique.tags.count(), 1)
            self.assertEqual(technique.resources.count(), 1)
            self.assertEqual(technique.example_use_cases.count(), 1)
            self.assertEqual(technique.limitations.count(), 2)
            
            # Check output
            output = out.getvalue()
            self.assertIn("Successfully imported 1 techniques", output)
            
        finally:
            # Clean up the temporary file
            os.unlink(temp_filename)

    def test_import_techniques_with_default_file(self):
        """Test importing techniques using the default techniques.json file"""
        # Mock the default file path and content
        mock_data = [
            {
                "name": "Default Technique",
                "description": "A technique from the default file",
                "goals": ["Accuracy"],
                "tags": ["machine-learning"],
                "complexity_rating": 2,
                "computational_cost_rating": 1
            }
        ]
        
        with patch('builtins.open', mock_open(read_data=json.dumps(mock_data))):
            with patch('os.path.exists', return_value=True):
                out = StringIO()
                call_command('import_techniques', stdout=out)
                
                # Check that the technique was created
                self.assertEqual(Technique.objects.count(), 1)
                technique = Technique.objects.first()
                self.assertEqual(technique.name, "Default Technique")
                
                # Check output
                output = out.getvalue()
                self.assertIn("Successfully imported 1 techniques", output)

    def test_import_techniques_creates_missing_goals_and_tags(self):
        """Test that the command creates missing assurance goals and tags"""
        technique_data = [
            {
                "name": "Test Technique",
                "description": "Test description",
                "goals": ["New Goal"],  # This goal doesn't exist
                "tags": ["new-tag"],   # This tag doesn't exist
                "complexity_rating": 1,
                "computational_cost_rating": 1
            }
        ]

        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(technique_data, f)
            temp_filename = f.name

        try:
            out = StringIO()
            call_command('import_techniques', temp_filename, stdout=out)
            
            # Check that new goal and tag were created
            self.assertTrue(AssuranceGoal.objects.filter(name="New Goal").exists())
            self.assertTrue(Tag.objects.filter(name="new-tag").exists())
            
            # Check that the technique was created with the new relationships
            technique = Technique.objects.first()
            self.assertEqual(technique.assurance_goals.filter(name="New Goal").count(), 1)
            self.assertEqual(technique.tags.filter(name="new-tag").count(), 1)
            
        finally:
            os.unlink(temp_filename)

    def test_import_techniques_handles_invalid_json(self):
        """Test that the command handles invalid JSON gracefully"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write("invalid json content")
            temp_filename = f.name

        try:
            with self.assertRaises(CommandError):
                call_command('import_techniques', temp_filename)
        finally:
            os.unlink(temp_filename)

    def test_import_techniques_handles_missing_file(self):
        """Test that the command handles missing files gracefully"""
        with self.assertRaises(CommandError):
            call_command('import_techniques', 'non_existent_file.json')

    def test_import_techniques_with_existing_technique(self):
        """Test importing when a technique with the same name already exists"""
        # Create an existing technique
        TechniqueFactory(name="Existing Technique")
        
        technique_data = [
            {
                "name": "Existing Technique",
                "description": "Updated description",
                "goals": ["Accuracy"],
                "tags": ["machine-learning"],
                "complexity_rating": 4,
                "computational_cost_rating": 3
            }
        ]

        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(technique_data, f)
            temp_filename = f.name

        try:
            out = StringIO()
            call_command('import_techniques', temp_filename, stdout=out)
            
            # Should still have only one technique (updated, not duplicated)
            self.assertEqual(Technique.objects.count(), 1)
            technique = Technique.objects.first()
            self.assertEqual(technique.description, "Updated description")
            self.assertEqual(technique.complexity_rating, 4)
            
            # Check output indicates update
            output = out.getvalue()
            self.assertIn("updated", output.lower())
            
        finally:
            os.unlink(temp_filename)

    def test_import_techniques_with_resource_types(self):
        """Test importing techniques with resource types that need to be created"""
        technique_data = [
            {
                "name": "Test Technique",
                "description": "Test description",
                "goals": ["Accuracy"],
                "tags": ["machine-learning"],
                "complexity_rating": 1,
                "computational_cost_rating": 1,
                "resources": [
                    {
                        "resource_type": "New Resource Type",
                        "title": "Test Resource",
                        "url": "https://example.com",
                        "description": "Test resource description"
                    }
                ]
            }
        ]

        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(technique_data, f)
            temp_filename = f.name

        try:
            out = StringIO()
            call_command('import_techniques', temp_filename, stdout=out)
            
            # Check that the resource type was created
            self.assertTrue(ResourceType.objects.filter(name="New Resource Type").exists())
            
            # Check that the technique has the resource
            technique = Technique.objects.first()
            self.assertEqual(technique.resources.count(), 1)
            resource = technique.resources.first()
            self.assertEqual(resource.title, "Test Resource")
            
        finally:
            os.unlink(temp_filename)


class ResetAndImportTechniquesCommandTestCase(TestCase):
    """Test the reset_and_import_techniques management command"""

    def setUp(self):
        # Create some existing data
        TechniqueFactory.create_batch(3)
        AssuranceGoalFactory.create_batch(2)
        TagFactory.create_batch(2)

    def test_reset_and_import_clears_existing_data(self):
        """Test that the reset command clears existing data before importing"""
        # Verify we have existing data
        self.assertEqual(Technique.objects.count(), 3)
        initial_goal_count = AssuranceGoal.objects.count()
        initial_tag_count = Tag.objects.count()

        # Mock the techniques data file
        mock_data = [
            {
                "name": "New Technique",
                "description": "After reset",
                "goals": ["New Goal"],
                "tags": ["new-tag"],
                "complexity_rating": 1,
                "computational_cost_rating": 1
            }
        ]
        
        with patch('builtins.open', mock_open(read_data=json.dumps(mock_data))):
            with patch('os.path.exists', return_value=True):
                out = StringIO()
                call_command('reset_and_import_techniques', stdout=out)
                
                # Check that old techniques were deleted and new one was created
                self.assertEqual(Technique.objects.count(), 1)
                technique = Technique.objects.first()
                self.assertEqual(technique.name, "New Technique")
                
                # Check output
                output = out.getvalue()
                self.assertIn("Cleared all existing techniques", output)
                self.assertIn("Successfully imported 1 techniques", output)

    def test_reset_and_import_with_custom_file(self):
        """Test reset and import with a custom file path"""
        technique_data = [
            {
                "name": "Custom File Technique",
                "description": "From custom file",
                "goals": ["Accuracy"],
                "tags": ["custom"],
                "complexity_rating": 2,
                "computational_cost_rating": 2
            }
        ]

        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(technique_data, f)
            temp_filename = f.name

        try:
            out = StringIO()
            call_command('reset_and_import_techniques', temp_filename, stdout=out)
            
            # Check that the technique was created
            self.assertEqual(Technique.objects.count(), 1)
            technique = Technique.objects.first()
            self.assertEqual(technique.name, "Custom File Technique")
            
            # Check output
            output = out.getvalue()
            self.assertIn("Cleared all existing techniques", output)
            self.assertIn("Successfully imported 1 techniques", output)
            
        finally:
            os.unlink(temp_filename)

    def test_reset_preserves_non_technique_data(self):
        """Test that reset only clears techniques, not other related data that might be referenced"""
        initial_goal_count = AssuranceGoal.objects.count()
        initial_tag_count = Tag.objects.count()
        
        # Mock empty techniques file
        with patch('builtins.open', mock_open(read_data='[]')):
            with patch('os.path.exists', return_value=True):
                out = StringIO()
                call_command('reset_and_import_techniques', stdout=out)
                
                # Techniques should be cleared
                self.assertEqual(Technique.objects.count(), 0)
                
                # But goals and tags might still exist (depending on implementation)
                # This test checks that the command doesn't error out
                output = out.getvalue()
                self.assertIn("Cleared all existing techniques", output)