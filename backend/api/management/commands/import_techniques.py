# backend/api/management/commands/import_techniques.py
from __future__ import annotations

import json
import os
from pathlib import Path
import logging
import datetime
import re
from typing import Any, Dict, List, Optional, Union, Tuple, cast, Set
from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings
from argparse import ArgumentParser

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

            # Use a transaction to ensure data consistency
            with transaction.atomic():
                count = 0
                for technique_data in techniques_data:
                    self._process_technique(technique_data)
                    count += 1

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

    def _parse_date(self, date_str: Optional[str]) -> Optional[datetime.date]:
        """Parse a date string into a Python date object."""
        if not date_str or not date_str.strip():
            return None
            
        date_str = date_str.strip()
        
        # Try different date formats
        formats = [
            "%Y-%m-%d",       # 2023-01-15
            "%d/%m/%Y",       # 15/01/2023
            "%m/%d/%Y",       # 01/15/2023
            "%B %d, %Y",      # January 15, 2023
            "%d %B %Y",       # 15 January 2023
            "%Y",             # 2023 (just year)
            "%B %Y",          # January 2023
            "%m-%Y",          # 01-2023
            "%m/%Y",          # 01/2023
        ]
        
        for fmt in formats:
            try:
                return datetime.datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue
                
        # If we couldn't parse the date with any format, just extract the year if possible
        # This handles cases like "Published in 2023" or "2023 (Conference)"
        year_match = re.search(r'20\d{2}|19\d{2}', date_str)
        if year_match:
            year = int(year_match.group(0))
            return datetime.date(year, 1, 1)  # Default to January 1st of the year
            
        # If all else fails, return None
        logger.warning(f"Could not parse date string: {date_str}")
        return None
        
    def _parse_category_tags(self, category_tags: str) -> List[Dict[str, Optional[str]]]:
        """Parse category tags from #category/subcategory format."""
        if not category_tags:
            return []

        results: List[Dict[str, Optional[str]]] = []
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
            if limitation.strip().startswith(('[', '{')):
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

    def _process_categories(self, technique: Technique, data: Dict[str, Any]) -> None:
        """Process categories and subcategories for a technique."""
        assurance_goals_list = data.get("assurance_goals", [])
        category_tags = data.get("category_tags", "")
        categories_data = data.get("categories", [])
        subcategories_data = data.get("subcategories", [])
        
        # First try to process direct categories and subcategories data
        if categories_data or subcategories_data:
            # Process direct categories
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
        
            # Process direct subcategories
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
        elif category_tags:
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

    def _compare_relationships(self, technique: Technique, data: Dict[str, Any]) -> Dict[str, bool]:
        """Compare existing relationships with incoming data to determine what needs to be cleared."""
        needs_clearing = {
            "assurance_goals": False,
            "categories": False,
            "subcategories": False,
            "attributes": False, 
            "resources": False,
            "example_use_cases": False,
            "limitations": False
        }
        
        # Check assurance goals
        incoming_goals = set(data.get("assurance_goals", []))
        existing_goals = set(technique.assurance_goals.values_list('name', flat=True))
        if incoming_goals and incoming_goals != existing_goals:
            needs_clearing["assurance_goals"] = True
            
        # If there are categories or subcategories in the data, we'll need to clear
        if data.get("categories") or data.get("subcategories") or data.get("category_tags"):
            needs_clearing["categories"] = True
            needs_clearing["subcategories"] = True
            
        # Always clear these relationships as they're completely replaced
        needs_clearing["attributes"] = True 
        needs_clearing["resources"] = True
        needs_clearing["example_use_cases"] = True
        needs_clearing["limitations"] = True
        
        return needs_clearing

    def _process_technique(self, data: Dict[str, Any]) -> None:
        """Process a single technique from JSON data"""
        try:
            # Extract basic data
            name = data.get("name", "")
            description = data.get("description", "")
            model_dependency = data.get("model_dependency", "Model-Agnostic")
            assurance_goals_list = data.get("assurance_goals", [])
            category_tags = data.get("category_tags", "")
            complexity_rating = data.get("complexity_rating")
            computational_cost_rating = data.get("computational_cost_rating")
            applicable_models = data.get("applicable_models", [])

            # Process nested data structures directly from JSON
            attributes_data = data.get("attributes", [])
            example_use_cases_data = data.get("example_use_cases", [])
            resources_data = data.get("resources", [])
            limitations_data = data.get("limitations", [])

            # Skip if essential data is missing, unless force is true
            if not name or not description:
                logger.warning(f"Skipping technique with missing name or description")
                if not self.force:
                    return
                else:
                    logger.info(f"Force flag enabled, continuing with incomplete data")

            # Create default values
            defaults = {
                "description": description,
                "model_dependency": model_dependency,
                "category_tags": category_tags,  # Keep for backward compatibility
                "complexity_rating": complexity_rating,
                "computational_cost_rating": computational_cost_rating,
                "applicable_models": applicable_models if applicable_models else None
            }

            # Create or update the technique
            technique, created = Technique.objects.update_or_create(
                name=name,
                defaults=defaults,
            )

            # If updating, selectively clear relationships based on what's changing
            if not created:
                clearing_needed = self._compare_relationships(technique, data)
                
                # Clear only the relationships that need updating
                if clearing_needed["assurance_goals"]:
                    technique.assurance_goals.clear()
                if clearing_needed["categories"]:
                    technique.categories.clear()
                if clearing_needed["subcategories"]:
                    technique.subcategories.clear()
                if clearing_needed["attributes"]:
                    AttributeValue.objects.filter(technique=technique).delete()
                if clearing_needed["resources"]:
                    TechniqueResource.objects.filter(technique=technique).delete()
                if clearing_needed["example_use_cases"]:
                    TechniqueExampleUseCase.objects.filter(technique=technique).delete()
                if clearing_needed["limitations"]:
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

            # Process categories
            self._process_categories(technique, data)

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

        except Exception as e:
            error_msg = f'Error processing technique {data.get("name", "Unknown")}: {str(e)}'
            logger.error(error_msg)
            self.stdout.write(self.style.ERROR(error_msg))
            if not self.force:
                raise
