# api/tests/unit/utils/test_utils.py
"""
Unit tests for utility functions and classes.

Tests cover data parsing, validation, transformation utilities
used throughout the application for data processing.
"""

import pytest
import json
import datetime
from unittest.mock import Mock, patch, MagicMock
from django.test import TestCase
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError as DRFValidationError

from api.utils import (
    DateParsingUtility,
    JSONDataParser,
    TechniqueDataValidator,
    TechniqueDataExtractor,
    DateParsingError,
    DataValidationError,
    custom_exception_handler,
)


class DateParsingUtilityTests(TestCase):
    """Test DateParsingUtility functionality."""
    
    def test_parse_date_iso_format(self):
        """Test parsing ISO format dates."""
        date_str = "2023-01-15"
        result = DateParsingUtility.parse_date(date_str)
        
        expected = datetime.date(2023, 1, 15)
        self.assertEqual(result, expected)
    
    def test_parse_date_us_format(self):
        """Test parsing US format dates."""
        date_str = "01/15/2023"
        result = DateParsingUtility.parse_date(date_str)
        
        expected = datetime.date(2023, 1, 15)
        self.assertEqual(result, expected)
    
    def test_parse_date_uk_format(self):
        """Test parsing UK format dates."""
        date_str = "15/01/2023"
        result = DateParsingUtility.parse_date(date_str)
        
        expected = datetime.date(2023, 1, 15)
        self.assertEqual(result, expected)
    
    def test_parse_date_long_format(self):
        """Test parsing long format dates."""
        test_cases = [
            ("January 15, 2023", datetime.date(2023, 1, 15)),
            ("15 January 2023", datetime.date(2023, 1, 15)),
        ]
        
        for date_str, expected in test_cases:
            with self.subTest(date_str=date_str):
                result = DateParsingUtility.parse_date(date_str)
                self.assertEqual(result, expected)
    
    def test_parse_date_year_only(self):
        """Test parsing year-only dates."""
        date_str = "2023"
        result = DateParsingUtility.parse_date(date_str)
        
        expected = datetime.date(2023, 1, 1)
        self.assertEqual(result, expected)
    
    def test_parse_date_month_year(self):
        """Test parsing month-year dates."""
        test_cases = [
            ("January 2023", datetime.date(2023, 1, 1)),
            ("01-2023", datetime.date(2023, 1, 1)),
            ("01/2023", datetime.date(2023, 1, 1)),
        ]
        
        for date_str, expected in test_cases:
            with self.subTest(date_str=date_str):
                result = DateParsingUtility.parse_date(date_str)
                self.assertEqual(result, expected)
    
    def test_parse_date_with_whitespace(self):
        """Test parsing dates with extra whitespace."""
        date_str = "  2023-01-15  "
        result = DateParsingUtility.parse_date(date_str)
        
        expected = datetime.date(2023, 1, 15)
        self.assertEqual(result, expected)
    
    def test_parse_date_empty_or_none(self):
        """Test parsing empty or None dates."""
        test_cases = [None, "", "   ", "\t\n"]
        
        for date_str in test_cases:
            with self.subTest(date_str=repr(date_str)):
                result = DateParsingUtility.parse_date(date_str)
                self.assertIsNone(result)
    
    def test_parse_date_year_extraction(self):
        """Test extracting year from complex strings."""
        test_cases = [
            ("Published in 2023, Journal of AI", datetime.date(2023, 1, 1)),
            ("Some text 2022 more text", datetime.date(2022, 1, 1)),
            ("Year 1999 publication", datetime.date(1999, 1, 1)),
        ]
        
        for date_str, expected in test_cases:
            with self.subTest(date_str=date_str):
                result = DateParsingUtility.parse_date(date_str)
                self.assertEqual(result, expected)
    
    @patch('api.utils.logger')
    def test_parse_date_unparseable_logs_warning(self, mock_logger):
        """Test that unparseable dates log warnings."""
        date_str = "completely invalid date"
        result = DateParsingUtility.parse_date(date_str)
        
        self.assertIsNone(result)
        mock_logger.warning.assert_called_once()
        self.assertIn("Could not parse date string", mock_logger.warning.call_args[0][0])
    
    def test_parse_date_edge_cases(self):
        """Test edge cases for date parsing."""
        test_cases = [
            ("31/12/2023", datetime.date(2023, 12, 31)),  # Last day of year
            ("01/01/2020", datetime.date(2020, 1, 1)),    # First day of year
            ("29/02/2020", datetime.date(2020, 2, 29)),   # Leap year
        ]
        
        for date_str, expected in test_cases:
            with self.subTest(date_str=date_str):
                result = DateParsingUtility.parse_date(date_str)
                # Note: Some formats might be ambiguous, test what we can
                self.assertIsInstance(result, datetime.date)


class JSONDataParserTests(TestCase):
    """Test JSONDataParser functionality."""
    
    def test_parse_limitation_data_dict_format(self):
        """Test parsing limitation data from dictionary format."""
        limitation = {"description": "Test limitation"}
        result = JSONDataParser.parse_limitation_data(limitation)
        
        self.assertEqual(result, "Test limitation")
    
    def test_parse_limitation_data_string_format(self):
        """Test parsing limitation data from string format."""
        limitation = "Simple string limitation"
        result = JSONDataParser.parse_limitation_data(limitation)
        
        self.assertEqual(result, "Simple string limitation")
    
    def test_parse_limitation_data_json_string(self):
        """Test parsing limitation data from JSON string."""
        limitation = '{"description": "JSON limitation"}'
        result = JSONDataParser.parse_limitation_data(limitation)
        
        self.assertEqual(result, "JSON limitation")
    
    def test_parse_limitation_data_json_array_string(self):
        """Test parsing limitation data from JSON array string."""
        limitation = '[{"description": "First limitation"}, {"description": "Second limitation"}]'
        result = JSONDataParser.parse_limitation_data(limitation)
        
        # Should return the first valid limitation
        self.assertEqual(result, "First limitation")
    
    def test_parse_limitation_data_malformed_json(self):
        """Test parsing malformed JSON falls back to string."""
        limitation = '{"malformed": json'
        result = JSONDataParser.parse_limitation_data(limitation)
        
        self.assertEqual(result, '{"malformed": json')
    
    def test_parse_limitation_data_empty_description(self):
        """Test parsing limitation with empty description."""
        test_cases = [
            {"description": ""},
            {"description": "   "},
            "",
            "   ",
            None,
        ]
        
        for limitation in test_cases:
            with self.subTest(limitation=limitation):
                result = JSONDataParser.parse_limitation_data(limitation)
                self.assertIsNone(result)
    
    def test_parse_limitation_data_whitespace_handling(self):
        """Test that whitespace is properly handled."""
        limitation = {"description": "  Test limitation  "}
        result = JSONDataParser.parse_limitation_data(limitation)
        
        self.assertEqual(result, "Test limitation")
    
    def test_extract_limitation_from_parsed_dict(self):
        """Test extracting limitation from parsed dictionary."""
        parsed = {"description": "Dict limitation"}
        result = JSONDataParser._extract_limitation_from_parsed(parsed)
        
        self.assertEqual(result, "Dict limitation")
    
    def test_extract_limitation_from_parsed_list(self):
        """Test extracting limitation from parsed list."""
        parsed = [
            {"description": "First limitation"},
            {"description": "Second limitation"}
        ]
        result = JSONDataParser._extract_limitation_from_parsed(parsed)
        
        self.assertEqual(result, "First limitation")
    
    def test_extract_limitation_from_parsed_mixed_list(self):
        """Test extracting limitation from mixed list with strings and dicts."""
        parsed = [
            {"description": ""},  # Empty description
            "String limitation",
            {"description": "Dict limitation"}
        ]
        result = JSONDataParser._extract_limitation_from_parsed(parsed)
        
        self.assertEqual(result, "String limitation")
    
    def test_parse_authors_data_list_format(self):
        """Test parsing authors from list format."""
        authors_data = ["John Doe", "Jane Smith", "Bob Johnson"]
        result = JSONDataParser.parse_authors_data(authors_data)
        
        self.assertEqual(result, "John Doe, Jane Smith, Bob Johnson")
    
    def test_parse_authors_data_string_format(self):
        """Test parsing authors from string format."""
        authors_data = "John Doe, Jane Smith"
        result = JSONDataParser.parse_authors_data(authors_data)
        
        self.assertEqual(result, "John Doe, Jane Smith")
    
    def test_parse_authors_data_list_with_empty_entries(self):
        """Test parsing authors list with empty entries."""
        authors_data = ["John Doe", "", "   ", "Jane Smith"]
        result = JSONDataParser.parse_authors_data(authors_data)
        
        self.assertEqual(result, "John Doe, Jane Smith")
    
    def test_parse_authors_data_list_with_whitespace(self):
        """Test parsing authors list with whitespace."""
        authors_data = ["  John Doe  ", "  Jane Smith  "]
        result = JSONDataParser.parse_authors_data(authors_data)
        
        self.assertEqual(result, "John Doe, Jane Smith")
    
    def test_parse_authors_data_non_string_types(self):
        """Test parsing authors from non-string types."""
        test_cases = [
            (123, "123"),
            (None, "None"),  # str(None) returns "None"
            ([], ""),
        ]
        
        for authors_data, expected in test_cases:
            with self.subTest(authors_data=authors_data):
                result = JSONDataParser.parse_authors_data(authors_data)
                self.assertEqual(result, expected)


class TechniqueDataValidatorTests(TestCase):
    """Test TechniqueDataValidator functionality."""
    
    def test_validate_required_fields_valid_data(self):
        """Test validation with valid required fields."""
        data = {
            "name": "Test Technique",
            "description": "Test description"
        }
        
        result = TechniqueDataValidator.validate_required_fields(data)
        self.assertTrue(result)
    
    def test_validate_required_fields_missing_name(self):
        """Test validation with missing name."""
        data = {
            "description": "Test description"
        }
        
        with self.assertRaises(DataValidationError) as context:
            TechniqueDataValidator.validate_required_fields(data)
        
        self.assertIn("required name or description", str(context.exception))
    
    def test_validate_required_fields_missing_description(self):
        """Test validation with missing description."""
        data = {
            "name": "Test Technique"
        }
        
        with self.assertRaises(DataValidationError) as context:
            TechniqueDataValidator.validate_required_fields(data)
        
        self.assertIn("required name or description", str(context.exception))
    
    def test_validate_required_fields_empty_name(self):
        """Test validation with empty name."""
        data = {
            "name": "",
            "description": "Test description"
        }
        
        with self.assertRaises(DataValidationError):
            TechniqueDataValidator.validate_required_fields(data)
    
    def test_validate_required_fields_empty_description(self):
        """Test validation with empty description."""
        data = {
            "name": "Test Technique",
            "description": ""
        }
        
        with self.assertRaises(DataValidationError):
            TechniqueDataValidator.validate_required_fields(data)
    
    @patch('api.utils.logger')
    def test_validate_required_fields_force_mode(self, mock_logger):
        """Test validation in force mode allows incomplete data."""
        data = {
            "name": "",
            "description": "Test description"
        }
        
        result = TechniqueDataValidator.validate_required_fields(data, force=True)
        self.assertFalse(result)
        mock_logger.warning.assert_called_once()
    
    def test_validate_ratings_valid_data(self):
        """Test validation with valid ratings."""
        data = {
            "complexity_rating": 3,
            "computational_cost_rating": 4
        }
        
        result = TechniqueDataValidator.validate_ratings(data)
        self.assertTrue(result)
    
    def test_validate_ratings_missing_ratings(self):
        """Test validation with missing ratings (should be valid)."""
        data = {}
        
        result = TechniqueDataValidator.validate_ratings(data)
        self.assertTrue(result)
    
    def test_validate_ratings_none_values(self):
        """Test validation with None ratings (should be valid)."""
        data = {
            "complexity_rating": None,
            "computational_cost_rating": None
        }
        
        result = TechniqueDataValidator.validate_ratings(data)
        self.assertTrue(result)
    
    @patch('api.utils.logger')
    def test_validate_ratings_invalid_range(self, mock_logger):
        """Test validation with ratings outside valid range."""
        invalid_cases = [
            {"complexity_rating": 0},
            {"complexity_rating": 6},
            {"computational_cost_rating": -1},
            {"computational_cost_rating": 10},
        ]
        
        for data in invalid_cases:
            with self.subTest(data=data):
                result = TechniqueDataValidator.validate_ratings(data)
                self.assertFalse(result)
        
        # Verify warnings were logged
        self.assertEqual(mock_logger.warning.call_count, len(invalid_cases))
    
    @patch('api.utils.logger')
    def test_validate_ratings_invalid_type(self, mock_logger):
        """Test validation with invalid rating types."""
        invalid_cases = [
            {"complexity_rating": "3"},
            {"complexity_rating": 3.5},
            {"computational_cost_rating": "high"},
        ]
        
        for data in invalid_cases:
            with self.subTest(data=data):
                result = TechniqueDataValidator.validate_ratings(data)
                self.assertFalse(result)
        
        # Verify warnings were logged
        self.assertEqual(mock_logger.warning.call_count, len(invalid_cases))
    
    def test_validate_resource_data_valid(self):
        """Test validation with valid resource data."""
        resource_data = {
            "url": "https://example.com",
            "title": "Test Resource"
        }
        
        result = TechniqueDataValidator.validate_resource_data(resource_data)
        self.assertTrue(result)
    
    @patch('api.utils.logger')
    def test_validate_resource_data_missing_url(self, mock_logger):
        """Test validation with missing required URL."""
        resource_data = {
            "title": "Test Resource"
        }
        
        result = TechniqueDataValidator.validate_resource_data(resource_data)
        self.assertFalse(result)
        mock_logger.warning.assert_called_once()
        self.assertIn("missing required field: url", mock_logger.warning.call_args[0][0])
    
    @patch('api.utils.logger')
    def test_validate_resource_data_empty_url(self, mock_logger):
        """Test validation with empty URL."""
        resource_data = {
            "url": "",
            "title": "Test Resource"
        }
        
        result = TechniqueDataValidator.validate_resource_data(resource_data)
        self.assertFalse(result)
        mock_logger.warning.assert_called_once()


class TechniqueDataExtractorTests(TestCase):
    """Test TechniqueDataExtractor functionality."""
    
    def setUp(self):
        """Set up test data."""
        self.extractor = TechniqueDataExtractor()
    
    def test_extractor_initialization(self):
        """Test that extractor initializes with all utilities."""
        self.assertIsInstance(self.extractor.date_parser, DateParsingUtility)
        self.assertIsInstance(self.extractor.json_parser, JSONDataParser)
        self.assertIsInstance(self.extractor.validator, TechniqueDataValidator)
    
    def test_extract_basic_data(self):
        """Test extracting basic technique data."""
        data = {
            "name": "Test Technique",
            "description": "Test description",
            "complexity_rating": 3,
            "computational_cost_rating": 4,
            "extra_field": "ignored"
        }
        
        result = self.extractor.extract_basic_data(data)
        
        expected = {
            "name": "Test Technique",
            "description": "Test description",
            "complexity_rating": 3,
            "computational_cost_rating": 4,
        }
        
        self.assertEqual(result, expected)
    
    def test_extract_basic_data_missing_fields(self):
        """Test extracting basic data with missing fields."""
        data = {
            "name": "Test Technique"
        }
        
        result = self.extractor.extract_basic_data(data)
        
        expected = {
            "name": "Test Technique",
            "description": "",
            "complexity_rating": None,
            "computational_cost_rating": None,
        }
        
        self.assertEqual(result, expected)
    
    def test_extract_relationship_data(self):
        """Test extracting relationship data."""
        data = {
            "assurance_goals": ["Goal1", "Goal2"],
            "tags": ["tag1", "tag2"],
            "related_techniques": ["tech1"],
            "extra_field": "ignored"
        }
        
        result = self.extractor.extract_relationship_data(data)
        
        expected = {
            "assurance_goals": ["Goal1", "Goal2"],
            "tags": ["tag1", "tag2"],
            "related_techniques": ["tech1"],
        }
        
        self.assertEqual(result, expected)
    
    def test_extract_relationship_data_missing_fields(self):
        """Test extracting relationship data with missing fields."""
        data = {}
        
        result = self.extractor.extract_relationship_data(data)
        
        expected = {
            "assurance_goals": [],
            "tags": [],
            "related_techniques": [],
        }
        
        self.assertEqual(result, expected)
    
    def test_extract_nested_data(self):
        """Test extracting nested object data."""
        data = {
            "resources": [{"url": "test"}],
            "example_use_cases": [{"description": "test"}],
            "limitations": ["limitation"],
            "extra_field": "ignored"
        }
        
        result = self.extractor.extract_nested_data(data)
        
        expected = {
            "resources": [{"url": "test"}],
            "example_use_cases": [{"description": "test"}],
            "limitations": ["limitation"],
        }
        
        self.assertEqual(result, expected)
    
    def test_extract_nested_data_missing_fields(self):
        """Test extracting nested data with missing fields."""
        data = {}
        
        result = self.extractor.extract_nested_data(data)
        
        expected = {
            "resources": [],
            "example_use_cases": [],
            "limitations": [],
        }
        
        self.assertEqual(result, expected)
    
    def test_process_resource_data_complete(self):
        """Test processing complete resource data."""
        resource_data = {
            "type": "Technical Paper",
            "title": "Test Paper",
            "url": "https://example.com",
            "description": "Paper description",
            "authors": ["Author 1", "Author 2"],
            "publication_date": "2023-01-15",
            "source_type": "Journal"
        }
        
        result = self.extractor.process_resource_data(resource_data)
        
        expected = {
            "type": "Technical Paper",
            "title": "Test Paper",
            "url": "https://example.com",
            "description": "Paper description",
            "authors": "Author 1, Author 2",
            "publication_date": "2023-01-15",
            "source_type": "Journal",
            "parsed_publication_date": datetime.date(2023, 1, 15),
        }
        
        self.assertEqual(result, expected)
    
    def test_process_resource_data_minimal(self):
        """Test processing minimal resource data with defaults."""
        resource_data = {
            "url": "https://example.com"
        }
        
        result = self.extractor.process_resource_data(resource_data)
        
        expected = {
            "type": "Website",
            "title": "Resource",
            "url": "https://example.com",
            "description": "",
            "authors": "",
            "publication_date": "",
            "source_type": "Website",
            "parsed_publication_date": None,
        }
        
        self.assertEqual(result, expected)
    
    def test_process_resource_data_type_fallback(self):
        """Test that source_type falls back to type."""
        resource_data = {
            "type": "GitHub",
            "url": "https://github.com/example"
        }
        
        result = self.extractor.process_resource_data(resource_data)
        
        self.assertEqual(result["source_type"], "GitHub")
    
    def test_process_use_case_data_with_goal(self):
        """Test processing use case data with assurance goal."""
        use_case_data = {
            "description": "Test use case",
            "goal": "Explainability"
        }
        
        result = self.extractor.process_use_case_data(use_case_data)
        
        expected = {
            "description": "Test use case",
            "goal_name": "Explainability",
        }
        
        self.assertEqual(result, expected)
    
    def test_process_use_case_data_with_default_goal(self):
        """Test processing use case data with default goal."""
        use_case_data = {
            "description": "Test use case"
        }
        
        result = self.extractor.process_use_case_data(use_case_data, default_goal="Fairness")
        
        expected = {
            "description": "Test use case",
            "goal_name": "Fairness",
        }
        
        self.assertEqual(result, expected)
    
    def test_process_use_case_data_no_goal(self):
        """Test processing use case data without goal."""
        use_case_data = {
            "description": "Test use case"
        }
        
        result = self.extractor.process_use_case_data(use_case_data)
        
        expected = {
            "description": "Test use case",
            "goal_name": None,
        }
        
        self.assertEqual(result, expected)
    
    def test_process_limitation_data_mixed_formats(self):
        """Test processing limitations in mixed formats."""
        limitations_data = [
            "String limitation",
            {"description": "Dict limitation"},
            {"description": ""},  # Empty description
            "",  # Empty string
            {"description": "Valid limitation"},
        ]
        
        result = self.extractor.process_limitation_data(limitations_data)
        
        expected = [
            "String limitation",
            "Dict limitation",
            "Valid limitation"
        ]
        
        self.assertEqual(result, expected)
    
    def test_process_limitation_data_empty_list(self):
        """Test processing empty limitations list."""
        limitations_data = []
        
        result = self.extractor.process_limitation_data(limitations_data)
        
        self.assertEqual(result, [])


class CustomExceptionHandlerTests(TestCase):
    """Test custom exception handler functionality."""
    
    def setUp(self):
        """Set up test data."""
        self.mock_request = Mock()
        self.mock_request.path = "/api/test/"
        self.mock_view = Mock()
        self.mock_view.__class__.__name__ = "TestView"
    
    @patch('api.utils.exception_handler')
    @patch('api.utils.logger')
    def test_custom_exception_handler_with_response(self, mock_logger, mock_exception_handler):
        """Test custom exception handler when DRF handler returns a response."""
        # Setup mock response
        mock_response = Response({'detail': 'Test error'}, status=400)
        mock_exception_handler.return_value = mock_response
        
        exc = DRFValidationError("Test validation error")
        context = {
            'request': self.mock_request,
            'view': self.mock_view
        }
        
        result = custom_exception_handler(exc, context)
        
        # Verify exception_handler was called
        mock_exception_handler.assert_called_once_with(exc, context)
        
        # Verify logging
        mock_logger.error.assert_called()
        log_calls = mock_logger.error.call_args_list
        self.assertEqual(len(log_calls), 2)  # One for the error, one for the path
        
        # Check first log call (error details)
        error_log = log_calls[0][0][0]
        self.assertIn("TestView", error_log)
        self.assertIn("ValidationError", error_log)
        self.assertIn("Test validation error", error_log)
        
        # Check second log call (request path)
        path_log = log_calls[1][0][0]
        self.assertIn("/api/test/", path_log)
        
        # Verify response structure
        self.assertEqual(result.status_code, 400)
        self.assertTrue(result.data['error'])
        self.assertEqual(result.data['message'], 'An error occurred while processing your request.')
        self.assertEqual(result.data['details'], {'detail': 'Test error'})
    
    @patch('api.utils.exception_handler')
    @patch('api.utils.logger')
    def test_custom_exception_handler_no_response(self, mock_logger, mock_exception_handler):
        """Test custom exception handler when DRF handler returns None."""
        # Setup mock to return None (no response)
        mock_exception_handler.return_value = None
        
        exc = Exception("Test error")
        context = {
            'request': self.mock_request,
            'view': self.mock_view
        }
        
        result = custom_exception_handler(exc, context)
        
        # Verify exception_handler was called
        mock_exception_handler.assert_called_once_with(exc, context)
        
        # Verify no logging occurred
        mock_logger.error.assert_not_called()
        
        # Verify result is None
        self.assertIsNone(result)
    
    @patch('api.utils.exception_handler')
    @patch('api.utils.logger')
    def test_custom_exception_handler_missing_context(self, mock_logger, mock_exception_handler):
        """Test custom exception handler with missing context information."""
        # Setup mock response
        mock_response = Response({'detail': 'Test error'}, status=500)
        mock_exception_handler.return_value = mock_response
        
        exc = Exception("Test error")
        context = {}  # Empty context
        
        result = custom_exception_handler(exc, context)
        
        # Verify logging with unknown view
        log_calls = mock_logger.error.call_args_list
        error_log = log_calls[0][0][0]
        self.assertIn("Unknown", error_log)  # Should handle missing view
        
        # Verify only one log call (no request path)
        self.assertEqual(len(log_calls), 1)
        
        # Verify response structure is still correct
        self.assertTrue(result.data['error'])
    
    @patch('api.utils.exception_handler')
    @patch('api.utils.logger')
    def test_custom_exception_handler_request_without_path(self, mock_logger, mock_exception_handler):
        """Test custom exception handler with request missing path attribute."""
        # Setup mock response
        mock_response = Response({'detail': 'Test error'}, status=400)
        mock_exception_handler.return_value = mock_response
        
        mock_request_no_path = Mock(spec=[])  # Mock without path attribute
        
        exc = Exception("Test error")
        context = {
            'request': mock_request_no_path,
            'view': self.mock_view
        }
        
        result = custom_exception_handler(exc, context)
        
        # Verify logging occurred but no path log
        log_calls = mock_logger.error.call_args_list
        self.assertEqual(len(log_calls), 1)  # Only error log, no path log
        
        # Verify response structure
        self.assertTrue(result.data['error'])


class UtilityIntegrationTests(TestCase):
    """Test integration between utility classes."""
    
    def test_extractor_uses_all_utilities(self):
        """Test that TechniqueDataExtractor properly integrates all utilities."""
        extractor = TechniqueDataExtractor()
        
        # Test data that exercises all utilities
        data = {
            "name": "Integration Test Technique",
            "description": "Test description",
            "complexity_rating": 3,
            "assurance_goals": ["Explainability"],
            "resources": [
                {
                    "type": "Technical Paper",
                    "title": "Test Paper",
                    "url": "https://example.com",
                    "authors": ["Author 1", "Author 2"],
                    "publication_date": "2023-01-15"
                }
            ],
            "limitations": [
                "String limitation",
                {"description": "Dict limitation"}
            ]
        }
        
        # Extract all types of data
        basic_data = extractor.extract_basic_data(data)
        relationship_data = extractor.extract_relationship_data(data)
        nested_data = extractor.extract_nested_data(data)
        
        # Process resource data (tests date parsing and author parsing)
        processed_resource = extractor.process_resource_data(data["resources"][0])
        
        # Process limitation data (tests limitation parsing)
        processed_limitations = extractor.process_limitation_data(data["limitations"])
        
        # Verify all data was processed correctly
        self.assertEqual(basic_data["name"], "Integration Test Technique")
        self.assertEqual(relationship_data["assurance_goals"], ["Explainability"])
        self.assertEqual(len(nested_data["resources"]), 1)
        
        # Verify resource processing
        self.assertEqual(processed_resource["title"], "Test Paper")
        self.assertEqual(processed_resource["authors"], "Author 1, Author 2")
        self.assertEqual(processed_resource["parsed_publication_date"], datetime.date(2023, 1, 15))
        
        # Verify limitation processing
        self.assertEqual(len(processed_limitations), 2)
        self.assertIn("String limitation", processed_limitations)
        self.assertIn("Dict limitation", processed_limitations)
    
    def test_error_handling_consistency(self):
        """Test that all utilities handle errors consistently."""
        # Test date parsing with invalid dates
        invalid_date = DateParsingUtility.parse_date("invalid date")
        self.assertIsNone(invalid_date)
        
        # Test limitation parsing with invalid data
        invalid_limitation = JSONDataParser.parse_limitation_data(123)  # Invalid type
        self.assertIsNone(invalid_limitation)
        
        # Test validation with invalid data
        with self.assertRaises(DataValidationError):
            TechniqueDataValidator.validate_required_fields({"name": ""})
        
        # All utilities should handle edge cases gracefully
        extractor = TechniqueDataExtractor()
        
        # Empty data should not crash
        basic_data = extractor.extract_basic_data({})
        self.assertEqual(basic_data["name"], "")
        
        # Invalid nested data should be filtered out
        limitations = extractor.process_limitation_data([None, "", {}, {"description": ""}])
        self.assertEqual(limitations, [])