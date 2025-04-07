from __future__ import annotations

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class AssuranceGoal(models.Model):
    """
    Represents a high-level assurance goal for AI systems.

    Assurance goals are the broadest categorization of techniques, representing
    what the technique aims to achieve in terms of AI safety or quality assurance.
    Examples include fairness, robustness, explainability, etc.
    """

    name: models.CharField = models.CharField(max_length=255, unique=True)
    description: models.TextField = models.TextField()

    class Meta:
        db_table = "assurance_goal"
        verbose_name_plural = "Assurance Goals"

    def __str__(self) -> str:
        return self.name


class Category(models.Model):
    """
    Represents a category within an assurance goal.

    Categories provide the second level of classification for techniques,
    organizing techniques into logical groups under each assurance goal.
    A category belongs to exactly one assurance goal.
    """

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    assurance_goal = models.ForeignKey(AssuranceGoal, on_delete=models.CASCADE)

    class Meta:
        db_table = "category"
        verbose_name_plural = "Categories"
        unique_together = ("name", "assurance_goal")

    def __str__(self) -> str:
        return f"{self.name} ({self.assurance_goal.name})"


class SubCategory(models.Model):
    """
    Represents a subcategory within a category.

    Subcategories provide the third level of classification for techniques,
    allowing for more specific grouping of related techniques.
    A subcategory belongs to exactly one category.
    """

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="subcategories"
    )

    class Meta:
        db_table = "subcategory"
        verbose_name_plural = "Subcategories"
        unique_together = ("name", "category")

    def __str__(self) -> str:
        return f"{self.name} ({self.category.name})"


class Tag(models.Model):
    """
    Represents a generic tag that can be applied to techniques.

    Tags provide a flexible, non-hierarchical way to classify techniques
    based on various attributes or properties, complementing the hierarchical
    classification system of goals, categories, and subcategories.
    """

    name = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = "tag"

    def __str__(self) -> str:
        return self.name


class ResourceType(models.Model):
    """
    Represents a type of resource associated with techniques.

    Resource types categorize the different kinds of resources that can be
    linked to techniques, such as papers, websites, tools, implementations, etc.
    """

    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = "resource_type"

    def __str__(self) -> str:
        return self.name


class Technique(models.Model):
    """
    Represents an AI assurance technique.

    This is the central model in the application, representing individual techniques
    that can be applied to AI systems for various assurance purposes. Each technique
    includes detailed information about its purpose, implementation, cost, and
    relationships to goals, categories, and other classification systems.
    """

    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    model_dependency = models.CharField(max_length=100)
    complexity_rating = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    computational_cost_rating = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    applicable_models = models.JSONField(
        null=True,
        blank=True,
        help_text="List of model types this technique is applicable to (for model-specific techniques)",
    )
    assurance_goals = models.ManyToManyField(AssuranceGoal, related_name="techniques")
    categories = models.ManyToManyField(Category, related_name="techniques")
    subcategories = models.ManyToManyField(
        SubCategory, related_name="techniques", blank=True
    )
    tags = models.ManyToManyField(Tag, related_name="techniques", blank=True)

    class Meta:
        db_table = "technique"

    def __str__(self) -> str:
        return self.name


class AttributeType(models.Model):
    """
    Represents a type of attribute that can characterize techniques.

    Attribute types define various characteristics by which techniques can be
    described, such as 'prerequisites', 'output format', 'implementation complexity', etc.
    These provide a flexible way to add structured metadata to techniques.
    """

    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "attribute_type"

    def __str__(self) -> str:
        return self.name


class AttributeValue(models.Model):
    """
    Represents a specific value for an attribute type, associated with a technique.

    AttributeValue links a technique to a specific value for a given attribute type,
    creating a flexible system for storing structured metadata about techniques.
    For example, a technique might have an attribute type of 'Implementation Effort'
    with a value of 'High'.
    """

    attribute_type = models.ForeignKey(
        AttributeType, on_delete=models.CASCADE, related_name="values"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    technique = models.ForeignKey(
        Technique, on_delete=models.CASCADE, related_name="attribute_values"
    )

    class Meta:
        db_table = "attribute_value"
        unique_together = ("attribute_type", "name", "technique")

    def __str__(self) -> str:
        return f"{self.attribute_type.name}: {self.name}"


class TechniqueResource(models.Model):
    """
    Represents an external resource associated with a technique.

    TechniqueResource stores references to external materials related to a technique,
    such as academic papers, websites, code repositories, tools, etc. These resources
    provide additional information, implementations, or examples of the technique.
    """

    technique = models.ForeignKey(
        Technique, on_delete=models.CASCADE, related_name="resources"
    )
    resource_type = models.ForeignKey(ResourceType, on_delete=models.PROTECT)
    title = models.CharField(max_length=255)
    url = models.URLField()
    description = models.TextField(blank=True)
    authors = models.CharField(max_length=500, blank=True, null=True)
    publication_date = models.DateField(blank=True, null=True)
    source_type = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        db_table = "technique_resource"
        unique_together = ("technique", "url")

    def __str__(self) -> str:
        return f"{self.resource_type.name}: {self.title}"


class TechniqueExampleUseCase(models.Model):
    """
    Represents an example use case for a technique.

    TechniqueExampleUseCase stores concrete examples of how a technique can be
    applied in practice, providing context for users to understand when and how
    to use the technique. Each use case can be associated with a specific assurance
    goal to clarify its purpose.
    """

    technique = models.ForeignKey(
        Technique, on_delete=models.CASCADE, related_name="example_use_cases"
    )
    description = models.TextField()
    assurance_goal = models.ForeignKey(
        AssuranceGoal, on_delete=models.CASCADE, null=True, blank=True
    )

    class Meta:
        db_table = "technique_example_use_case"

    def __str__(self) -> str:
        return f"Use case for {self.technique.name}"


class TechniqueLimitation(models.Model):
    """
    Represents a limitation or constraint of a technique.

    TechniqueLimitation documents the known limitations, constraints, or cautionary
    notes about a technique. This helps users understand the boundaries and potential
    drawbacks of each technique, enabling more informed decisions about when to apply it.
    """

    technique = models.ForeignKey(
        Technique, on_delete=models.CASCADE, related_name="limitations"
    )
    description = models.TextField()

    class Meta:
        db_table = "technique_limitation"

    def __str__(self) -> str:
        return f"Limitation for {self.technique.name}"
