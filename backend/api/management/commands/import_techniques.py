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
    AttributeType,
    AttributeValue,
    ResourceType,
    Technique,
    TechniqueAttribute,
    TechniqueExampleUseCase,
    TechniqueLimitation,
    TechniqueResource,
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
                "techniques_v2.csv",
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

        # Create resource types from the CSV
        resource_types = [
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
        ]
        for resource_type in resource_types:
            ResourceType.objects.get_or_create(
                name=resource_type, defaults={"icon": resource_type.lower()}
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

        # Skip if essential data is missing
        if not name or not description:
            self.stdout.write(
                self.style.WARNING(f"Skipping row with missing name or description")
            )
            return

        # Parse JSON fields
        try:
            categories_data = (
                json.loads(row.get("categories", "[]")) if row.get("categories") else []
            )
            subcategories_data = (
                json.loads(row.get("subcategories", "[]"))
                if row.get("subcategories")
                else []
            )
            attributes_data = (
                json.loads(row.get("attributes", "[]")) if row.get("attributes") else []
            )
            example_use_cases_data = (
                json.loads(row.get("example_use_cases", "[]"))
                if row.get("example_use_cases")
                else []
            )
            resources_data = (
                json.loads(row.get("resources", "[]")) if row.get("resources") else []
            )
            limitations_data = (
                row.get("limitations", "").split("|") if row.get("limitations") else []
            )
        except json.JSONDecodeError as e:
            self.stdout.write(self.style.ERROR(f"JSON parsing error for {name}: {e}"))
            return

        # If a technique already exists with this name, we'll update it
        # Otherwise, we'll create a new one
        technique, created = Technique.objects.update_or_create(
            name=name,
            defaults={
                "description": description,
                "model_dependency": model_dependency,
            },
        )

        # Clear existing relationships if updating
        if not created:
            technique.assurance_goals.clear()
            technique.categories.clear()
            technique.subcategories.clear()
            technique.tags.clear()

            # Delete related objects
            TechniqueAttribute.objects.filter(technique=technique).delete()
            TechniqueResource.objects.filter(technique=technique).delete()
            TechniqueExampleUseCase.objects.filter(technique=technique).delete()
            TechniqueLimitation.objects.filter(technique=technique).delete()

        # Process assurance goals (could be a single name or multiple)
        goal_names = []
        if assurance_goals_name:
            if "," in assurance_goals_name:
                goal_names = [name.strip() for name in assurance_goals_name.split(",")]
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

        # Process categories
        for cat_data in categories_data:
            goal_name = cat_data.get("goal", assurance_goals_name)
            cat_name = cat_data.get("category")

            if not cat_name:
                continue

            # Get or create the goal
            goal, _ = AssuranceGoal.objects.get_or_create(
                name=goal_name,
                defaults={"description": f"{goal_name} techniques for trustworthy AI"},
            )

            # Get or create the category
            category, _ = Category.objects.get_or_create(
                name=cat_name,
                assurance_goal=goal,
                defaults={"description": f"Category for {cat_name}"},
            )

            # Add category to technique
            technique.categories.add(category)

        # Process subcategories
        for subcat_data in subcategories_data:
            cat_name = subcat_data.get("category")
            subcat_name = subcat_data.get("subcategory")

            if not cat_name or not subcat_name:
                continue

            # Find the category - we need to search across all assurance goals
            try:
                categories = Category.objects.filter(name=cat_name)
                if categories.exists():
                    category = categories.first()

                    # Get or create subcategory
                    subcategory, _ = SubCategory.objects.get_or_create(
                        name=subcat_name,
                        category=category,
                        defaults={"description": f"Subcategory for {subcat_name}"},
                    )

                    # Add subcategory to technique
                    technique.subcategories.add(subcategory)
            except Category.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f"Category {cat_name} not found for {name}")
                )

        # Process category_tags (new format)
        category_tags = row.get("category_tags", "")
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

            # Get or create attribute value
            attr_value, _ = AttributeValue.objects.get_or_create(
                attribute_type=attr_type,
                name=attr_value_name,
                defaults={"description": f"{attr_value_name} {attr_type_name.lower()}"},
            )

            # Add attribute to technique
            TechniqueAttribute.objects.get_or_create(
                technique=technique, attribute_value=attr_value
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
                TechniqueExampleUseCase.objects.get_or_create(
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
                TechniqueLimitation.objects.get_or_create(
                    technique=technique, description=limitation.strip()
                )

        # Process resources
        for resource_data in resources_data:
            if not isinstance(resource_data, dict):
                continue

            resource_type_name = resource_data.get("type", "Website")
            resource_title = resource_data.get("title", "Resource")
            resource_url = resource_data.get("url", "")
            resource_desc = resource_data.get("description", "")

            if not resource_url:
                continue

            # Get or create resource type
            resource_type, _ = ResourceType.objects.get_or_create(
                name=resource_type_name,
                defaults={"icon": resource_type_name.lower()},
            )

            # Create resource
            TechniqueResource.objects.get_or_create(
                technique=technique,
                resource_type=resource_type,
                url=resource_url,
                defaults={"title": resource_title, "description": resource_desc},
            )

        # Process complexity and computational cost if available
        complexity = row.get("complexity_rating")
        if complexity and complexity.isdigit():
            complexity_type, _ = AttributeType.objects.get_or_create(
                name="Complexity",
                defaults={"description": "The complexity rating of the technique"},
            )
            complexity_value, _ = AttributeValue.objects.get_or_create(
                attribute_type=complexity_type,
                name=complexity,
                defaults={"description": f"Complexity level {complexity}"},
            )
            TechniqueAttribute.objects.get_or_create(
                technique=technique, attribute_value=complexity_value
            )

        cost = row.get("computational_cost_rating")
        if cost and cost.isdigit():
            cost_type, _ = AttributeType.objects.get_or_create(
                name="Computational Cost",
                defaults={
                    "description": "The computational cost rating of the technique"
                },
            )
            cost_value, _ = AttributeValue.objects.get_or_create(
                attribute_type=cost_type,
                name=cost,
                defaults={"description": f"Computational cost level {cost}"},
            )
            TechniqueAttribute.objects.get_or_create(
                technique=technique, attribute_value=cost_value
            )

        status = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{status} technique: {name}"))

    except Exception as e:
        self.stdout.write(
            self.style.ERROR(
                f'Error processing technique {row.get("name", "Unknown")}: {str(e)}'
            )
        )
