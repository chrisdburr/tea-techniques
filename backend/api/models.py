# api/models.py

from django.db import models
from django.core.exceptions import ValidationError

# ProjectLifecycleStage model has been removed as part of the cleanup

class AssuranceGoal(models.Model):
    name = models.CharField(unique=True, max_length=255)
    description = models.TextField()

    class Meta:
        db_table = 'assurance_goal'
        verbose_name_plural = "Assurance Goals"

    def __str__(self):
        return self.name

    def clean(self):
        super().clean()
        if AssuranceGoal.objects.filter(name__iexact=self.name).exclude(id=self.id).exists():
            raise ValidationError({'name': 'AssuranceGoal with this name already exists.'})

    def natural_key(self):
        return (self.name,)

    @classmethod
    def get_by_natural_key(cls, name):
        return cls.objects.get(name=name)

class Category(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    assurance_goal = models.ForeignKey(AssuranceGoal, on_delete=models.CASCADE)

    class Meta:
        db_table = 'category'
        verbose_name_plural = "Categories"
        # Remove unique constraint on name only, since categories can have the same name
        # but should belong to different assurance goals
        unique_together = ('name', 'assurance_goal')

    def __str__(self):
        return f"{self.name} ({self.assurance_goal.name})"

    def clean(self):
        super().clean()
        if Category.objects.filter(
            name__iexact=self.name, 
            assurance_goal=self.assurance_goal
        ).exclude(id=self.id).exists():
            raise ValidationError({'name': 'Category with this name already exists for this assurance goal.'})
    
    def natural_key(self):
        return (self.name, self.assurance_goal.name)

    natural_key.dependencies = ['api.assurancegoal']

    @classmethod
    def get_by_natural_key(cls, name, assurance_goal_name):
        assurance_goal = AssuranceGoal.objects.get_by_natural_key(assurance_goal_name)
        return cls.objects.get(name=name, assurance_goal=assurance_goal)

class SubCategory(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE)

    class Meta:
        db_table = 'sub_category'
        verbose_name_plural = "Sub-Categories"
        # Remove unique constraint on name only, since subcategories can have the same name
        # but should belong to different categories
        unique_together = ('name', 'category')

    def __str__(self):
        return f"{self.name} ({self.category.name})"

    def clean(self):
        super().clean()
        if SubCategory.objects.filter(
            name__iexact=self.name, 
            category=self.category
        ).exclude(id=self.id).exists():
            raise ValidationError({'name': 'SubCategory with this name already exists for this category.'})

    def natural_key(self):
        return (self.name, self.category.name, self.category.assurance_goal.name)

    natural_key.dependencies = ['api.category']

    @classmethod
    def get_by_natural_key(cls, name, category_name, assurance_goal_name):
        category = Category.objects.get_by_natural_key(category_name, assurance_goal_name)
        return cls.objects.get(name=name, category=category)

# FairnessApproach model has been removed as part of the cleanup

class Tag(models.Model):
    name = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = 'tag'
        verbose_name_plural = "Tags"
    
    def __str__(self):
        return self.name

    def clean(self):
        super().clean()
        if Tag.objects.filter(name__iexact=self.name).exclude(id=self.id).exists():
            raise ValidationError({'name': 'Tag with this name already exists.'})

# New models for flexible attribute system
class AttributeType(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    applicable_goals = models.ManyToManyField(AssuranceGoal, blank=True)
    required_for_goals = models.ManyToManyField(
        AssuranceGoal, 
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

# New models for resource management
class ResourceType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True)  # For frontend display
    
    class Meta:
        db_table = 'resource_type'
    
    def __str__(self):
        return self.name

class Technique(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    model_dependency = models.CharField(max_length=255)
    
    # Many-to-many relationships
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
    
    # Tags relationship
    tags = models.ManyToManyField(Tag, through='TechniqueTag', blank=True)

    class Meta:
        db_table = 'technique'
        verbose_name_plural = "Techniques"

    def clean(self):
        super().clean()
        if Technique.objects.filter(name__iexact=self.name).exclude(id=self.id).exists():
            raise ValidationError({'name': 'A technique with this name already exists.'})

    def __str__(self):
        return self.name

# Relationship models for Technique with hierarchical entities
class TechniqueAssuranceGoal(models.Model):
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE)
    assurance_goal = models.ForeignKey(AssuranceGoal, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'technique_assurance_goal'
        unique_together = ('technique', 'assurance_goal')
        verbose_name_plural = "Technique Assurance Goals"
    
    def __str__(self):
        return f"{self.technique.name} - {self.assurance_goal.name}"

class TechniqueCategory(models.Model):
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'technique_category'
        unique_together = ('technique', 'category')
        verbose_name_plural = "Technique Categories"
    
    def __str__(self):
        return f"{self.technique.name} - {self.category.name}"

class TechniqueSubCategory(models.Model):
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE)
    subcategory = models.ForeignKey(SubCategory, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'technique_subcategory'
        unique_together = ('technique', 'subcategory')
        verbose_name_plural = "Technique Subcategories"
    
    def __str__(self):
        return f"{self.technique.name} - {self.subcategory.name}"

# Multiple example use cases and limitations
class TechniqueExampleUseCase(models.Model):
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE, related_name='example_use_cases')
    description = models.TextField()
    assurance_goal = models.ForeignKey(AssuranceGoal, on_delete=models.CASCADE, null=True, blank=True)
    
    class Meta:
        db_table = 'technique_example_use_case'
        verbose_name_plural = "Technique Example Use Cases"
    
    def __str__(self):
        return f"Use case for {self.technique.name}"

class TechniqueLimitation(models.Model):
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE, related_name='limitations')
    description = models.TextField()
    
    class Meta:
        db_table = 'technique_limitation'
        verbose_name_plural = "Technique Limitations"
    
    def __str__(self):
        return f"Limitation for {self.technique.name}"

# Flexible attribute system
class TechniqueAttribute(models.Model):
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE, related_name='attributes')
    attribute_value = models.ForeignKey(AttributeValue, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'technique_attribute'
        unique_together = ('technique', 'attribute_value')
        verbose_name_plural = "Technique Attributes"
    
    def __str__(self):
        return f"{self.technique.name} - {self.attribute_value}"

# Resource management
class TechniqueResource(models.Model):
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE, related_name='resources')
    resource_type = models.ForeignKey(ResourceType, on_delete=models.PROTECT)
    title = models.CharField(max_length=255)
    url = models.URLField()
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'technique_resource'
        unique_together = ('technique', 'url')
        verbose_name_plural = "Technique Resources"
    
    def __str__(self):
        return f"{self.resource_type.name}: {self.title}"

class TechniqueTag(models.Model):
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        db_table = 'technique_tag'
        verbose_name_plural = "Technique Tags"
        unique_together = ('technique', 'tag')

    def __str__(self):
        return f"{self.technique.name} - {self.tag.name}"

# TechniqueFairnessApproach and TechniqueProjectLifecycleStage models have been removed as part of the cleanup
    
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