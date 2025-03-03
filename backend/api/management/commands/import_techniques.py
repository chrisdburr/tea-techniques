import csv
import json
import os
from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import (
    AssuranceGoal,
    Category,
    SubCategory,
    Tag,
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
    help = 'Import techniques from CSV file'

    def add_arguments(self, parser):
        parser.add_argument('--file', type=str, help='Path to the CSV file')

    def handle(self, *args, **options):
        file_path = options.get('file')
        if not file_path:
            file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 
                                    'data', 'techniques.csv')
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'File not found: {file_path}'))
            return
        
        self.stdout.write(self.style.SUCCESS(f'Importing techniques from {file_path}'))
        
        # Create initial records needed for import
        self._create_base_records()
        
        # Process the CSV file
        with open(file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            # Use a transaction to ensure data consistency
            with transaction.atomic():
                for row in reader:
                    self._process_technique(row)
                    
        self.stdout.write(self.style.SUCCESS('Successfully imported techniques'))
    
    def _create_base_records(self):
        """Create necessary base records (goals, attributes, etc.)"""
        # Create assurance goals if they don't exist
        for goal_name in ['Explainability', 'Fairness']:
            AssuranceGoal.objects.get_or_create(
                name=goal_name,
                defaults={'description': f'{goal_name} techniques for trustworthy AI'}
            )
            
        # Create attribute types
        for attr_type in ['Scope', 'Data Type', 'Model Type', 'Programming Language']:
            AttributeType.objects.get_or_create(
                name=attr_type,
                defaults={'description': f'The {attr_type.lower()} of the technique'}
            )
            
        # Create resource types
        for resource_type in ['Paper', 'GitHub', 'Documentation', 'Website', 'Tutorial', 'API']:
            ResourceType.objects.get_or_create(
                name=resource_type,
                defaults={'icon': resource_type.lower()}
            )
    
    def _process_technique(self, row):
        """Process a single technique row from the CSV"""
        try:
            # Extract data from the row
            name = row['name']
            description = row['description']
            model_dependency = row['model_dependency']
            assurance_goal_name = row['assurance_goals']
            
            # Parse JSON arrays
            categories_data = json.loads(row['categories']) if row['categories'] else []
            subcategories_data = json.loads(row['subcategories']) if row['subcategories'] else []
            attributes_data = json.loads(row['attributes']) if row['attributes'] else []
            example_use_cases_data = json.loads(row['example_use_cases']) if row['example_use_cases'] else []
            resources_data = json.loads(row['resources']) if row['resources'] else []
            limitations_data = row['limitations'].split('|') if row['limitations'] else []
            
            # If a technique already exists with this name, we'll update it
            # Otherwise, we'll create a new one
            technique, created = Technique.objects.update_or_create(
                name=name,
                defaults={
                    'description': description,
                    'model_dependency': model_dependency,
                }
            )
            
            # Clear existing relationships if updating
            if not created:
                technique.assurance_goals.clear()
                technique.categories.clear()
                technique.subcategories.clear()
                
                # Delete related objects
                technique.attributes.all().delete()
                technique.resources.all().delete()
                technique.example_use_cases.all().delete()
                technique.limitations.all().delete()
            
            # Process assurance goals
            assurance_goal = AssuranceGoal.objects.get(name=assurance_goal_name)
            technique.assurance_goals.add(assurance_goal)
            
            # Process categories and subcategories
            for cat_data in categories_data:
                goal_name = cat_data.get('goal', assurance_goal_name)
                cat_name = cat_data.get('category')
                
                goal = AssuranceGoal.objects.get(name=goal_name)
                
                # Get or create the category
                category, _ = Category.objects.get_or_create(
                    name=cat_name,
                    assurance_goal=goal,
                    defaults={'description': f'Category for {cat_name}'}
                )
                
                # Add category to technique
                technique.categories.add(category)
                
            # Process subcategories
            for subcat_data in subcategories_data:
                cat_name = subcat_data.get('category')
                subcat_name = subcat_data.get('subcategory')
                
                # Find the category
                try:
                    category = Category.objects.get(name=cat_name)
                    
                    # Get or create subcategory
                    subcategory, _ = SubCategory.objects.get_or_create(
                        name=subcat_name,
                        category=category,
                        defaults={'description': f'Subcategory for {subcat_name}'}
                    )
                    
                    # Add subcategory to technique
                    technique.subcategories.add(subcategory)
                except Category.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f'Category {cat_name} not found for {name}'))
            
            # Process attributes
            for attr_data in attributes_data:
                attr_type_name = attr_data.get('type')
                attr_value_name = attr_data.get('value')
                
                # Get or create attribute type
                attr_type, _ = AttributeType.objects.get_or_create(
                    name=attr_type_name,
                    defaults={'description': f'The {attr_type_name.lower()} of the technique'}
                )
                
                # Get or create attribute value
                attr_value, _ = AttributeValue.objects.get_or_create(
                    attribute_type=attr_type,
                    name=attr_value_name,
                    defaults={'description': f'{attr_value_name} {attr_type_name.lower()}'}
                )
                
                # Add attribute to technique
                TechniqueAttribute.objects.get_or_create(
                    technique=technique,
                    attribute_value=attr_value
                )
            
            # Process example use cases
            for use_case_data in example_use_cases_data:
                use_case_desc = use_case_data.get('description')
                use_case_goal_name = use_case_data.get('goal', assurance_goal_name)
                
                # Find the goal
                try:
                    use_case_goal = AssuranceGoal.objects.get(name=use_case_goal_name)
                    
                    # Create example use case
                    TechniqueExampleUseCase.objects.get_or_create(
                        technique=technique,
                        description=use_case_desc,
                        assurance_goal=use_case_goal
                    )
                except AssuranceGoal.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f'Goal {use_case_goal_name} not found for {name}'))
            
            # Process limitations
            for limitation in limitations_data:
                if limitation.strip():
                    TechniqueLimitation.objects.get_or_create(
                        technique=technique,
                        description=limitation.strip()
                    )
            
            # Process resources
            for resource_data in resources_data:
                if isinstance(resource_data, dict):
                    resource_type_name = resource_data.get('type', 'Website')
                    resource_title = resource_data.get('title', 'Resource')
                    resource_url = resource_data.get('url', '')
                    resource_desc = resource_data.get('description', '')
                    
                    if resource_url:
                        # Get or create resource type
                        resource_type, _ = ResourceType.objects.get_or_create(
                            name=resource_type_name,
                            defaults={'icon': resource_type_name.lower()}
                        )
                        
                        # Create resource
                        TechniqueResource.objects.get_or_create(
                            technique=technique,
                            resource_type=resource_type,
                            url=resource_url,
                            defaults={
                                'title': resource_title,
                                'description': resource_desc
                            }
                        )
            
            status = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f'{status} technique: {name}'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error processing technique {row.get("name", "Unknown")}: {str(e)}'))