from __future__ import annotations

import json
import logging
import os
from argparse import ArgumentParser
from pathlib import Path
from typing import Any

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from api.models import (
    AssuranceGoal,
    ResourceType,
    Tag,
    Technique,
    TechniqueExampleUseCase,
    TechniqueLimitation,
    TechniqueResource,
)
from api.utils import DataValidationError, TechniqueDataExtractor, TechniqueDataValidator

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
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Validate the file without actually importing data",
        )

    def handle(self, *args: Any, **options: dict[str, Any]) -> None:
        file_path_option = options.get("file")
        self.force = options.get("force", False)
        self.dry_run = options.get("dry_run", False)

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
            error_msg = f"File not found: {file_path}"
            logger.error(error_msg)
            raise CommandError(error_msg)

        if self.dry_run:
            logger.info(f"Dry run: Validating techniques from {file_path}")
            self.stdout.write(self.style.SUCCESS(f"Dry run: Validating techniques from {file_path}"))
        else:
            logger.info(f"Importing techniques from {file_path}")
            self.stdout.write(self.style.SUCCESS(f"Importing techniques from {file_path}"))

        if self.force:
            logger.info("Force mode enabled: Will continue processing despite errors")
            self.stdout.write(self.style.WARNING("Force mode enabled: Will continue processing despite errors"))

        # Create initial records needed for import (skip in dry run mode)
        if not self.dry_run:
            self._create_base_records()

        # Process the JSON file
        try:
            with open(file_path, encoding="utf-8") as json_file:
                techniques_data = json.load(json_file)
        except json.JSONDecodeError as e:
            error_msg = f"Invalid JSON in file {file_path}: {e!s}"
            logger.error(error_msg)
            raise CommandError(error_msg)

        # Validate that techniques_data is a list
        if not isinstance(techniques_data, list):
            error_msg = f"JSON file must contain a list of techniques, got {type(techniques_data).__name__}"
            logger.error(error_msg)
            raise CommandError(error_msg)

        try:
            if self.dry_run:
                # In dry run mode, just validate the data without saving
                count = 0
                for technique_data in techniques_data:
                    self._validate_technique(technique_data)
                    count += 1

                logger.info(f"Dry run: Successfully validated {count} techniques")
                self.stdout.write(self.style.SUCCESS(f"Dry run: Successfully validated {count} techniques"))
            else:
                # Use a transaction to ensure data consistency
                with transaction.atomic():
                    count = 0
                    self._related_techniques_to_process = {}

                    # First pass: import all techniques
                    for technique_data in techniques_data:
                        technique = self._process_technique(technique_data)
                        count += 1

                    # Second pass: process related techniques using slug mapping
                    for (
                        technique_slug,
                        related_slugs,
                    ) in self._related_techniques_to_process.items():
                        try:
                            technique = Technique.objects.get(slug=technique_slug)
                            self._process_related_techniques(technique, related_slugs)
                        except Technique.DoesNotExist:
                            logger.warning(f"Technique {technique_slug} not found for related techniques processing")

                logger.info(f"Successfully imported {count} techniques")
                self.stdout.write(self.style.SUCCESS(f"Successfully imported {count} techniques"))
        except KeyboardInterrupt:
            error_msg = "Import process was interrupted by user"
            logger.error(error_msg)
            self.stdout.write(self.style.ERROR(error_msg))
            raise CommandError(error_msg)
        except Exception as e:
            logger.error(f"Error processing JSON file: {e!s}")
            self.stdout.write(self.style.ERROR(f"Error processing JSON file: {e!s}"))
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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.data_extractor = TechniqueDataExtractor()
        self.validator = TechniqueDataValidator()

    def _process_tags(self, technique: Technique, tags_data: list) -> None:
        """Process tags for a technique."""
        for tag_name in tags_data:
            tag, _ = Tag.objects.get_or_create(name=tag_name)
            technique.tags.add(tag)

    def _process_related_techniques(self, technique: Technique, related_slugs: list) -> None:
        """Process related techniques after all techniques are imported."""
        for related_slug in related_slugs:
            try:
                related_technique = Technique.objects.get(slug=related_slug)
                technique.related_techniques.add(related_technique)
            except Technique.DoesNotExist:
                logger.warning(f"Related technique {related_slug} not found")

    def _process_technique(self, data: dict[str, Any]) -> Technique | None:
        """Process a single technique from JSON data using refactored approach."""
        try:
            # Validate required fields
            if not self.validator.validate_required_fields(data, force=self.force):
                return None

            # Extract data using utility classes
            basic_data = self.data_extractor.extract_basic_data(data)
            relationship_data = self.data_extractor.extract_relationship_data(data)
            nested_data = self.data_extractor.extract_nested_data(data)

            # Validate ratings
            if not self.validator.validate_ratings(data):
                logger.warning(f"Invalid ratings for technique {basic_data['name']}")
                if not self.force:
                    return None

            # Create or update the technique
            technique = self._create_or_update_technique(basic_data)

            # Process relationships
            self._process_assurance_goals(technique, relationship_data["assurance_goals"])
            self._process_tags(technique, relationship_data["tags"])
            self._store_related_techniques(technique, relationship_data["related_techniques"])

            # Process nested objects
            self._process_resources(technique, nested_data["resources"])
            self._process_use_cases(
                technique,
                nested_data["example_use_cases"],
                relationship_data["assurance_goals"],
            )
            self._process_limitations(technique, nested_data["limitations"])

            status = "Updated" if hasattr(technique, "_created") and not technique._created else "Created"
            logger.info(f"{status} technique: {basic_data['name']}")
            self.stdout.write(self.style.SUCCESS(f"{status} technique: {basic_data['name']}"))

            return technique

        except DataValidationError as e:
            error_msg = f"Error importing technique {data.get('name', 'Unknown')}: {e!s}"
            logger.warning(f"Validation error for technique {data.get('name', 'Unknown')}: {e!s}")
            self.stderr.write(self.style.ERROR(error_msg))
            if not self.force:
                return None
            return self._handle_incomplete_technique(data)
        except Exception as e:
            error_msg = f"Error processing technique {data.get('name', 'Unknown')}: {e!s}"
            logger.error(error_msg)
            self.stdout.write(self.style.ERROR(error_msg))
            if not self.force:
                raise CommandError(error_msg)
            return None

    def _validate_technique(self, data: dict[str, Any]) -> bool:
        """Validate a technique without saving to database (for dry run mode)."""
        try:
            # Validate required fields
            if not self.validator.validate_required_fields(data, force=self.force):
                return False

            # Extract data using utility classes
            basic_data = self.data_extractor.extract_basic_data(data)
            nested_data = self.data_extractor.extract_nested_data(data)

            # Validate ratings
            if not self.validator.validate_ratings(data):
                logger.warning(f"Invalid ratings for technique {basic_data['name']}")
                if not self.force:
                    return False

            # Validate nested data
            for resource_data in nested_data["resources"]:
                processed_resource = self.data_extractor.process_resource_data(resource_data)
                if not self.validator.validate_resource_data(processed_resource):
                    logger.warning(f"Invalid resource data for technique {basic_data['name']}")
                    if not self.force:
                        return False

            logger.info(f"Validated technique: {basic_data['name']}")
            self.stdout.write(self.style.SUCCESS(f"Validated technique: {basic_data['name']}"))

            return True

        except DataValidationError as e:
            error_msg = f"Validation error for technique {data.get('name', 'Unknown')}: {e!s}"
            logger.warning(error_msg)
            if not self.force:
                return False
            return self.force
        except Exception as e:
            error_msg = f"Error validating technique {data.get('name', 'Unknown')}: {e!s}"
            logger.error(error_msg)
            self.stdout.write(self.style.ERROR(error_msg))
            if not self.force:
                raise CommandError(error_msg)
            return False

    def _create_or_update_technique(self, basic_data: dict[str, Any]) -> Technique:
        """Create or update a technique with basic data."""
        technique, created = Technique.objects.update_or_create(
            slug=basic_data["slug"],
            defaults={
                "name": basic_data["name"],
                "acronym": basic_data.get("acronym"),
                "description": basic_data["description"],
                "complexity_rating": basic_data["complexity_rating"],
                "computational_cost_rating": basic_data["computational_cost_rating"],
            },
        )

        # Store creation status for logging
        technique._created = created

        # If updating, clear existing relationships
        if not created:
            self._clear_existing_relationships(technique)

        return technique

    def _clear_existing_relationships(self, technique: Technique) -> None:
        """Clear all existing relationships for a technique being updated."""
        technique.assurance_goals.clear()
        technique.tags.clear()
        technique.related_techniques.clear()
        TechniqueResource.objects.filter(technique=technique).delete()
        TechniqueExampleUseCase.objects.filter(technique=technique).delete()
        TechniqueLimitation.objects.filter(technique=technique).delete()

    def _process_assurance_goals(self, technique: Technique, goals_list: list[str]) -> None:
        """Process assurance goals for a technique."""
        for goal_name in goals_list:
            try:
                goal = AssuranceGoal.objects.get(name=goal_name)
                technique.assurance_goals.add(goal)
            except AssuranceGoal.DoesNotExist:
                logger.warning(f"AssuranceGoal '{goal_name}' not found for technique '{technique.name}'")
                self.stderr.write(self.style.WARNING(f"AssuranceGoal not found: {goal_name}"))

    def _store_related_techniques(self, technique: Technique, related_slugs: list[Any]) -> None:
        """Store related technique slugs for later processing."""
        if not hasattr(self, "_related_techniques_to_process"):
            self._related_techniques_to_process = {}
        self._related_techniques_to_process[technique.slug] = related_slugs

    def _process_resources(self, technique: Technique, resources_data: list[dict[str, Any]]) -> None:
        """Process resources for a technique using utility classes."""
        for resource_data in resources_data:
            processed_resource = self.data_extractor.process_resource_data(resource_data)

            if not self.validator.validate_resource_data(processed_resource):
                logger.warning(f"Invalid resource data for technique {technique.name}")
                continue

            self._create_resource(technique, processed_resource)

    def _create_resource(self, technique: Technique, resource_data: dict[str, Any]) -> None:
        """Create a single resource for a technique."""
        # Check if resource type exists
        try:
            resource_type = ResourceType.objects.get(name=resource_data["type"])
        except ResourceType.DoesNotExist:
            logger.warning(
                f"ResourceType '{resource_data['type']}' not found for technique '{technique.name}', skipping resource"
            )
            self.stderr.write(self.style.WARNING(f"ResourceType not found: {resource_data['type']}"))
            return

        TechniqueResource.objects.create(
            technique=technique,
            resource_type=resource_type,
            url=resource_data["url"],
            title=resource_data["title"],
            description=resource_data["description"],
            authors=resource_data["authors"],
            publication_date=resource_data["parsed_publication_date"],
            source_type=resource_data["source_type"],
        )

    def _process_use_cases(
        self,
        technique: Technique,
        use_cases_data: list[dict[str, Any]],
        default_goals: list[str],
    ) -> None:
        """Process use cases for a technique using utility classes."""
        default_goal = default_goals[0] if default_goals else None

        for use_case_data in use_cases_data:
            processed_use_case = self.data_extractor.process_use_case_data(use_case_data, default_goal)

            if not processed_use_case["description"]:
                continue

            self._create_use_case(technique, processed_use_case)

    def _create_use_case(self, technique: Technique, use_case_data: dict[str, Any]) -> None:
        """Create a single use case for a technique."""
        try:
            goal = None
            if use_case_data["goal_name"]:
                goal, _ = AssuranceGoal.objects.get_or_create(
                    name=use_case_data["goal_name"],
                    defaults={"description": f"{use_case_data['goal_name']} techniques for trustworthy AI"},
                )

            TechniqueExampleUseCase.objects.create(
                technique=technique,
                description=use_case_data["description"],
                assurance_goal=goal,
            )
        except Exception as e:
            logger.warning(f"Error creating use case for {technique.name}: {e}")
            if not self.force:
                raise

    def _process_limitations(self, technique: Technique, limitations_data: list[Any]) -> None:
        """Process limitations for a technique using utility classes."""
        processed_limitations = self.data_extractor.process_limitation_data(limitations_data)

        for description in processed_limitations:
            TechniqueLimitation.objects.create(technique=technique, description=description)

    def _handle_incomplete_technique(self, data: dict[str, Any]) -> Technique | None:
        """Handle techniques with incomplete data when force flag is enabled."""
        logger.info("Force flag enabled, attempting to create technique with incomplete data")

        # Provide minimal defaults
        name = data.get("name", "Unknown Technique")
        description = data.get("description", "No description provided")

        technique, created = Technique.objects.update_or_create(name=name, defaults={"description": description})

        return technique
