# api/models_proposal.py

from django.db import models
from django.core.exceptions import ValidationError

class AssuranceGoal(models.Model):
    """
    Represents a high-level assurance goal such as Explainability, Fairness, Safety, Security, etc.
    """
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
    """
    Categories can be associated with multiple assurance goals, allowing for shared categories
    """
    name = models.CharField(unique=True, max_length=255)
    description = models.TextField()
    # Many-to-many relationship allowing categories to span multiple assurance goals
    assurance_goals = models.ManyToManyField(
        AssuranceGoal, 
        through='CategoryAssuranceGoal',
        related_name='categories'
    )

    class Meta:
        db_table = 'category'
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

    def clean(self):
        super().clean()
        if Category.objects.filter(name__iexact=self.name).exclude(id=self.id).exists():
            raise ValidationError({'name': 'Category with this name already exists.'})
    
    def natural_key(self):
        return (self.name,)

    @classmethod
    def get_by_natural_key(cls, name):
        return cls.objects.get(name=name)

class CategoryAssuranceGoal(models.Model):
    """
    Join table for the many-to-many relationship between Category and AssuranceGoal
    """
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    assurance_goal = models.ForeignKey(AssuranceGoal, on_delete=models.CASCADE)

    class Meta:
        db_table = 'category_assurance_goal'
        unique_together = ('category', 'assurance_goal')

    def __str__(self):
        return f"{self.category.name} - {self.assurance_goal.name}"

class SubCategory(models.Model):
    """
    Sub-categories can be associated with multiple categories, allowing for more flexibility
    """
    name = models.CharField(max_length=255)
    description = models.TextField()
    # Many-to-many relationship allowing subcategories to span multiple categories
    categories = models.ManyToManyField(
        Category, 
        through='SubCategoryCategory',
        related_name='subcategories'
    )

    class Meta:
        db_table = 'sub_category'
        verbose_name_plural = "Sub-Categories"

    def __str__(self):
        return self.name

    def clean(self):
        super().clean()
        # Check for duplicate name within the same category context
        for category in self.categories.all():
            if SubCategory.objects.filter(
                name__iexact=self.name,
                categories=category
            ).exclude(id=self.id).exists():
                raise ValidationError({'name': f'SubCategory with this name already exists in the {category.name} category.'})

class SubCategoryCategory(models.Model):
    """
    Join table for the many-to-many relationship between SubCategory and Category
    """
    subcategory = models.ForeignKey(SubCategory, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)

    class Meta:
        db_table = 'subcategory_category'
        unique_together = ('subcategory', 'category')
        verbose_name_plural = "Subcategory Categories"

    def __str__(self):
        return f"{self.subcategory.name} - {self.category.name}"

class Tag(models.Model):
    """
    General purpose tags for techniques
    """
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

class AttributeType(models.Model):
    """
    Defines types of attributes that can be associated with techniques
    Examples: Fairness Approach, Project Lifecycle Stage, Difficulty Level, etc.
    """
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    # Whether this attribute applies to all techniques or only specific assurance goals
    applies_to_all = models.BooleanField(default=False)
    # If applies_to_all is False, specify which assurance goals this applies to
    applicable_goals = models.ManyToManyField(
        AssuranceGoal, 
        blank=True,
        related_name='attribute_types'
    )
    # Whether this attribute can have multiple values per technique
    multi_valued = models.BooleanField(default=False)

    class Meta:
        db_table = 'attribute_type'
        verbose_name_plural = "Attribute Types"

    def __str__(self):
        return self.name

class AttributeValue(models.Model):
    """
    Possible values for attributes
    Examples: "Pre-processing" (for Fairness Approach), "Design Phase" (for Project Lifecycle)
    """
    attribute_type = models.ForeignKey(
        AttributeType, 
        on_delete=models.CASCADE, 
        related_name='values'
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'attribute_value'
        verbose_name_plural = "Attribute Values"
        unique_together = ('attribute_type', 'name')

    def __str__(self):
        return f"{self.attribute_type.name}: {self.name}"

class Technique(models.Model):
    """
    Core model for techniques with common fields
    Specific attributes handled through TechniqueAttribute model
    """
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    assurance_goal = models.ForeignKey(AssuranceGoal, on_delete=models.CASCADE)
    model_dependency = models.CharField(max_length=255)
    example_use_case = models.TextField(blank=True)
    reference = models.URLField(blank=True)
    software_package = models.URLField(blank=True)
    limitation = models.TextField(blank=True)
    
    # Categories and subcategories
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
    
    # Tags
    tags = models.ManyToManyField(
        Tag, 
        through='TechniqueTag', 
        blank=True,
        related_name='techniques'
    )
    
    # Dynamic attributes through TechniqueAttribute
    
    class Meta:
        db_table = 'technique'
        verbose_name_plural = "Techniques"

    def clean(self):
        super().clean()
        if Technique.objects.filter(name__iexact=self.name).exclude(id=self.id).exists():
            raise ValidationError({'name': 'A technique with this name already exists.'})

    def __str__(self):
        return self.name

class TechniqueCategory(models.Model):
    """
    Join table for the many-to-many relationship between Technique and Category
    """
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)

    class Meta:
        db_table = 'technique_category'
        unique_together = ('technique', 'category')
        verbose_name_plural = "Technique Categories"

    def __str__(self):
        return f"{self.technique.name} - {self.category.name}"

class TechniqueSubCategory(models.Model):
    """
    Join table for the many-to-many relationship between Technique and SubCategory
    """
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE)
    subcategory = models.ForeignKey(SubCategory, on_delete=models.CASCADE)

    class Meta:
        db_table = 'technique_sub_category'
        unique_together = ('technique', 'subcategory')
        verbose_name_plural = "Technique Sub-Categories"

    def __str__(self):
        return f"{self.technique.name} - {self.subcategory.name}"

class TechniqueTag(models.Model):
    """
    Join table for the many-to-many relationship between Technique and Tag
    """
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        db_table = 'technique_tag'
        verbose_name_plural = "Technique Tags"
        unique_together = ('technique', 'tag')

    def __str__(self):
        return f"{self.technique.name} - {self.tag.name}"

class TechniqueAttribute(models.Model):
    """
    Dynamic attributes for techniques
    Examples: Fairness approach, Project lifecycle stage, Difficulty level, etc.
    """
    technique = models.ForeignKey(
        Technique, 
        on_delete=models.CASCADE,
        related_name='attributes'
    )
    attribute_value = models.ForeignKey(
        AttributeValue, 
        on_delete=models.CASCADE,
        related_name='techniques'
    )
    # Additional fields could be added here if needed
    # e.g., order, priority, etc.

    class Meta:
        db_table = 'technique_attribute'
        unique_together = ('technique', 'attribute_value')
        verbose_name_plural = "Technique Attributes"

    def __str__(self):
        return f"{self.technique.name} - {self.attribute_value}"

    def clean(self):
        super().clean()
        # Validate that this attribute is applicable to the technique's assurance goal
        attr_type = self.attribute_value.attribute_type
        if not attr_type.applies_to_all and not attr_type.applicable_goals.filter(id=self.technique.assurance_goal_id).exists():
            raise ValidationError({
                'attribute_value': f'The attribute type "{attr_type.name}" is not applicable to ' 
                                f'the assurance goal "{self.technique.assurance_goal.name}".'
            })
        
        # Validate multi-valued constraints
        if not attr_type.multi_valued:
            # If this attribute type doesn't support multiple values, check if another already exists
            existing = TechniqueAttribute.objects.filter(
                technique=self.technique,
                attribute_value__attribute_type=attr_type
            ).exclude(id=self.id).exists()
            
            if existing:
                raise ValidationError({
                    'attribute_value': f'The attribute type "{attr_type.name}" does not support multiple values.'
                })

class TechniqueRelationship(models.Model):
    """
    Relationships between techniques
    """
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
    # Optional relationship type
    relationship_type = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'technique_relationship'
        unique_together = ('technique_from', 'technique_to', 'relationship_type')
        verbose_name_plural = "Technique Relationships"

    def __str__(self):
        relation = f" ({self.relationship_type})" if self.relationship_type else ""
        return f"{self.technique_from.name} → {self.technique_to.name}{relation}"