# backend/api/management/commands/import_techniques.py
import csv
import json
import os
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings

from api.models import (
    AssuranceGoal,
    Category,
    SubCategory,
    Tag,
    AttributeType,
    AttributeValue,
    ResourceType,
    Technique,
    TechniqueResource,
    TechniqueExampleUseCase,
    TechniqueLimitation,
)


class Command(BaseCommand):
    help = "Import techniques from CSV file"

    def add_arguments(self, parser):
        parser.add_argument("--file", type=str, help="Path to the CSV file")
        parser.add_argument(
            "--use-sqlite",
            action="store_true",
            default=False,
            help="Use SQLite database instead of PostgreSQL",
        )

    def handle(self, *args, **options):
        file_path = options.get("file")
        use_sqlite = options.get("use_sqlite", False)

        # Configure SQLite if specified
        if use_sqlite:
            os.environ["USE_SQLITE"] = "True"
            # Force Django to use SQLite
            BASE_DIR = Path(settings.BASE_DIR)
            settings.DATABASES["default"] = {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": os.path.join(BASE_DIR, "db.sqlite3"),
            }
            from django.db import connections

            connections.close_all()
            self.stdout.write(self.style.SUCCESS("Using SQLite database"))

        # Get the file path
        if not file_path:
            BASE_DIR = Path(settings.BASE_DIR)
            file_path = os.path.join(
                BASE_DIR,
                "data",
                "techniques_v3.csv",  # Updated to use v3 by default
            )

        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f"File not found: {file_path}"))
            return

        self.stdout.write(self.style.SUCCESS(f"Importing techniques from {file_path}"))

        # Create initial records needed for import
        self._create_base_records()

        # Process the CSV file
        with open(file_path, "r", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)

            # Use a transaction to ensure data consistency
            with transaction.atomic():
                count = 0
                for row in reader:
                    self._process_technique(row)
                    count += 1

        self.stdout.write(
            self.style.SUCCESS(f"Successfully imported {count} techniques")
        )

    def _create_base_records(self):
        """Create necessary base records (goals, attributes, etc.)"""
        # Create assurance goals if they don't exist
        goal_names = ["Explainability", "Fairness"]
        for goal_name in goal_names:
            AssuranceGoal.objects.get_or_create(
                name=goal_name,
                defaults={"description": f"{goal_name} techniques for trustworthy AI"},
            )

        # Create attribute types for common fields in the CSV
        attribute_types = [
            "Scope",
            "Data Type",
            "Model Type",
            "Programming Language",
            "Fairness Approach",
            "Project Lifecycle Stage",
        ]
        for attr_type in attribute_types:
            AttributeType.objects.get_or_create(
                name=attr_type,
                defaults={"description": f"The {attr_type.lower()} of the technique"},
            )

        # Create resource types for the CSV
        resource_types = [
            "Technical Paper",
            "Review Paper",
            "Introductory Paper",
            "Paper",
            "GitHub",
            "Documentation",
            "Website",
            "Tutorial",
            "API",
            "Library",
            "Article",
            "Book",
            "Survey",
            "Blog",
            "Tool",
            "Law/Policy",
            "Principle",
            "Explanation",
            "Software Package",
        ]
        for resource_type in resource_types:
            ResourceType.objects.get_or_create(
                name=resource_type,
                defaults={"icon": resource_type.lower().replace(" ", "_")},
            )

    def _parse_category_tags(self, category_tags):
        """Parse category tags from #category/subcategory format."""
        if not category_tags:
            return []

        results = []
        tags = category_tags.split("#")

        for tag in tags:
            tag = tag.strip()
            if not tag:
                continue

            if "/" in tag:
                category_name, subcategory_name = tag.split("/", 1)
                results.append(
                    {
                        "category": category_name.strip(),
                        "subcategory": subcategory_name.strip(),
                    }
                )
            else:
                results.append({"category": tag.strip(), "subcategory": None})

        return results

    def _process_technique(self, row):
        """Process a single technique row from the CSV"""
        try:
            # Extract basic data from the row
            name = row.get("name", "")
            description = row.get("description", "")
            model_dependency = row.get("model_dependency", "Model-Agnostic")
            assurance_goals_name = row.get("assurance_goals", "")
            category_tags = row.get("category_tags", "")
            complexity_rating = row.get("complexity_rating")
            computational_cost_rating = row.get("computational_cost_rating")

            # Process the applicable_models field for model-specific techniques
            applicable_models = row.get("applicable_models", None)
            applicable_models_list = []

            if applicable_models and model_dependency == "Model-Specific":
                try:
                    # Try to parse as JSON
                    if isinstance(applicable_models, str):
                        if applicable_models.startswith(
                            "["
                        ) and applicable_models.endswith("]"):
                            # Process as a list string
                            clean_str = applicable_models.strip("[]")
                            applicable_models_list = [
                                item.strip(" \"'")
                                for item in clean_str.split(",")
                                if item.strip()
                            ]
                        else:
                            # If it's not in list format, try JSON parsing
                            applicable_models_list = json.loads(applicable_models)
                except (json.JSONDecodeError, Exception) as e:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Error parsing applicable_models for {name}: {e}"
                        )
                    )
                    applicable_models_list = []

            # Skip if essential data is missing
            if not name or not description:
                self.stdout.write(
                    self.style.WARNING(f"Skipping row with missing name or description")
                )
                return

            # Parse JSON fields
            try:
                attributes_data = (
                    json.loads(row.get("attributes", "[]"))
                    if row.get("attributes")
                    else []
                )
                example_use_cases_data = (
                    json.loads(row.get("example_use_cases", "[]"))
                    if row.get("example_use_cases")
                    else []
                )
                resources_data = (
                    json.loads(row.get("resources", "[]"))
                    if row.get("resources")
                    else []
                )
                limitations_data = (
                    row.get("limitations", "").split("|")
                    if row.get("limitations")
                    else []
                )
            except json.JSONDecodeError as e:
                self.stdout.write(
                    self.style.ERROR(f"JSON parsing error for {name}: {e}")
                )
                return

            # Create or update the technique
            technique, created = Technique.objects.update_or_create(
                name=name,
                defaults={
                    "description": description,
                    "model_dependency": model_dependency,
                    "category_tags": category_tags,
                    "complexity_rating": (
                        int(complexity_rating)
                        if complexity_rating and complexity_rating.isdigit()
                        else None
                    ),
                    "computational_cost_rating": (
                        int(computational_cost_rating)
                        if computational_cost_rating
                        and computational_cost_rating.isdigit()
                        else None
                    ),
                    "applicable_models": (
                        applicable_models_list if applicable_models_list else None
                    ),
                },
            )

            # Clear existing relationships if updating
            if not created:
                # Clear M2M relationships
                technique.assurance_goals.clear()
                technique.categories.clear()
                technique.subcategories.clear()
                technique.tags.clear()

                # Delete related objects
                AttributeValue.objects.filter(technique=technique).delete()
                TechniqueResource.objects.filter(technique=technique).delete()
                TechniqueExampleUseCase.objects.filter(technique=technique).delete()
                TechniqueLimitation.objects.filter(technique=technique).delete()

            # Process assurance goals
            goal_names = []
            if assurance_goals_name:
                if "," in assurance_goals_name:
                    goal_names = [
                        name.strip() for name in assurance_goals_name.split(",")
                    ]
                else:
                    goal_names = [assurance_goals_name.strip()]

                for goal_name in goal_names:
                    goal, _ = AssuranceGoal.objects.get_or_create(
                        name=goal_name,
                        defaults={
                            "description": f"{goal_name} techniques for trustworthy AI"
                        },
                    )
                    technique.assurance_goals.add(goal)

            # Process category_tags
            if category_tags:
                parsed_categories = self._parse_category_tags(category_tags)

                for cat_data in parsed_categories:
                    cat_name = cat_data.get("category")
                    subcat_name = cat_data.get("subcategory")

                    # Use first available assurance goal, or default to Explainability
                    goal_name = goal_names[0] if goal_names else "Explainability"

                    goal, _ = AssuranceGoal.objects.get_or_create(
                        name=goal_name,
                        defaults={
                            "description": f"{goal_name} techniques for trustworthy AI"
                        },
                    )

                    # Get or create category
                    category, _ = Category.objects.get_or_create(
                        name=cat_name,
                        assurance_goal=goal,
                        defaults={"description": f"Category for {cat_name}"},
                    )

                    # Add category to technique
                    technique.categories.add(category)

                    # Process subcategory if present
                    if subcat_name:
                        subcategory, _ = SubCategory.objects.get_or_create(
                            name=subcat_name,
                            category=category,
                            defaults={"description": f"Subcategory for {subcat_name}"},
                        )

                        # Add subcategory to technique
                        technique.subcategories.add(subcategory)

            # Process attributes
            for attr_data in attributes_data:
                attr_type_name = attr_data.get("type")
                attr_value_name = attr_data.get("value")

                if not attr_type_name or not attr_value_name:
                    continue

                # Get or create attribute type
                attr_type, _ = AttributeType.objects.get_or_create(
                    name=attr_type_name,
                    defaults={
                        "description": f"The {attr_type_name.lower()} of the technique"
                    },
                )

                # Create attribute value directly related to technique
                AttributeValue.objects.create(
                    attribute_type=attr_type,
                    name=attr_value_name,
                    description=f"{attr_value_name} {attr_type_name.lower()}",
                    technique=technique,
                )

            # Process example use cases
            for use_case_data in example_use_cases_data:
                use_case_desc = use_case_data.get("description")
                use_case_goal_name = use_case_data.get("goal", assurance_goals_name)

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
                    self.stdout.write(
                        self.style.WARNING(f"Error creating use case for {name}: {e}")
                    )

            # Process limitations
            for limitation in limitations_data:
                if limitation.strip():
                    TechniqueLimitation.objects.create(
                        technique=technique, description=limitation.strip()
                    )

            # Process resources with enhanced support for authors and publication dates
            for resource_data in resources_data:
                if not isinstance(resource_data, dict):
                    continue

                resource_type_name = resource_data.get("type", "Website")
                resource_title = resource_data.get("title", "Resource")
                resource_url = resource_data.get("url", "")
                resource_desc = resource_data.get("description", "")

                # Get author information if available
                resource_authors = resource_data.get("authors", [])
                resource_publication_date = resource_data.get("publication_date", "")

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

                # Create resource with enhanced information
                TechniqueResource.objects.create(
                    technique=technique,
                    resource_type=resource_type,
                    url=resource_url,
                    title=resource_title,
                    description=resource_desc,
                    authors=resource_authors,
                    publication_date=resource_publication_date,
                )

            status = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f"{status} technique: {name}"))

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    f'Error processing technique {row.get("name", "Unknown")}: {str(e)}'
                )
            )
