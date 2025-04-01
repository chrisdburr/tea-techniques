# backend/api/management/commands/import_techniques.py
import json
import os
from pathlib import Path
import logging
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

# Set up logger
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Import techniques from JSON file"

    def add_arguments(self, parser):
        parser.add_argument("--file", type=str, help="Path to the JSON file")
        parser.add_argument(
            "--force", 
            action="store_true", 
            default=False,
            help="Force import even if errors occur",
        )

    def handle(self, *args, **options):
        file_path = options.get("file")
        force = options.get("force", False)

        # Get the file path
        if not file_path:
            BASE_DIR = Path(settings.BASE_DIR)
            file_path = os.path.join(
                BASE_DIR,
                "data",
                "techniques.json",
            )

        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f"File not found: {file_path}"))
            return

        self.stdout.write(self.style.SUCCESS(f"Importing techniques from {file_path}"))

        # Create initial records needed for import
        self._create_base_records()

        # Process the JSON file
        try:
            with open(file_path, "r", encoding="utf-8") as json_file:
                techniques_data = json.load(json_file)

            # Use a transaction to ensure data consistency
            with transaction.atomic():
                count = 0
                for technique_data in techniques_data:
                    self._process_technique(technique_data)
                    count += 1

            self.stdout.write(
                self.style.SUCCESS(f"Successfully imported {count} techniques")
            )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error processing JSON file: {str(e)}"))

    def _create_base_records(self):
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

        # Create attribute types for common fields in the JSON
        attribute_types = [
            "Scope",
            "Data Type",
            "Model Type",
            "Programming Language",
            "Fairness Approach",
            "Project Lifecycle Stage",
            "Explanatory Scope",
        ]
        for attr_type in attribute_types:
            AttributeType.objects.get_or_create(
                name=attr_type,
                defaults={"description": f"The {attr_type.lower()} of the technique"},
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

    def _process_technique(self, data):
        """Process a single technique from JSON data"""
        try:
            # Extract basic data
            name = data.get("name", "")
            description = data.get("description", "")
            model_dependency = data.get("model_dependency", "Model-Agnostic")
            assurance_goals_list = data.get("assurance_goals", [])
            category_tags = data.get("category_tags", "")  # Keep for backward compatibility
            categories_data = data.get("categories", [])  # New direct categories list
            subcategories_data = data.get("subcategories", [])  # New direct subcategories list
            complexity_rating = data.get("complexity_rating")
            computational_cost_rating = data.get("computational_cost_rating")
            applicable_models = data.get("applicable_models", [])

            # Process nested data structures directly from JSON
            attributes_data = data.get("attributes", [])
            example_use_cases_data = data.get("example_use_cases", [])
            resources_data = data.get("resources", [])
            limitations_data = data.get("limitations", [])

            # Skip if essential data is missing
            if not name or not description:
                self.stdout.write(
                    self.style.WARNING(
                        f"Skipping technique with missing name or description"
                    )
                )
                return

            # Create default values
            defaults = {
                "description": description,
                "model_dependency": model_dependency,
                "category_tags": category_tags,  # Keep for backward compatibility
                "complexity_rating": complexity_rating,
                "computational_cost_rating": computational_cost_rating,
            }

            # Add applicable_models to defaults
            defaults["applicable_models"] = applicable_models if applicable_models else None

            # Create or update the technique
            technique, created = Technique.objects.update_or_create(
                name=name,
                defaults=defaults,
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
            for goal_name in assurance_goals_list:
                goal, _ = AssuranceGoal.objects.get_or_create(
                    name=goal_name,
                    defaults={
                        "description": f"{goal_name} techniques for trustworthy AI"
                    },
                )
                technique.assurance_goals.add(goal)

            # First try to process direct categories and subcategories data
            has_direct_categories = False
            
            # Process direct categories data if available
            if categories_data:
                has_direct_categories = True
                for cat_data in categories_data:
                    if isinstance(cat_data, dict):
                        cat_name = cat_data.get("name")
                        cat_goal_name = cat_data.get("assurance_goal")
                    else:
                        cat_name = cat_data
                        cat_goal_name = assurance_goals_list[0] if assurance_goals_list else "Explainability"
                    
                    if not cat_name:
                        continue
                        
                    # Get or create the assurance goal
                    goal, _ = AssuranceGoal.objects.get_or_create(
                        name=cat_goal_name,
                        defaults={
                            "description": f"{cat_goal_name} techniques for trustworthy AI"
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
            
            # Process direct subcategories data if available
            if subcategories_data:
                has_direct_categories = True
                for subcat_data in subcategories_data:
                    if isinstance(subcat_data, dict):
                        subcat_name = subcat_data.get("name")
                        cat_name = subcat_data.get("category")
                        cat_goal_name = subcat_data.get("assurance_goal", 
                                                        assurance_goals_list[0] if assurance_goals_list else "Explainability")
                    else:
                        # If it's not a dict with detailed info, skip it
                        continue
                    
                    if not subcat_name or not cat_name:
                        continue
                    
                    # Get or create the assurance goal
                    goal, _ = AssuranceGoal.objects.get_or_create(
                        name=cat_goal_name,
                        defaults={
                            "description": f"{cat_goal_name} techniques for trustworthy AI"
                        },
                    )
                    
                    # Get or create category
                    category, _ = Category.objects.get_or_create(
                        name=cat_name,
                        assurance_goal=goal,
                        defaults={"description": f"Category for {cat_name}"},
                    )
                    
                    # Get or create subcategory
                    subcategory, _ = SubCategory.objects.get_or_create(
                        name=subcat_name,
                        category=category,
                        defaults={"description": f"Subcategory for {subcat_name}"},
                    )
                    
                    # Add subcategory to technique
                    technique.subcategories.add(subcategory)
            
            # Fallback to category_tags only if direct categories are not available
            if not has_direct_categories and category_tags:
                parsed_categories = self._parse_category_tags(category_tags)

                for cat_data in parsed_categories:
                    cat_name = cat_data.get("category")
                    subcat_name = cat_data.get("subcategory")

                    # Use first available assurance goal, or default to Explainability
                    goal_name = (
                        assurance_goals_list[0]
                        if assurance_goals_list
                        else "Explainability"
                    )

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
                    self.stdout.write(
                        self.style.WARNING(f"Error creating use case for {name}: {e}")
                    )

            # Process limitations - handle both string and object formats
            for limitation in limitations_data:
                # Check if the limitation is already a dict/object with description field
                if isinstance(limitation, dict) and "description" in limitation:
                    description = limitation["description"].strip()
                    if description:
                        TechniqueLimitation.objects.create(
                            technique=technique, description=description
                        )
                # Check if it's a string that might be a JSON string
                elif isinstance(limitation, str):
                    # If it looks like a JSON array or object, try to parse it
                    if limitation.strip().startswith(('[', '{')):
                        try:
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
                            elif isinstance(parsed_limitation, dict) and "description" in parsed_limitation:
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

                # Create resource
                TechniqueResource.objects.create(
                    technique=technique,
                    resource_type=resource_type,
                    url=resource_url,
                    title=resource_title,
                    description=resource_desc,
                    authors=resource_authors,
                    publication_date=resource_publication_date,
                    source_type=resource_source_type,
                )

            status = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f"{status} technique: {name}"))

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    f'Error processing technique {data.get("name", "Unknown")}: {str(e)}'
                )
            )
