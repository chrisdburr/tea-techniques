# Backend Migration Plan for TEA Techniques Project

This document outlines the plan to migrate the backend of the TEA Techniques project to support the new data model as defined in the requirements.

## 1. Overview of Changes

The migration involves several key changes to the existing data model:

1. **TechniqueRelationship Model Enhancement**: Update to add relationship_type, make fields non-nullable, and use proper foreign key deletion handling.
2. **Maintaining Hierarchical Relationship**: Keep the current hierarchical structure between Goals, Categories, and Sub-Categories.
3. **Optional Sub-Category for Techniques**: Maintain the optional nature of the sub-category relationship.
4. **Support for Techniques with Multiple Goals, Categories, and Sub-Categories**: Convert from single-value foreign keys to many-to-many relationships with through models.
5. **Enhanced Technique Attributes and Resource Management**: Implement more flexible attribute and resource management systems.
6. **Removal of Unused Models**: Clean up unused models like ProjectLifecycleStage.

## 2. Detailed Implementation Plan

### 2.1 Create New Models

Define the following new models in `api/models.py`:

```python
# Relationship models for Technique with hierarchical entities
class TechniqueAssuranceGoal(models.Model):
    technique = models.ForeignKey('Technique', on_delete=models.CASCADE)
    assurance_goal = models.ForeignKey('AssuranceGoal', on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'technique_assurance_goal'
        unique_together = ('technique', 'assurance_goal')

class TechniqueCategory(models.Model):
    technique = models.ForeignKey('Technique', on_delete=models.CASCADE)
    category = models.ForeignKey('Category', on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'technique_category'
        unique_together = ('technique', 'category')

class TechniqueSubCategory(models.Model):
    technique = models.ForeignKey('Technique', on_delete=models.CASCADE)
    subcategory = models.ForeignKey('SubCategory', on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'technique_subcategory'
        unique_together = ('technique', 'subcategory')

# Flexible attribute system
class AttributeType(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    applicable_goals = models.ManyToManyField('AssuranceGoal', blank=True)
    required_for_goals = models.ManyToManyField(
        'AssuranceGoal', 
        related_name='required_attribute_types',
        blank=True
    )
    
    class Meta:
        db_table = 'attribute_type'
    
    def __str__(self):
        return self.name

class AttributeValue(models.Model):
    attribute_type = models.ForeignKey(AttributeType, on_delete=models.CASCADE, related_name='values')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'attribute_value'
        unique_together = ('attribute_type', 'name')
    
    def __str__(self):
        return f"{self.attribute_type.name}: {self.name}"

class TechniqueAttribute(models.Model):
    technique = models.ForeignKey('Technique', on_delete=models.CASCADE, related_name='attributes')
    attribute_value = models.ForeignKey(AttributeValue, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'technique_attribute'
        unique_together = ('technique', 'attribute_value')

# Resource management
class ResourceType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True)  # For frontend display
    
    class Meta:
        db_table = 'resource_type'
    
    def __str__(self):
        return self.name

class TechniqueResource(models.Model):
    technique = models.ForeignKey('Technique', on_delete=models.CASCADE, related_name='resources')
    resource_type = models.ForeignKey(ResourceType, on_delete=models.PROTECT)
    title = models.CharField(max_length=255)
    url = models.URLField()
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'technique_resource'
        unique_together = ('technique', 'url')
    
    def __str__(self):
        return f"{self.resource_type.name}: {self.title}"

# Multiple example use cases and limitations
class TechniqueExampleUseCase(models.Model):
    technique = models.ForeignKey('Technique', on_delete=models.CASCADE, related_name='example_use_cases')
    description = models.TextField()
    assurance_goal = models.ForeignKey('AssuranceGoal', on_delete=models.CASCADE, null=True, blank=True)
    
    class Meta:
        db_table = 'technique_example_use_case'

class TechniqueLimitation(models.Model):
    technique = models.ForeignKey('Technique', on_delete=models.CASCADE, related_name='limitations')
    description = models.TextField()
    
    class Meta:
        db_table = 'technique_limitation'
```

### 2.2 Update the Technique Model

Modify the existing Technique model:

```python
class Technique(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    model_dependency = models.CharField(max_length=255)
    
    # Convert from foreign keys to many-to-many relationships
    assurance_goals = models.ManyToManyField(
        AssuranceGoal, 
        through='TechniqueAssuranceGoal',
        related_name='techniques'
    )
    categories = models.ManyToManyField(
        Category, 
        through='TechniqueCategory',
        related_name='techniques'
    )
    subcategories = models.ManyToManyField(
        SubCategory, 
        through='TechniqueSubCategory',
        related_name='techniques',
        blank=True
    )
    
    # Keep tags relationship
    tags = models.ManyToManyField(Tag, through='TechniqueTag', blank=True)
    
    # Fields being replaced by new models
    # These will be removed after migration
    # example_use_case = models.TextField()  # Replaced by TechniqueExampleUseCase
    # reference = models.URLField(blank=True)  # Replaced by TechniqueResource
    # software_package = models.URLField(blank=True)  # Replaced by TechniqueResource
    # limitation = models.TextField(blank=True)  # Replaced by TechniqueLimitation
    # scope = models.CharField(max_length=255, blank=True, null=True)  # Will be an attribute
    # fairness_approach = models.ManyToManyField(FairnessApproach, through='TechniqueFairnessApproach', blank=True)
    
    class Meta:
        db_table = 'technique'
        verbose_name_plural = "Techniques"

    def clean(self):
        super().clean()
        if Technique.objects.filter(name__iexact=self.name).exclude(id=self.id).exists():
            raise ValidationError({'name': 'A technique with this name already exists.'})

    def __str__(self):
        return self.name
```

### 2.3 Update TechniqueRelationship Model

```python
class TechniqueRelationship(models.Model):
    technique_from = models.ForeignKey(
        Technique, 
        related_name='related_from', 
        on_delete=models.CASCADE
    )
    technique_to = models.ForeignKey(
        Technique, 
        related_name='related_to', 
        on_delete=models.CASCADE
    )
    relationship_type = models.CharField(
        max_length=50, 
        default="similar"
    )
    
    class Meta:
        db_table = 'technique_relationship'
        unique_together = ('technique_from', 'technique_to', 'relationship_type')
        verbose_name_plural = "Technique Relationships"
        
    def __str__(self):
        return f"{self.technique_from.name} → {self.technique_to.name} ({self.relationship_type})"
```

### 2.4 Create Database Migrations

1. Generate the migrations using Django's migration system:

```bash
cd backend
poetry run python manage.py makemigrations api
```

2. Create a data migration to transfer existing data to the new structure:

```bash
cd backend
poetry run python manage.py makemigrations api --empty --name=data_migration_for_new_models
```

3. Edit the generated migration file to include custom data migration logic:

```python
# In the data migration file
from django.db import migrations

def migrate_techniques_data(apps, schema_editor):
    # Get the models
    Technique = apps.get_model('api', 'Technique')
    TechniqueExampleUseCase = apps.get_model('api', 'TechniqueExampleUseCase')
    TechniqueLimitation = apps.get_model('api', 'TechniqueLimitation')
    TechniqueAssuranceGoal = apps.get_model('api', 'TechniqueAssuranceGoal')
    TechniqueCategory = apps.get_model('api', 'TechniqueCategory')
    TechniqueSubCategory = apps.get_model('api', 'TechniqueSubCategory')
    
    # Create attribute types and values for scope
    AttributeType = apps.get_model('api', 'AttributeType')
    AttributeValue = apps.get_model('api', 'AttributeValue')
    TechniqueAttribute = apps.get_model('api', 'TechniqueAttribute')
    
    # Create resource types
    ResourceType = apps.get_model('api', 'ResourceType')
    reference_type = ResourceType.objects.create(name='Reference', icon='book')
    software_type = ResourceType.objects.create(name='Software Package', icon='code')
    TechniqueResource = apps.get_model('api', 'TechniqueResource')
    
    # Create scope attribute type
    scope_type = AttributeType.objects.create(
        name='Scope',
        description='The scope of the technique (global or local)',
    )
    
    # Create common scope values
    global_scope = AttributeValue.objects.create(
        attribute_type=scope_type,
        name='Global',
        description='Technique applies to the entire model'
    )
    
    local_scope = AttributeValue.objects.create(
        attribute_type=scope_type,
        name='Local',
        description='Technique applies to specific instances or predictions'
    )
    
    # Migrate each technique
    for technique in Technique.objects.all():
        # Create many-to-many relationships
        TechniqueAssuranceGoal.objects.create(
            technique=technique,
            assurance_goal=technique.assurance_goal
        )
        
        TechniqueCategory.objects.create(
            technique=technique,
            category=technique.category
        )
        
        if technique.sub_category:
            TechniqueSubCategory.objects.create(
                technique=technique,
                subcategory=technique.sub_category
            )
        
        # Migrate example use case
        if technique.example_use_case:
            TechniqueExampleUseCase.objects.create(
                technique=technique,
                description=technique.example_use_case,
                assurance_goal=technique.assurance_goal
            )
        
        # Migrate limitation
        if technique.limitation:
            TechniqueLimitation.objects.create(
                technique=technique,
                description=technique.limitation
            )
        
        # Migrate scope as attribute
        if technique.scope:
            # Determine which scope value to use
            if technique.scope.lower() == 'global':
                scope_value = global_scope
            elif technique.scope.lower() == 'local':
                scope_value = local_scope
            else:
                # Create custom scope value if needed
                scope_value = AttributeValue.objects.create(
                    attribute_type=scope_type,
                    name=technique.scope,
                    description=f'Custom scope: {technique.scope}'
                )
            
            # Create attribute link
            TechniqueAttribute.objects.create(
                technique=technique,
                attribute_value=scope_value
            )
        
        # Migrate reference URL
        if technique.reference:
            TechniqueResource.objects.create(
                technique=technique,
                resource_type=reference_type,
                title='Reference',
                url=technique.reference,
                description='Documentation or reference material'
            )
        
        # Migrate software package URL
        if technique.software_package:
            TechniqueResource.objects.create(
                technique=technique,
                resource_type=software_type,
                title='Software Package',
                url=technique.software_package,
                description='Implementation or software package'
            )

def migrate_techniques_from_csv(apps, schema_editor):
    """
    Import techniques from the CSV file in the data directory.
    This is an alternative to the above function if you want to completely 
    rebuild the database from the CSV.
    """
    import csv
    import json
    import os
    from django.conf import settings
    
    # Models we'll need
    Technique = apps.get_model('api', 'Technique')
    AssuranceGoal = apps.get_model('api', 'AssuranceGoal')
    Category = apps.get_model('api', 'Category')
    SubCategory = apps.get_model('api', 'SubCategory')
    TechniqueAssuranceGoal = apps.get_model('api', 'TechniqueAssuranceGoal')
    TechniqueCategory = apps.get_model('api', 'TechniqueCategory')
    TechniqueSubCategory = apps.get_model('api', 'TechniqueSubCategory')
    AttributeType = apps.get_model('api', 'AttributeType')
    AttributeValue = apps.get_model('api', 'AttributeValue')
    TechniqueAttribute = apps.get_model('api', 'TechniqueAttribute')
    TechniqueExampleUseCase = apps.get_model('api', 'TechniqueExampleUseCase')
    TechniqueLimitation = apps.get_model('api', 'TechniqueLimitation')
    ResourceType = apps.get_model('api', 'ResourceType')
    TechniqueResource = apps.get_model('api', 'TechniqueResource')
    
    # Create resource types
    ref_type = ResourceType.objects.create(name='Reference', icon='book')
    
    # Create attribute types
    scope_type = AttributeType.objects.create(
        name='Scope',
        description='The scope of the technique (global or local)',
    )
    
    # First, ensure we have the goals, categories, and subcategories
    goals_dict = {}  # To store created goals by name
    categories_dict = {}  # To store created categories by goal+name
    subcategories_dict = {}  # To store created subcategories by cat+name
    
    # Path to the CSV file
    csv_path = os.path.join(settings.BASE_DIR, 'data', 'techniques.csv')
    
    with open(csv_path, 'r') as file:
        reader = csv.DictReader(file)
        
        # First pass: extract and create all goals, categories, subcategories
        for row in reader:
            # Get assurance goals
            goals = row.get('assurance_goals', '').split(',')
            for goal_name in goals:
                goal_name = goal_name.strip()
                if goal_name and goal_name not in goals_dict:
                    goal = AssuranceGoal.objects.create(
                        name=goal_name,
                        description=f"Assurance goal for {goal_name}"
                    )
                    goals_dict[goal_name] = goal
            
            # Get categories
            categories_json = json.loads(row.get('categories', '[]'))
            for cat_data in categories_json:
                goal_name = cat_data.get('goal', '')
                cat_name = cat_data.get('category', '')
                
                # Skip if missing data
                if not (goal_name and cat_name):
                    continue
                
                # Create category if needed
                # Note: Categories are specific to a single assurance goal, even if they share the same name.
                # The cat_key combines goal and category name to maintain this hierarchical relationship.
                cat_key = f"{goal_name}:{cat_name}"
                if cat_key not in categories_dict:
                    # Get corresponding goal object
                    if goal_name in goals_dict:
                        goal = goals_dict[goal_name]
                        category = Category.objects.create(
                            name=cat_name,
                            description=f"Category for {cat_name} under {goal_name}",
                            assurance_goal=goal
                        )
                        categories_dict[cat_key] = category
            
            # Get subcategories
            subcats_json = json.loads(row.get('subcategories', '[]'))
            for subcat_data in subcats_json:
                cat_name = subcat_data.get('category', '')
                subcat_name = subcat_data.get('subcategory', '')
                
                # Skip if missing data
                if not (cat_name and subcat_name):
                    continue
                
                # Find the category in our dictionary
                # Need to find the right goal for this category
                for cat_key, category in categories_dict.items():
                    if cat_key.endswith(f":{cat_name}"):
                        # Found the category, create subcategory if needed
                        subcat_key = f"{cat_key}:{subcat_name}"
                        if subcat_key not in subcategories_dict:
                            subcategory = SubCategory.objects.create(
                                name=subcat_name,
                                description=f"Subcategory for {subcat_name} under {cat_name}",
                                category=category
                            )
                            subcategories_dict[subcat_key] = subcategory
        
        # Reset file pointer for second pass
        file.seek(0)
        next(reader)  # Skip header row
        
        # Second pass: create techniques and relationships
        for row in reader:
            # Create the technique
            technique = Technique.objects.create(
                name=row.get('name', ''),
                description=row.get('description', ''),
                model_dependency=row.get('model_dependency', '')
            )
            
            # Connect to assurance goals
            goals = row.get('assurance_goals', '').split(',')
            for goal_name in goals:
                goal_name = goal_name.strip()
                if goal_name in goals_dict:
                    TechniqueAssuranceGoal.objects.create(
                        technique=technique,
                        assurance_goal=goals_dict[goal_name]
                    )
            
            # Connect to categories
            categories_json = json.loads(row.get('categories', '[]'))
            for cat_data in categories_json:
                goal_name = cat_data.get('goal', '')
                cat_name = cat_data.get('category', '')
                
                # Skip if missing data
                if not (goal_name and cat_name):
                    continue
                
                cat_key = f"{goal_name}:{cat_name}"
                if cat_key in categories_dict:
                    TechniqueCategory.objects.create(
                        technique=technique,
                        category=categories_dict[cat_key]
                    )
            
            # Connect to subcategories
            subcats_json = json.loads(row.get('subcategories', '[]'))
            for subcat_data in subcats_json:
                cat_name = subcat_data.get('category', '')
                subcat_name = subcat_data.get('subcategory', '')
                
                # Skip if missing data
                if not (cat_name and subcat_name):
                    continue
                
                # Find the right subcategory
                for subcat_key, subcategory in subcategories_dict.items():
                    if subcat_key.endswith(f":{subcat_name}") and f":{cat_name}:" in subcat_key:
                        TechniqueSubCategory.objects.create(
                            technique=technique,
                            subcategory=subcategory
                        )
            
            # Handle attributes
            attributes_json = json.loads(row.get('attributes', '[]'))
            for attr_data in attributes_json:
                attr_type_name = attr_data.get('type', '')
                attr_value_name = attr_data.get('value', '')
                
                # Skip if missing data
                if not (attr_type_name and attr_value_name):
                    continue
                
                # Get or create the attribute type
                attr_type, _ = AttributeType.objects.get_or_create(
                    name=attr_type_name,
                    defaults={'description': f"Attribute type for {attr_type_name}"}
                )
                
                # Get or create the attribute value
                attr_value, _ = AttributeValue.objects.get_or_create(
                    attribute_type=attr_type,
                    name=attr_value_name,
                    defaults={'description': f"{attr_type_name}: {attr_value_name}"}
                )
                
                # Link to technique
                TechniqueAttribute.objects.create(
                    technique=technique,
                    attribute_value=attr_value
                )
            
            # Handle example use cases
            use_cases_json = json.loads(row.get('example_use_cases', '[]'))
            for uc_data in use_cases_json:
                uc_desc = uc_data.get('description', '')
                uc_goal = uc_data.get('goal', '')
                
                if not uc_desc:
                    continue
                
                # Create the use case
                use_case = TechniqueExampleUseCase(
                    technique=technique,
                    description=uc_desc
                )
                
                # Set goal if available
                if uc_goal and uc_goal in goals_dict:
                    use_case.assurance_goal = goals_dict[uc_goal]
                
                use_case.save()
            
            # Handle limitations
            limitations = row.get('limitations', '')
            if limitations:
                limitations_json = json.loads(limitations)
                for limit_text in limitations_json:
                    if limit_text:
                        TechniqueLimitation.objects.create(
                            technique=technique,
                            description=limit_text
                        )
            
            # Handle resources
            resources_json = json.loads(row.get('resources', '[]'))
            for res_data in resources_json:
                res_type = res_data.get('type', 'Reference')
                res_title = res_data.get('title', '')
                res_url = res_data.get('url', '')
                res_desc = res_data.get('description', '')
                
                if not (res_title and res_url):
                    continue
                
                # Get or create resource type
                res_type_obj, _ = ResourceType.objects.get_or_create(
                    name=res_type,
                    defaults={'icon': 'link'}
                )
                
                # Create resource
                TechniqueResource.objects.create(
                    technique=technique,
                    resource_type=res_type_obj,
                    title=res_title,
                    url=res_url,
                    description=res_desc
                )

class Migration(migrations.Migration):

    dependencies = [
        ('api', 'XXXX_previous_migration'),  # Update this to the actual previous migration
    ]

    operations = [
        migrations.RunPython(migrate_techniques_from_csv),
    ]
```

4. Apply the migrations:

```bash
cd backend
poetry run python manage.py migrate
```

### 2.5 Update Serializers

Create new serializers in `api/serializers.py`:

```python
class TechniqueRelationshipSerializer(serializers.ModelSerializer):
    technique_from_name = serializers.ReadOnlyField(source="technique_from.name")
    technique_to_name = serializers.ReadOnlyField(source="technique_to.name")
    
    class Meta:
        model = TechniqueRelationship
        fields = ["id", "technique_from", "technique_from_name", "technique_to", "technique_to_name", "relationship_type"]

class AttributeTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttributeType
        fields = "__all__"

class AttributeValueSerializer(serializers.ModelSerializer):
    attribute_type_name = serializers.ReadOnlyField(source="attribute_type.name")
    
    class Meta:
        model = AttributeValue
        fields = ["id", "attribute_type", "attribute_type_name", "name", "description"]

class TechniqueAttributeSerializer(serializers.ModelSerializer):
    attribute_type = serializers.ReadOnlyField(source="attribute_value.attribute_type.name")
    attribute_value_name = serializers.ReadOnlyField(source="attribute_value.name")
    
    class Meta:
        model = TechniqueAttribute
        fields = ["id", "attribute_type", "attribute_value", "attribute_value_name"]

class ResourceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceType
        fields = "__all__"

class TechniqueResourceSerializer(serializers.ModelSerializer):
    resource_type_name = serializers.ReadOnlyField(source="resource_type.name")
    
    class Meta:
        model = TechniqueResource
        fields = ["id", "resource_type", "resource_type_name", "title", "url", "description"]

class TechniqueExampleUseCaseSerializer(serializers.ModelSerializer):
    assurance_goal_name = serializers.ReadOnlyField(source="assurance_goal.name")
    
    class Meta:
        model = TechniqueExampleUseCase
        fields = ["id", "description", "assurance_goal", "assurance_goal_name"]

class TechniqueLimitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TechniqueLimitation
        fields = ["id", "description"]
```

Update the Technique serializer:

```python
class TechniqueSerializer(serializers.ModelSerializer):
    # Names for related fields
    assurance_goals = AssuranceGoalSerializer(many=True, read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    subcategories = SubCategorySerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    
    # New relationship fields
    attributes = TechniqueAttributeSerializer(many=True, read_only=True)
    resources = TechniqueResourceSerializer(many=True, read_only=True)
    example_use_cases = TechniqueExampleUseCaseSerializer(many=True, read_only=True)
    limitations = TechniqueLimitationSerializer(many=True, read_only=True)
    
    class Meta:
        model = Technique
        fields = [
            "id",
            "name",
            "description",
            "model_dependency",
            "assurance_goals",
            "categories",
            "subcategories",
            "tags",
            "attributes",
            "resources",
            "example_use_cases",
            "limitations",
            # Legacy fields to be removed after migration
            # "reference",
            # "software_package",
            # "scope",
        ]
```

Create a new write serializer for Technique:

```python
class TechniqueWriteSerializer(serializers.ModelSerializer):
    # Fields for nested data
    assurance_goal_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )
    category_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )
    subcategory_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )
    attributes = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True
    )
    resources = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True
    )
    example_use_cases = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True
    )
    limitations = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True
    )
    
    class Meta:
        model = Technique
        fields = [
            "id",
            "name",
            "description",
            "model_dependency",
            "assurance_goal_ids",
            "category_ids",
            "subcategory_ids",
            "tag_ids",
            "attributes",
            "resources",
            "example_use_cases",
            "limitations",
        ]
    
    def create(self, validated_data):
        # Extract nested data
        assurance_goal_ids = validated_data.pop('assurance_goal_ids', [])
        category_ids = validated_data.pop('category_ids', [])
        subcategory_ids = validated_data.pop('subcategory_ids', [])
        tag_ids = validated_data.pop('tag_ids', [])
        attributes_data = validated_data.pop('attributes', [])
        resources_data = validated_data.pop('resources', [])
        example_use_cases_data = validated_data.pop('example_use_cases', [])
        limitations_data = validated_data.pop('limitations', [])
        
        # Create the technique
        technique = Technique.objects.create(**validated_data)
        
        # Add many-to-many relationships
        self._add_relationships(
            technique, 
            assurance_goal_ids, 
            category_ids, 
            subcategory_ids, 
            tag_ids,
            attributes_data,
            resources_data,
            example_use_cases_data,
            limitations_data
        )
        
        return technique
    
    def update(self, instance, validated_data):
        # Extract nested data
        assurance_goal_ids = validated_data.pop('assurance_goal_ids', None)
        category_ids = validated_data.pop('category_ids', None)
        subcategory_ids = validated_data.pop('subcategory_ids', None)
        tag_ids = validated_data.pop('tag_ids', None)
        attributes_data = validated_data.pop('attributes', None)
        resources_data = validated_data.pop('resources', None)
        example_use_cases_data = validated_data.pop('example_use_cases', None)
        limitations_data = validated_data.pop('limitations', None)
        
        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update relationships if provided
        if assurance_goal_ids is not None or category_ids is not None or subcategory_ids is not None or tag_ids is not None:
            # Clear existing relationships if new ones are provided
            if assurance_goal_ids is not None:
                instance.assurance_goals.clear()
            if category_ids is not None:
                instance.categories.clear()
            if subcategory_ids is not None:
                instance.subcategories.clear()
            if tag_ids is not None:
                instance.tags.clear()
            
            # Add the new relationships
            self._add_relationships(
                instance, 
                assurance_goal_ids or [], 
                category_ids or [], 
                subcategory_ids or [], 
                tag_ids or [],
                attributes_data,
                resources_data,
                example_use_cases_data,
                limitations_data
            )
        
        return instance
    
    def _add_relationships(self, technique, assurance_goal_ids, category_ids, subcategory_ids, tag_ids, 
                          attributes_data, resources_data, example_use_cases_data, limitations_data):
        """Helper method to add relationships to a technique."""
        # Add assurance goals
        for goal_id in assurance_goal_ids:
            TechniqueAssuranceGoal.objects.create(
                technique=technique,
                assurance_goal_id=goal_id
            )
        
        # Add categories
        for category_id in category_ids:
            TechniqueCategory.objects.create(
                technique=technique,
                category_id=category_id
            )
        
        # Add subcategories
        for subcategory_id in subcategory_ids:
            TechniqueSubCategory.objects.create(
                technique=technique,
                subcategory_id=subcategory_id
            )
        
        # Add tags
        for tag_id in tag_ids:
            TechniqueTag.objects.create(
                technique=technique,
                tag_id=tag_id
            )
        
        # Add attributes
        for attr_data in attributes_data:
            attribute_type_id = attr_data.get('attribute_type')
            attribute_value_id = attr_data.get('attribute_value')
            
            if attribute_type_id and attribute_value_id:
                TechniqueAttribute.objects.create(
                    technique=technique,
                    attribute_value_id=attribute_value_id
                )
        
        # Add resources
        for res_data in resources_data:
            TechniqueResource.objects.create(
                technique=technique,
                resource_type_id=res_data.get('resource_type'),
                title=res_data.get('title', ''),
                url=res_data.get('url', ''),
                description=res_data.get('description', '')
            )
        
        # Add example use cases
        for uc_data in example_use_cases_data:
            TechniqueExampleUseCase.objects.create(
                technique=technique,
                description=uc_data.get('description', ''),
                assurance_goal_id=uc_data.get('assurance_goal')
            )
        
        # Add limitations
        for limitation_text in limitations_data:
            if limitation_text:
                TechniqueLimitation.objects.create(
                    technique=technique,
                    description=limitation_text
                )
```

### 2.6 Update API Views

Create new ViewSets in `api/views/api_views.py`:

```python
class AttributeTypesViewSet(viewsets.ModelViewSet):
    queryset = AttributeType.objects.all()
    serializer_class = AttributeTypeSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["name"]
    search_fields = ["name", "description"]
    ordering_fields = ["id", "name"]

class AttributeValuesViewSet(viewsets.ModelViewSet):
    queryset = AttributeValue.objects.all()
    serializer_class = AttributeValueSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["name", "attribute_type"]
    search_fields = ["name", "description"]
    ordering_fields = ["id", "name"]

class ResourceTypesViewSet(viewsets.ModelViewSet):
    queryset = ResourceType.objects.all()
    serializer_class = ResourceTypeSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["name"]
    search_fields = ["name"]
    ordering_fields = ["id", "name"]

class TechniqueRelationshipsViewSet(viewsets.ModelViewSet):
    queryset = TechniqueRelationship.objects.all()
    serializer_class = TechniqueRelationshipSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["technique_from", "technique_to", "relationship_type"]
    search_fields = ["relationship_type"]
    ordering_fields = ["id"]
```

Update the TechniquesViewSet:

```python
class TechniquesViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Techniques that provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions.
    """

    queryset = Technique.objects.all()
    serializer_class = TechniqueSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = [
        "name",
        "model_dependency",
        "assurance_goals",
        "categories",
        "subcategories",
        "tags",
    ]
    search_fields = ["name", "description"]
    ordering_fields = ["id", "name"]

    def get_serializer_class(self):
        """Return appropriate serializer class based on action."""
        if self.action in ["create", "update", "partial_update"]:
            return TechniqueWriteSerializer
        return TechniqueSerializer

    def create(self, request, *args, **kwargs):
        """Create a new technique with improved error handling."""
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            instance = serializer.save()

            # Return the created instance using the read serializer
            read_serializer = TechniqueSerializer(instance)
            return Response(read_serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            # Log the error for debugging
            logger.error(f"Error creating technique: {str(e)}")
            raise

    def update(self, request, *args, **kwargs):
        """Update a technique with improved error handling."""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(
                instance, data=request.data, partial=kwargs.get("partial", False)
            )
            serializer.is_valid(raise_exception=True)
            updated_instance = serializer.save()

            # Return the updated instance using the read serializer
            read_serializer = TechniqueSerializer(updated_instance)
            return Response(read_serializer.data)
        except Exception as e:
            # Log the error for debugging
            logger.error(f"Error updating technique: {str(e)}")
            raise
```

### 2.7 Update URLs

Update `api/urls.py` to include the new endpoints:

```python
# api/urls.py

from django.urls import path, include
from .views.api_views import get_categorylist, get_subcategorylist
from rest_framework import routers
from .views.api_views import (
    AssuranceGoalsViewSet,
    CategoryViewSet,
    SubCategoryViewSet,
    TagsViewSet,
    TechniquesViewSet,
    AttributeTypesViewSet,
    AttributeValuesViewSet,
    ResourceTypesViewSet,
    TechniqueRelationshipsViewSet,
)

router = routers.DefaultRouter()
router.register(r'assurancegoals', AssuranceGoalsViewSet)
router.register(r'category', CategoryViewSet)
router.register(r'subcategory', SubCategoryViewSet)
router.register(r'tags', TagsViewSet)
router.register(r'techniques', TechniquesViewSet)
router.register(r'attributetypes', AttributeTypesViewSet)
router.register(r'attributevalues', AttributeValuesViewSet)
router.register(r'resourcetypes', ResourceTypesViewSet)
router.register(r'techniquerelationships', TechniqueRelationshipsViewSet)

urlpatterns = [
    path('', include(router.urls)),  # API endpoints
    path('get_categorylist/<int:assurance_goal_id>/', get_categorylist, name='get_categorylist'),
    path('get_subcategorylist/<int:category_id>/', get_subcategorylist, name='get_subcategorylist'),
]
```

## 3. Testing Plan

1. **Unit Tests**: Create unit tests for new models and serializers.
2. **API Tests**: Test all API endpoints with various input combinations.
3. **Data Migration Test**: Verify that data is correctly migrated from old structure to new structure.
4. **Validation Tests**: Verify that validation rules work as expected (e.g., techniques can only be associated with categories that belong to their associated goals). This is critical to maintain the hierarchical relationship where categories are specific to a single assurance goal, even if they share the same name across different goals.

## 4. Rollout Strategy

1. **Development Phase**:
   - Implement all model changes
   - Create migrations
   - Update serializers and views
   - Develop comprehensive tests

2. **Testing Phase**:
   - Run automated tests
   - Manually test API endpoints
   - Verify data migration results

3. **Deployment**:
   - Create a backup of the production database
   - Apply migrations
   - Deploy updated code
   - Run smoke tests to verify functionality

4. **Post-Deployment**:
   - Monitor logs for errors
   - Address any issues that arise

## 5. Cleanup Phase

After the migration is complete and the new system is stable:

1. Remove commented-out code
2. Drop unused models as identified in requirement 6
3. Remove deprecated fields from the Technique model
4. Update documentation

## 6. Timeline

1. Development: 2 weeks
2. Testing: 1 week
3. Deployment: 1 day
4. Post-deployment monitoring: 1 week
5. Cleanup: 1 week

Total estimated time: 4-5 weeks