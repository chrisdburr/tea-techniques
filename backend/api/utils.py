"""
Utility functions and classes for data processing and validation.

This module contains utilities for handling data import, validation,
and transformation operations that are used across the application.
"""

from __future__ import annotations

import datetime
import json
import logging
import re
from typing import Any, Dict, List, Optional, Union

from rest_framework.pagination import PageNumberPagination
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


class CustomPageNumberPagination(PageNumberPagination):
    """Custom pagination class that allows dynamic page size."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class DateParsingError(Exception):
    """Exception raised when date parsing fails."""


class DataValidationError(Exception):
    """Exception raised when data validation fails."""


class DateParsingUtility:
    """Utility class for parsing dates from various string formats."""

    DATE_FORMATS = [
        "%Y-%m-%d",  # 2023-01-15
        "%d/%m/%Y",  # 15/01/2023
        "%m/%d/%Y",  # 01/15/2023
        "%B %d, %Y",  # January 15, 2023
        "%d %B %Y",  # 15 January 2023
        "%Y",  # 2023 (just year)
        "%B %Y",  # January 2023
        "%m-%Y",  # 01-2023
        "%m/%Y",  # 01/2023
    ]

    @classmethod
    def parse_date(cls, date_str: Optional[str]) -> Optional[datetime.date]:
        """
        Parse a date string into a Python date object.

        Args:
            date_str: String representation of a date

        Returns:
            Parsed date or None if parsing fails

        Raises:
            DateParsingError: If date string format is invalid
        """
        if not date_str or not date_str.strip():
            return None

        date_str = date_str.strip()

        # Try different date formats
        for fmt in cls.DATE_FORMATS:
            try:
                return datetime.datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue

        # If we couldn't parse the date with any format, extract year if possible
        year_match = re.search(r"20\d{2}|19\d{2}", date_str)
        if year_match:
            year = int(year_match.group(0))
            return datetime.date(year, 1, 1)  # Default to January 1st

        logger.warning("Could not parse date string: %s", date_str)
        return None


class JSONDataParser:
    """Utility class for parsing and validating JSON data structures."""

    @staticmethod
    def parse_limitation_data(limitation: Any) -> Optional[str]:
        """
        Parse limitation data from various formats.

        Args:
            limitation: Limitation data in various formats

        Returns:
            Parsed limitation description or None if invalid
        """
        # Check if the limitation is already a dict/object with description field
        if isinstance(limitation, dict) and "description" in limitation:
            description = limitation["description"].strip()
            return description if description else None

        # Check if it's a string
        elif isinstance(limitation, str):
            if limitation.strip().startswith(("[", "{")):
                try:
                    # Try to parse as JSON if it looks like JSON
                    parsed_limitation = json.loads(limitation)
                    return JSONDataParser._extract_limitation_from_parsed(
                        parsed_limitation
                    )
                except json.JSONDecodeError:
                    # If parsing fails, treat it as a plain string
                    return limitation.strip() if limitation.strip() else None
            else:
                # Handle plain strings
                return limitation.strip() if limitation.strip() else None

        return None

    @staticmethod
    def _extract_limitation_from_parsed(parsed_limitation: Any) -> Optional[str]:
        """Extract limitation description from parsed JSON data."""
        # Handle case where the parsed result is a single limitation object
        if isinstance(parsed_limitation, dict) and "description" in parsed_limitation:
            desc = parsed_limitation["description"].strip()
            return desc if desc else None

        # Handle case where the parsed result is an array - take first valid item
        elif isinstance(parsed_limitation, list) and parsed_limitation:
            for item in parsed_limitation:
                if isinstance(item, dict) and "description" in item:
                    desc = item["description"].strip()
                    if desc:
                        return desc
                elif isinstance(item, str) and item.strip():
                    return item.strip()

        return None

    @staticmethod
    def parse_authors_data(authors_data: Union[str, List[str]]) -> str:
        """
        Parse authors data from string or list format.

        Args:
            authors_data: Authors in string or list format

        Returns:
            Comma-separated string of authors
        """
        if isinstance(authors_data, list):
            return ", ".join(
                str(author).strip() for author in authors_data if str(author).strip()
            )
        elif isinstance(authors_data, str):
            return authors_data.strip()
        else:
            return str(authors_data).strip()


class TechniqueDataValidator:
    """Validator for technique data integrity and completeness."""

    @staticmethod
    def validate_required_fields(data: Dict[str, Any], force: bool = False) -> bool:
        """
        Validate that required fields are present and valid.

        Args:
            data: Technique data dictionary
            force: Whether to allow incomplete data

        Returns:
            True if validation passes

        Raises:
            DataValidationError: If validation fails and force is False
        """
        name = data.get("name", "")
        description = data.get("description", "")

        if not name or not description:
            error_msg = "Technique missing required name or description"
            logger.warning(error_msg)
            if not force:
                raise DataValidationError(error_msg)
            return False

        return True

    @staticmethod
    def validate_ratings(data: Dict[str, Any]) -> bool:
        """
        Validate complexity and computational cost ratings.

        Args:
            data: Technique data dictionary

        Returns:
            True if ratings are valid
        """
        complexity_rating = data.get("complexity_rating")
        computational_cost_rating = data.get("computational_cost_rating")

        for rating_name, rating_value in [
            ("complexity_rating", complexity_rating),
            ("computational_cost_rating", computational_cost_rating),
        ]:
            if rating_value is not None:
                if not isinstance(rating_value, int) or not 1 <= rating_value <= 5:
                    logger.warning("Invalid %s: %s", rating_name, rating_value)
                    return False

        return True

    @staticmethod
    def validate_resource_data(resource_data: Dict[str, Any]) -> bool:
        """
        Validate resource data structure.

        Args:
            resource_data: Resource data dictionary

        Returns:
            True if resource data is valid
        """
        required_fields = ["url"]
        for field in required_fields:
            if not resource_data.get(field):
                logger.warning("Resource missing required field: %s", field)
                return False

        return True


class TechniqueDataExtractor:
    """Utility class for extracting and transforming technique data."""

    def __init__(self):
        self.date_parser = DateParsingUtility()
        self.json_parser = JSONDataParser()
        self.validator = TechniqueDataValidator()

    def extract_basic_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract basic technique data fields.

        Args:
            data: Raw technique data

        Returns:
            Dictionary with basic technique fields
        """
        return {
            "slug": data.get("slug", ""),
            "name": data.get("name", ""),
            "acronym": data.get("acronym"),
            "description": data.get("description", ""),
            "complexity_rating": data.get("complexity_rating"),
            "computational_cost_rating": data.get("computational_cost_rating"),
        }

    def extract_relationship_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract relationship data (goals, tags, related techniques).

        Args:
            data: Raw technique data

        Returns:
            Dictionary with relationship data
        """
        return {
            "assurance_goals": data.get("assurance_goals", []),
            "tags": data.get("tags", []),
            "related_techniques": data.get("related_techniques", []),
        }

    def extract_nested_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract nested object data (resources, use cases, limitations).

        Args:
            data: Raw technique data

        Returns:
            Dictionary with nested data
        """
        return {
            "resources": data.get("resources", []),
            "example_use_cases": data.get("example_use_cases", []),
            "limitations": data.get("limitations", []),
        }

    def process_resource_data(self, resource_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and clean resource data.

        Args:
            resource_data: Raw resource data

        Returns:
            Processed resource data
        """
        # Map source_type values to ResourceType names
        source_type_mapping = {
            "software_package": "Software Package",
            "technical_paper": "Technical Paper",
            "review_paper": "Review Paper",
            "introductory_paper": "Introductory Paper",
            "paper": "Paper",
            "github": "GitHub",
            "documentation": "Documentation",
            "tutorial": "Tutorial",
            "book": "Book",
            "survey": "Survey",
            "blog": "Blog",
            "tool": "Tool",
            "law_policy": "Law/Policy",
        }

        # Get the source_type from the data (primary field in migrated data)
        raw_source_type = resource_data.get(
            "source_type", resource_data.get("type", "paper")
        )

        # Map to database ResourceType name, defaulting to "Paper" if unmapped
        mapped_type = source_type_mapping.get(raw_source_type.lower(), "Paper")

        processed = {
            "type": mapped_type,
            "title": resource_data.get("title", "Resource"),
            "url": resource_data.get("url", ""),
            "description": resource_data.get("description", ""),
            "authors": self.json_parser.parse_authors_data(
                resource_data.get("authors", [])
            ),
            "publication_date": resource_data.get("publication_date", ""),
            "source_type": raw_source_type,
        }

        # Parse the publication date
        processed["parsed_publication_date"] = self.date_parser.parse_date(
            processed["publication_date"]
        )

        return processed

    def process_use_case_data(
        self, use_case_data: Dict[str, Any], default_goal: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process and clean use case data.

        Args:
            use_case_data: Raw use case data
            default_goal: Default assurance goal if none specified

        Returns:
            Processed use case data
        """
        goal_name = use_case_data.get("goal") or default_goal

        return {
            "description": use_case_data.get("description", ""),
            "goal_name": goal_name,
        }

    def process_limitation_data(self, limitations_data: List[Any]) -> List[str]:
        """
        Process and clean limitations data.

        Args:
            limitations_data: Raw limitations data

        Returns:
            List of processed limitation descriptions
        """
        processed_limitations = []

        for limitation in limitations_data:
            description = self.json_parser.parse_limitation_data(limitation)
            if description:
                processed_limitations.append(description)

        return processed_limitations


def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides more detailed error responses.
    """

    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    if response is not None:
        # Log the error for debugging only when DRF handles it
        view = context.get("view", None)
        request = context.get("request", None)

        logger.error(
            "API Error in %s: %s: %s",
            view.__class__.__name__ if view else 'Unknown',
            exc.__class__.__name__,
            str(exc)
        )

        if hasattr(request, "path"):
            logger.error("Request path: %s", request.path)
        # Customize the error response for DRF-handled exceptions
        custom_response_data = {
            "error": True,
            "message": "An error occurred while processing your request.",
            "details": response.data,
        }

        response.data = custom_response_data

    return response
