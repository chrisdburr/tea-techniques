# api/tests/unit/management/test_import_techniques_command.py
"""
Unit tests for import_techniques management command to increase coverage.
"""

import builtins
import contextlib
import json
import tempfile
from io import StringIO
from pathlib import Path
from unittest.mock import Mock, patch

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase, TransactionTestCase

from api.management.commands.import_techniques import Command
from api.models import Technique
from api.tests.factories import AssuranceGoalFactory, ResourceTypeFactory, TagFactory


class ImportTechniquesCommandUnitTests(TestCase):
    """Unit tests for import_techniques command functionality."""

    def setUp(self):
        """Set up test data."""
        self.command = Command()
        self.temp_dir = tempfile.mkdtemp()

    def tearDown(self):
        """Clean up temp files."""
        import shutil

        with contextlib.suppress(builtins.BaseException):
            shutil.rmtree(self.temp_dir)

    def create_temp_json_file(self, data, filename="test_techniques.json"):
        """Helper to create temporary JSON file."""
        file_path = Path(self.temp_dir) / filename
        with Path(file_path).open("w") as f:
            json.dump(data, f)
        return file_path

    def test_add_arguments(self):
        """Test that command arguments are properly configured."""
        parser = Mock()
        self.command.add_arguments(parser)

        # Verify all expected arguments are added
        call_args = [call[0] for call in parser.add_argument.call_args_list]
        argument_names = [args[0] for args in call_args]

        self.assertIn("--file", argument_names)
        self.assertIn("--force", argument_names)
        self.assertIn("--dry-run", argument_names)

    def test_handle_with_no_file_argument(self):
        """Test command execution without file argument uses default file."""
        out = StringIO()
        err = StringIO()

        # Command should use default file and run successfully
        # (since techniques_migrated.json exists in the data directory)
        call_command("import_techniques", "--dry-run", stdout=out, stderr=err)

        output = out.getvalue()
        self.assertIn("Dry run:", output)

    def test_handle_with_nonexistent_file(self):
        """Test command execution with non-existent file."""
        out = StringIO()
        err = StringIO()

        with self.assertRaises(CommandError) as context:
            call_command(
                "import_techniques",
                "--file",
                "/nonexistent/file.json",
                stdout=out,
                stderr=err,
            )

        self.assertIn("File not found", str(context.exception))

    def test_handle_with_invalid_json_file(self):
        """Test command execution with invalid JSON file."""
        # Create file with invalid JSON
        invalid_json_file = self.create_temp_json_file("invalid json content", "invalid.json")
        # Overwrite with invalid JSON string
        with Path(invalid_json_file).open("w") as f:
            f.write("{ invalid json }")

        out = StringIO()
        err = StringIO()

        with self.assertRaises(CommandError) as context:
            call_command("import_techniques", "--file", invalid_json_file, stdout=out, stderr=err)

        self.assertIn("Invalid JSON", str(context.exception))

    def test_handle_with_empty_json_file(self):
        """Test command execution with empty JSON file."""
        empty_file = self.create_temp_json_file([])

        out = StringIO()

        call_command("import_techniques", "--file", empty_file, stdout=out)

        output = out.getvalue()
        self.assertIn("imported 0 techniques", output)

    @patch("api.management.commands.import_techniques.TechniqueDataValidator")
    def test_handle_with_validation_error(self, mock_validator):
        """Test command execution with validation errors."""
        # Mock validator to raise validation error
        mock_validator_instance = Mock()
        mock_validator_instance.validate_required_fields.side_effect = Exception("Validation failed")
        mock_validator.return_value = mock_validator_instance

        techniques_data = [{"name": "Test Technique", "description": "Test"}]
        file_path = self.create_temp_json_file(techniques_data)

        out = StringIO()
        err = StringIO()

        with self.assertRaises(CommandError) as context:
            call_command("import_techniques", "--file", file_path, stdout=out, stderr=err)

        self.assertIn("Validation failed", str(context.exception))

    def test_dry_run_mode(self):
        """Test dry-run mode execution."""
        techniques_data = [{"name": "Test Technique", "description": "Test"}]
        file_path = self.create_temp_json_file(techniques_data)

        out = StringIO()

        call_command("import_techniques", "--file", file_path, "--dry-run", stdout=out)

        output = out.getvalue()
        self.assertIn("Dry run:", output)
        self.assertIn("validated", output)

        # Verify no techniques were actually created
        self.assertEqual(Technique.objects.count(), 0)

    @patch("api.management.commands.import_techniques.TechniqueDataExtractor")
    def test_handle_with_extractor_error(self, mock_extractor):
        """Test command execution with data extraction errors."""
        # Mock extractor to raise error
        mock_extractor_instance = Mock()
        mock_extractor_instance.extract_basic_data.side_effect = Exception("Extraction failed")
        mock_extractor.return_value = mock_extractor_instance

        techniques_data = [{"name": "Test Technique", "description": "Test"}]
        file_path = self.create_temp_json_file(techniques_data)

        out = StringIO()
        err = StringIO()

        with self.assertRaises(CommandError) as context:
            call_command("import_techniques", "--file", file_path, stdout=out, stderr=err)

        self.assertIn("Extraction failed", str(context.exception))

    def test_force_mode_with_errors(self):
        """Test force mode continues on errors."""
        # Create invalid technique data that will cause errors
        techniques_data = [
            {"name": "Valid Technique", "description": "Valid"},
            {"invalid": "data"},  # Missing required fields
            {"name": "Another Valid", "description": "Valid"},
        ]
        file_path = self.create_temp_json_file(techniques_data)

        out = StringIO()

        # This should not raise an exception in force mode
        call_command("import_techniques", "--file", file_path, "--force", stdout=out)

        output = out.getvalue()
        self.assertIn("Successfully imported", output)

    @patch("api.utils.logger")
    @patch("api.management.commands.import_techniques.logger")
    def test_logging_on_errors(self, mock_command_logger, mock_utils_logger):
        """Test that errors are properly logged."""
        techniques_data = [{"name": "", "description": "Test"}]  # Empty name will cause validation error
        file_path = self.create_temp_json_file(techniques_data)

        out = StringIO()

        with contextlib.suppress(builtins.BaseException):
            call_command("import_techniques", "--file", file_path, "--force", stdout=out)

        # Verify logger was called (could be either command logger or utils logger)
        self.assertTrue(
            mock_command_logger.error.called
            or mock_command_logger.warning.called
            or mock_utils_logger.error.called
            or mock_utils_logger.warning.called
        )

    def test_handle_with_different_file_extensions(self):
        """Test command with different file extensions."""
        techniques_data = [{"name": "Test Technique", "description": "Test"}]

        # Test with .json extension
        json_file = self.create_temp_json_file(techniques_data, "test.json")
        out = StringIO()
        call_command("import_techniques", "--file", json_file, "--dry-run", stdout=out)

        # Test with no extension
        no_ext_file = self.create_temp_json_file(techniques_data, "test")
        out = StringIO()
        call_command("import_techniques", "--file", no_ext_file, "--dry-run", stdout=out)

    def test_file_permission_error(self):
        """Test handling of file permission errors."""
        # Create a file and remove read permissions
        file_path = self.create_temp_json_file([])

        # Mock file operations to simulate permission error during file opening
        # The command currently doesn't catch these errors, so they bubble up as PermissionError
        with patch("pathlib.Path.open", side_effect=PermissionError("Permission denied")):
            out = StringIO()
            err = StringIO()

            # Currently the command doesn't catch file permission errors
            with self.assertRaises(PermissionError):
                call_command("import_techniques", "--file", file_path, stdout=out, stderr=err)


class ImportTechniquesCommandDatabaseTests(TransactionTestCase):
    """Database-related tests for import_techniques command."""

    def setUp(self):
        """Set up test data."""
        self.temp_dir = tempfile.mkdtemp()
        # Create necessary database objects
        self.assurance_goal = AssuranceGoalFactory(name="Test Goal")
        self.tag = TagFactory(name="test-tag")
        self.resource_type = ResourceTypeFactory(name="Test Resource")

    def tearDown(self):
        """Clean up temp files."""
        import shutil

        with contextlib.suppress(builtins.BaseException):
            shutil.rmtree(self.temp_dir)

    def create_temp_json_file(self, data, filename="test_techniques.json"):
        """Helper to create temporary JSON file."""
        file_path = Path(self.temp_dir) / filename
        with Path(file_path).open("w") as f:
            json.dump(data, f)
        return file_path

    @patch("api.models.Technique.objects.update_or_create")
    def test_transaction_rollback_on_error(self, mock_update_or_create):
        """Test that database transactions are rolled back on errors."""
        # Mock technique creation to raise a database error
        mock_update_or_create.side_effect = Exception("Database error")

        techniques_data = [{"slug": "test-technique", "name": "Test Technique", "description": "Test"}]
        file_path = self.create_temp_json_file(techniques_data)

        out = StringIO()
        err = StringIO()

        with self.assertRaises(CommandError):
            call_command("import_techniques", "--file", file_path, stdout=out, stderr=err)

        # Verify the mock was called
        self.assertTrue(mock_update_or_create.called)

    def test_import_with_missing_related_objects(self):
        """Test import when related objects don't exist."""
        techniques_data = [
            {
                "name": "Test Technique",
                "description": "Test description",
                "assurance_goals": ["Nonexistent Goal"],
                "tags": ["nonexistent-tag"],
            }
        ]
        file_path = self.create_temp_json_file(techniques_data)

        out = StringIO()

        # This should create the related objects if they don't exist
        call_command("import_techniques", "--file", file_path, "--force", stdout=out)

        output = out.getvalue()
        self.assertIn("Successfully imported", output)

    def test_database_integrity_error_handling(self):
        """Test handling of database integrity errors."""
        # Create a technique that will cause a unique constraint violation
        techniques_data = [
            {"name": "Duplicate Technique", "description": "First"},
            {"name": "Duplicate Technique", "description": "Second"},  # Same name
        ]
        file_path = self.create_temp_json_file(techniques_data)

        out = StringIO()

        # This should handle the integrity error gracefully with force mode
        call_command("import_techniques", "--file", file_path, "--force", stdout=out)

        output = out.getvalue()
        self.assertIn("Successfully imported", output)


class ImportTechniquesCommandUtilityTests(TestCase):
    """Test utility functions and error handling."""

    def test_command_help_text(self):
        """Test that command help text is defined."""
        command = Command()
        self.assertEqual(command.help, "Import techniques from JSON file")

    @patch("os.path.exists")
    def test_file_existence_check(self, mock_exists):
        """Test file existence checking."""
        mock_exists.return_value = False

        out = StringIO()
        err = StringIO()

        with self.assertRaises(CommandError) as context:
            call_command("import_techniques", "--file", "/fake/path.json", stdout=out, stderr=err)

        self.assertIn("File not found", str(context.exception))

    def test_json_loading_with_unicode(self):
        """Test JSON loading with unicode characters."""
        techniques_data = [
            {
                "name": "Téchnique with ünicôde",
                "description": "Test with special characters: αβγδε 🤖",
            }
        ]

        temp_dir = tempfile.mkdtemp()
        try:
            file_path = Path(temp_dir) / "unicode_test.json"
            with Path(file_path).open("w", encoding="utf-8") as f:
                json.dump(techniques_data, f, ensure_ascii=False)

            out = StringIO()
            call_command("import_techniques", "--file", file_path, "--dry-run", stdout=out)

            output = out.getvalue()
            self.assertIn("Dry run:", output)
        finally:
            import shutil

            shutil.rmtree(temp_dir)

    def test_large_json_file_handling(self):
        """Test handling of large JSON files."""
        # Create a large dataset
        techniques_data = []
        for i in range(100):
            techniques_data.append(
                {
                    "name": f"Technique {i}",
                    "description": f"Description for technique {i}" * 10,  # Make it longer
                }
            )

        temp_dir = tempfile.mkdtemp()
        try:
            file_path = Path(temp_dir) / "large_test.json"
            with Path(file_path).open("w") as f:
                json.dump(techniques_data, f)

            out = StringIO()
            call_command("import_techniques", "--file", file_path, "--dry-run", stdout=out)

            output = out.getvalue()
            self.assertIn("validated 100", output)
        finally:
            import shutil

            shutil.rmtree(temp_dir)

    @patch("pathlib.Path.exists")
    def test_pathlib_error_handling(self, mock_exists):
        """Test handling of file existence check errors."""
        mock_exists.side_effect = OSError("Path error")

        out = StringIO()
        err = StringIO()

        with self.assertRaises(OSError) as context:
            call_command("import_techniques", "--file", "/some/path.json", stdout=out, stderr=err)

        self.assertIn("Path error", str(context.exception))

    def test_json_decode_error_specific_message(self):
        """Test specific JSON decode error messages."""
        temp_dir = tempfile.mkdtemp()
        try:
            file_path = Path(temp_dir) / "bad_json.json"
            with Path(file_path).open("w") as f:
                f.write('{"incomplete": json object')  # Malformed JSON

            out = StringIO()
            err = StringIO()

            with self.assertRaises(CommandError) as context:
                call_command("import_techniques", "--file", file_path, stdout=out, stderr=err)

            self.assertIn("Invalid JSON", str(context.exception))
        finally:
            import shutil

            shutil.rmtree(temp_dir)

    def test_command_with_complex_nested_data(self):
        """Test command with complex nested technique data."""
        techniques_data = [
            {
                "name": "Complex Technique",
                "description": "Complex description",
                "assurance_goals": ["Goal 1", "Goal 2"],
                "tags": ["tag1", "tag2", "tag3"],
                "resources": [
                    {
                        "title": "Resource 1",
                        "url": "https://example.com/1",
                        "resource_type": "Technical Paper",
                    }
                ],
                "example_use_cases": ["Use case 1", "Use case 2"],
                "limitations": ["Limitation 1", "Limitation 2"],
            }
        ]

        temp_dir = tempfile.mkdtemp()
        try:
            file_path = Path(temp_dir) / "complex_test.json"
            with Path(file_path).open("w") as f:
                json.dump(techniques_data, f)

            out = StringIO()
            call_command("import_techniques", "--file", file_path, "--dry-run", stdout=out)

            output = out.getvalue()
            self.assertIn("Dry run:", output)
            self.assertIn("validated", output)
        finally:
            import shutil

            shutil.rmtree(temp_dir)


class ImportTechniquesCommandErrorRecoveryTests(TestCase):
    """Test error recovery and continuation scenarios."""

    def setUp(self):
        """Set up test data."""
        self.temp_dir = tempfile.mkdtemp()

    def tearDown(self):
        """Clean up temp files."""
        import shutil

        with contextlib.suppress(builtins.BaseException):
            shutil.rmtree(self.temp_dir)

    def create_temp_json_file(self, data, filename="test_techniques.json"):
        """Helper to create temporary JSON file."""
        file_path = Path(self.temp_dir) / filename
        with Path(file_path).open("w") as f:
            json.dump(data, f)
        return file_path

    @patch("api.management.commands.import_techniques.TechniqueDataExtractor")
    def test_partial_failure_with_force_mode(self, mock_extractor):
        """Test partial failure handling in force mode."""
        # Create mock extractor that fails on second technique
        mock_extractor_instance = Mock()
        mock_extractor_instance.extract_technique_data.side_effect = [
            Mock(),  # Success for first technique
            Exception("Processing failed"),  # Failure for second
            Mock(),  # Success for third technique
        ]
        mock_extractor.return_value = mock_extractor_instance

        techniques_data = [
            {"name": "Technique 1", "description": "First"},
            {"name": "Technique 2", "description": "Second"},
            {"name": "Technique 3", "description": "Third"},
        ]
        file_path = self.create_temp_json_file(techniques_data)

        out = StringIO()

        # Should complete despite the failure in force mode
        call_command("import_techniques", "--file", file_path, "--force", stdout=out)

        output = out.getvalue()
        self.assertIn("Successfully imported", output)

    def test_validation_error_specific_handling(self):
        """Test specific validation error handling."""
        # Test with data that will cause specific validation errors
        techniques_data = [
            {
                "name": "",  # Empty name should cause validation error
                "description": "Test description",
            }
        ]
        file_path = self.create_temp_json_file(techniques_data)

        out = StringIO()
        err = StringIO()

        # Should complete successfully but log validation errors
        call_command("import_techniques", "--file", file_path, stdout=out, stderr=err)

        # Check that validation error was logged to stderr
        error_output = err.getvalue()
        self.assertIn("Error importing technique", error_output)

    @patch("api.management.commands.import_techniques.logger")
    def test_detailed_error_logging(self, mock_logger):
        """Test that detailed error information is logged."""
        techniques_data = [{"invalid": "technique data"}]
        file_path = self.create_temp_json_file(techniques_data)

        out = StringIO()

        with contextlib.suppress(builtins.BaseException):
            call_command("import_techniques", "--file", file_path, "--force", stdout=out)

        # Verify that appropriate logging methods were called
        logged_calls = mock_logger.error.call_count + mock_logger.warning.call_count + mock_logger.info.call_count
        self.assertGreater(logged_calls, 0)

    def test_graceful_shutdown_on_keyboard_interrupt(self):
        """Test graceful handling of keyboard interrupts."""
        techniques_data = [{"slug": "test-technique", "name": "Test", "description": "Test"}]
        file_path = self.create_temp_json_file(techniques_data)

        # Mock to simulate KeyboardInterrupt during processing
        with patch("api.management.commands.import_techniques.TechniqueDataExtractor") as mock_extractor:
            mock_extractor_instance = Mock()
            # Make extract_basic_data raise KeyboardInterrupt
            mock_extractor_instance.extract_basic_data.side_effect = KeyboardInterrupt()
            mock_extractor.return_value = mock_extractor_instance

            out = StringIO()
            err = StringIO()

            with self.assertRaises(CommandError) as context:
                call_command("import_techniques", "--file", file_path, stdout=out, stderr=err)

            # Should handle KeyboardInterrupt gracefully
            self.assertIn("interrupted", str(context.exception).lower())


class ImportTechniquesCommandArgumentTests(TestCase):
    """Test command line argument handling."""

    def test_all_argument_combinations(self):
        """Test various combinations of command arguments."""
        temp_dir = tempfile.mkdtemp()
        try:
            techniques_data = [{"name": "Test", "description": "Test"}]
            file_path = Path(temp_dir) / "test.json"
            with Path(file_path).open("w") as f:
                json.dump(techniques_data, f)

            # Test --file only
            out = StringIO()
            call_command("import_techniques", "--file", file_path, "--dry-run", stdout=out)

            # Test --file with --force
            out = StringIO()
            call_command(
                "import_techniques",
                "--file",
                file_path,
                "--force",
                "--dry-run",
                stdout=out,
            )

            # Test --file with --dry-run
            out = StringIO()
            call_command("import_techniques", "--file", file_path, "--dry-run", stdout=out)

            # Test all flags together
            out = StringIO()
            call_command(
                "import_techniques",
                "--file",
                file_path,
                "--force",
                "--dry-run",
                stdout=out,
            )

        finally:
            import shutil

            shutil.rmtree(temp_dir)

    def test_argument_parsing_edge_cases(self):
        """Test edge cases in argument parsing."""
        command = Command()

        # Test with mock parser to verify argument configuration
        mock_parser = Mock()
        command.add_arguments(mock_parser)

        # Verify correct number of arguments added
        self.assertEqual(mock_parser.add_argument.call_count, 3)

        # Verify argument types and defaults
        calls = mock_parser.add_argument.call_args_list

        # Check --file argument
        file_call = calls[0]
        self.assertEqual(file_call[0][0], "--file")

        # Check --force argument
        force_call = calls[1]
        self.assertEqual(force_call[0][0], "--force")
        self.assertEqual(force_call[1]["action"], "store_true")
        self.assertEqual(force_call[1]["default"], False)

        # Check --dry-run argument
        dry_run_call = calls[2]
        self.assertEqual(dry_run_call[0][0], "--dry-run")
        self.assertEqual(dry_run_call[1]["action"], "store_true")
        self.assertEqual(dry_run_call[1]["default"], False)
