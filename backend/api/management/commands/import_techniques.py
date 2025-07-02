# backend/api/management/commands/import_techniques.py
from __future__ import annotations

import json
import os
from pathlib import Path
import logging
import datetime
import re
from typing import Any, Dict, Optional
from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings
from argparse import ArgumentParser

from api.models import (
    AssuranceGoal,
    Tag,
    ResourceType,
    Technique,
    TechniqueResource,
    TechniqueExampleUseCase,
    TechniqueLimitation,
)

# Set up logger
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Import techniques from JSON file"

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument("--file", type=str, help="Path to the JSON file")
        parser.add_argument(
            "--force",
            action="store_true",
            default=False,
            help="Force import even if errors occur",
        )

    def handle(self, *args: Any, **options: Dict[str, Any]) -> None:
        file_path_option = options.get("file")
        self.force = options.get("force", False)

        # Get the file path
        if not file_path_option:
            BASE_DIR = Path(settings.BASE_DIR)
            file_path = os.path.join(
                BASE_DIR,
                "data",
                "techniques.json",
            )
        else:
            file_path = str(file_path_option)

        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            self.stdout.write(self.style.ERROR(f"File not found: {file_path}"))
            return

        logger.info(f"Importing techniques from {file_path}")
        self.stdout.write(self.style.SUCCESS(f"Importing techniques from {file_path}"))

        # Create initial records needed for import
        self._create_base_records()

        # Process the JSON file
        try:
            with open(file_path, "r", encoding="utf-8") as json_file:
                techniques_data = json.load(json_file)
        except json.JSONDecodeError as e:
            error_msg = f"Invalid JSON in file {file_path}: {str(e)}"
            logger.error(error_msg)
            self.stdout.write(self.style.ERROR(f"Error processing JSON file: {str(e)}"))
            if not self.force:
                return
            else:
                logger.info("Force flag enabled, but cannot continue with invalid JSON")
                return

        try:
            # Use a transaction to ensure data consistency
            with transaction.atomic():
                count = 0
                self._related_techniques_to_process = {}
                self._json_id_to_db_id = {}  # Map JSON IDs to database IDs
                
                # First pass: import all techniques and build ID mapping
                for technique_data in techniques_data:
                    json_id = technique_data.get("id")
                    technique = self._process_technique(technique_data)
                    if technique and json_id is not None:
                        self._json_id_to_db_id[json_id] = technique.id
                    count += 1
                
                # Second pass: process related techniques using ID mapping
                for technique_id, related_json_ids in self._related_techniques_to_process.items():
                    try:
                        technique = Technique.objects.get(id=technique_id)
                        # Convert JSON IDs to database IDs
                        related_db_ids = []
                        for json_id in related_json_ids:
                            if json_id in self._json_id_to_db_id:
                                related_db_ids.append(self._json_id_to_db_id[json_id])
                            else:
                                logger.warning(f"Related technique with JSON ID {json_id} not found in mapping")
                        self._process_related_techniques(technique, related_db_ids)
                    except Technique.DoesNotExist:
                        logger.warning(f"Technique {technique_id} not found for related techniques processing")

            logger.info(f"Successfully imported {count} techniques")
            self.stdout.write(
                self.style.SUCCESS(f"Successfully imported {count} techniques")
            )
        except Exception as e:
            logger.error(f"Error processing JSON file: {str(e)}")
            self.stdout.write(self.style.ERROR(f"Error processing JSON file: {str(e)}"))
            if not self.force:
                raise

    def _create_base_records(self) -> None:
        """Create necessary base records (goals, attributes, etc.)"""
        # Create assurance goals if they don't exist
        goal_names = [
            "Explainability",
            "Fairness",
            "Privacy",
            "Reliability",
            "Safety",
            "Transparency",
        ]
        for goal_name in goal_names:
            AssuranceGoal.objects.get_or_create(
                name=goal_name,
                defaults={"description": f"{goal_name} techniques for trustworthy AI"},
            )


        # Create resource types for the JSON
        resource_types = [
            "Technical Paper",
            "Review Paper",
            "Introductory Paper",
            "Paper",
            "GitHub",
            "Documentation",
            "Tutorial",
            "Book",
            "Survey",
            "Blog",
            "Tool",
            "Law/Policy",
            "Software Package",
        ]
        for resource_type in resource_types:
            ResourceType.objects.get_or_create(
                name=resource_type,
                defaults={"icon": resource_type.lower().replace(" ", "_")},
            )

    def _parse_date(self, date_str: Optional[str]) -> Optional[datetime.date]:
        """Parse a date string into a Python date object."""
        if not date_str or not date_str.strip():
            return None

        date_str = date_str.strip()

        # Try different date formats
        formats = [
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

        for fmt in formats:
            try:
                return datetime.datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue

        # If we couldn't parse the date with any format, just extract the year if possible
        # This handles cases like "Published in 2023" or "2023 (Conference)"
        year_match = re.search(r"20\d{2}|19\d{2}", date_str)
        if year_match:
            year = int(year_match.group(0))
            return datetime.date(year, 1, 1)  # Default to January 1st of the year

        # If all else fails, return None
        logger.warning(f"Could not parse date string: {date_str}")
        return None

    def _process_limitation(self, technique: Technique, limitation: Any) -> None:
        """Process a single limitation and add it to the technique."""
        # Check if the limitation is already a dict/object with description field
        if isinstance(limitation, dict) and "description" in limitation:
            description = limitation["description"].strip()
            if description:
                TechniqueLimitation.objects.create(
                    technique=technique, description=description
                )
        # Check if it's a string
        elif isinstance(limitation, str):
            if limitation.strip().startswith(("[", "{")):
                try:
                    # Try to parse as JSON if it looks like JSON
                    parsed_limitation = json.loads(limitation)

                    # Handle case where the parsed result is an array of limitation objects
                    if isinstance(parsed_limitation, list):
                        for item in parsed_limitation:
                            if isinstance(item, dict) and "description" in item:
                                desc = item["description"].strip()
                                if desc:
                                    TechniqueLimitation.objects.create(
                                        technique=technique, description=desc
                                    )
                            elif isinstance(item, str) and item.strip():
                                TechniqueLimitation.objects.create(
                                    technique=technique, description=item.strip()
                                )
                    # Handle case where the parsed result is a single limitation object
                    elif (
                        isinstance(parsed_limitation, dict)
                        and "description" in parsed_limitation
                    ):
                        desc = parsed_limitation["description"].strip()
                        if desc:
                            TechniqueLimitation.objects.create(
                                technique=technique, description=desc
                            )
                except json.JSONDecodeError:
                    # If parsing fails, treat it as a plain string
                    if limitation.strip():
                        TechniqueLimitation.objects.create(
                            technique=technique, description=limitation.strip()
                        )
            # Handle plain strings
            elif limitation.strip():
                TechniqueLimitation.objects.create(
                    technique=technique, description=limitation.strip()
                )

    def _process_tags(self, technique: Technique, tags_data: list) -> None:
        """Process tags for a technique."""
        for tag_name in tags_data:
            tag, _ = Tag.objects.get_or_create(name=tag_name)
            technique.tags.add(tag)

    def _process_related_techniques(self, technique: Technique, related_ids: list) -> None:
        """Process related techniques after all techniques are imported."""
        for related_id in related_ids:
            try:
                related_technique = Technique.objects.get(id=related_id)
                technique.related_techniques.add(related_technique)
            except Technique.DoesNotExist:
                logger.warning(f"Related technique {related_id} not found")



    def _process_technique(self, data: Dict[str, Any]) -> Optional[Technique]:
        """Process a single technique from JSON data"""
        try:
            # Extract basic data
            name = data.get("name", "")
            description = data.get("description", "")
            assurance_goals_list = data.get("assurance_goals", [])
            complexity_rating = data.get("complexity_rating")
            computational_cost_rating = data.get("computational_cost_rating")
            tags_data = data.get("tags", [])
            related_techniques_ids = data.get("related_techniques", [])

            # Process nested data structures directly from JSON
            example_use_cases_data = data.get("example_use_cases", [])
            resources_data = data.get("resources", [])
            limitations_data = data.get("limitations", [])

            # Skip if essential data is missing, unless force is true
            if not name or not description:
                logger.warning("Skipping technique with missing name or description")
                if not self.force:
                    return
                else:
                    logger.info("Force flag enabled, continuing with incomplete data")

            # Create default values
            defaults = {
                "description": description,
                "complexity_rating": complexity_rating,
                "computational_cost_rating": computational_cost_rating,
            }

            # Create or update the technique
            technique, created = Technique.objects.update_or_create(
                name=name,
                defaults=defaults,
            )

            # If updating, clear existing relationships
            if not created:
                technique.assurance_goals.clear()
                technique.tags.clear()
                technique.related_techniques.clear()
                TechniqueResource.objects.filter(technique=technique).delete()
                TechniqueExampleUseCase.objects.filter(technique=technique).delete()
                TechniqueLimitation.objects.filter(technique=technique).delete()

            # Process assurance goals
            for goal_name in assurance_goals_list:
                goal, _ = AssuranceGoal.objects.get_or_create(
                    name=goal_name,
                    defaults={
                        "description": f"{goal_name} techniques for trustworthy AI"
                    },
                )
                technique.assurance_goals.add(goal)

            # Process tags
            self._process_tags(technique, tags_data)

            # Process related techniques (this will be done in a second pass)
            # Store the IDs for later processing
            if hasattr(self, '_related_techniques_to_process'):
                self._related_techniques_to_process[technique.id] = related_techniques_ids
            else:
                self._related_techniques_to_process = {technique.id: related_techniques_ids}

            # Process example use cases
            for use_case_data in example_use_cases_data:
                use_case_desc = use_case_data.get("description")
                use_case_goal_name = use_case_data.get("goal")

                if not use_case_goal_name and assurance_goals_list:
                    use_case_goal_name = assurance_goals_list[0]

                if not use_case_desc:
                    continue

                # Find the goal
                try:
                    use_case_goal, _ = AssuranceGoal.objects.get_or_create(
                        name=use_case_goal_name,
                        defaults={
                            "description": f"{use_case_goal_name} techniques for trustworthy AI"
                        },
                    )

                    # Create example use case
                    TechniqueExampleUseCase.objects.create(
                        technique=technique,
                        description=use_case_desc,
                        assurance_goal=use_case_goal,
                    )
                except Exception as e:
                    logger.warning(f"Error creating use case for {name}: {e}")
                    if not self.force:
                        raise

            # Process limitations - now using a dedicated helper method
            for limitation in limitations_data:
                self._process_limitation(technique, limitation)

            # Process resources
            for resource_data in resources_data:
                resource_type_name = resource_data.get("type", "Website")
                resource_title = resource_data.get("title", "Resource")
                resource_url = resource_data.get("url", "")
                resource_desc = resource_data.get("description", "")
                resource_authors = resource_data.get("authors", [])
                resource_publication_date = resource_data.get("publication_date", "")
                resource_source_type = resource_data.get(
                    "source_type", resource_type_name
                )

                if not resource_url:
                    continue

                # Get or create resource type
                resource_type, _ = ResourceType.objects.get_or_create(
                    name=resource_type_name,
                    defaults={"icon": resource_type_name.lower().replace(" ", "_")},
                )

                # Convert authors list to comma-separated string if it's a list
                if isinstance(resource_authors, list):
                    resource_authors = ", ".join(resource_authors)

                # Parse the publication date
                parsed_date = self._parse_date(resource_publication_date)

                # Create resource
                TechniqueResource.objects.create(
                    technique=technique,
                    resource_type=resource_type,
                    url=resource_url,
                    title=resource_title,
                    description=resource_desc,
                    authors=resource_authors,
                    publication_date=parsed_date,
                    source_type=resource_source_type,
                )

            status = "Created" if created else "Updated"
            logger.info(f"{status} technique: {name}")
            self.stdout.write(self.style.SUCCESS(f"{status} technique: {name}"))
            
            return technique

        except Exception as e:
            error_msg = (
                f'Error processing technique {data.get("name", "Unknown")}: {str(e)}'
            )
            logger.error(error_msg)
            self.stdout.write(self.style.ERROR(error_msg))
            if not self.force:
                raise
            return None
