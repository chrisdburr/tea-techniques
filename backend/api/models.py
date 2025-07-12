from __future__ import annotations

from typing import TYPE_CHECKING

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

if TYPE_CHECKING:
    pass


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
        """Return the string representation of the AssuranceGoal."""
        return str(self.name)


class Tag(models.Model):
    """
    Represents a generic tag that can be applied to techniques.

    Tags provide a flexible, non-hierarchical way to classify techniques
    based on various attributes or properties, complementing the hierarchical
    classification system of goals, categories, and subcategories.
    """

    name: models.CharField = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = "tag"

    def __str__(self) -> str:
        """Return the string representation of the Tag."""
        return str(self.name)


class ResourceType(models.Model):
    """
    Represents a type of resource associated with techniques.

    Resource types categorize the different kinds of resources that can be
    linked to techniques, such as papers, websites, tools, implementations, etc.
    """

    name: models.CharField = models.CharField(max_length=100, unique=True)
    icon: models.CharField = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = "resource_type"

    def __str__(self) -> str:
        """Return the string representation of the ResourceType."""
        return str(self.name)


class Technique(models.Model):
    """
    Represents an AI assurance technique.

    This is the central model in the application, representing individual techniques
    that can be applied to AI systems for various assurance purposes. Each technique
    includes detailed information about its purpose, implementation, cost, and
    relationships to goals, categories, and other classification systems.
    """

    slug: models.SlugField = models.SlugField(
        max_length=100, unique=True, primary_key=True
    )
    name: models.CharField = models.CharField(max_length=255, unique=True)
    acronym: models.CharField = models.CharField(max_length=20, blank=True, null=True)
    description: models.TextField = models.TextField()
    complexity_rating: models.PositiveSmallIntegerField = (
        models.PositiveSmallIntegerField(
            null=True,
            blank=True,
            validators=[MinValueValidator(1), MaxValueValidator(5)],
        )
    )
    computational_cost_rating: models.PositiveSmallIntegerField = (
        models.PositiveSmallIntegerField(
            null=True,
            blank=True,
            validators=[MinValueValidator(1), MaxValueValidator(5)],
        )
    )
    assurance_goals: models.ManyToManyField = models.ManyToManyField(
        AssuranceGoal, related_name="techniques"
    )
    tags: models.ManyToManyField = models.ManyToManyField(
        Tag, related_name="techniques", blank=True
    )
    related_techniques: models.ManyToManyField = models.ManyToManyField(
        "self", blank=True, symmetrical=False
    )

    class Meta:
        db_table = "technique"

    def __str__(self) -> str:
        """Return the string representation of the Technique.

        If acronym exists, returns 'Name (ACRONYM)', otherwise just 'Name'.
        """
        if self.acronym:
            return f"{self.name} ({self.acronym})"
        return self.name


class TechniqueResource(models.Model):
    """
    Represents an external resource associated with a technique.

    TechniqueResource stores references to external materials related to a technique,
    such as academic papers, websites, code repositories, tools, etc. These resources
    provide additional information, implementations, or examples of the technique.
    """

    technique: models.ForeignKey = models.ForeignKey(
        Technique, on_delete=models.CASCADE, related_name="resources"
    )
    resource_type: models.ForeignKey = models.ForeignKey(
        ResourceType, on_delete=models.PROTECT
    )
    title: models.CharField = models.CharField(max_length=255)
    url: models.URLField = models.URLField()
    description: models.TextField = models.TextField(blank=True)
    authors: models.CharField = models.CharField(max_length=500, blank=True, null=True)
    publication_date: models.DateField = models.DateField(blank=True, null=True)
    source_type: models.CharField = models.CharField(
        max_length=100, blank=True, null=True
    )

    class Meta:
        db_table = "technique_resource"
        unique_together = ("technique", "url")

    def __str__(self) -> str:
        """Return the string representation of the TechniqueResource.

        Format: 'ResourceType: Title'
        """
        return f"{self.resource_type.name}: {self.title}"


class TechniqueExampleUseCase(models.Model):
    """
    Represents an example use case for a technique.

    TechniqueExampleUseCase stores concrete examples of how a technique can be
    applied in practice, providing context for users to understand when and how
    to use the technique. Each use case can be associated with a specific assurance
    goal to clarify its purpose.
    """

    technique: models.ForeignKey = models.ForeignKey(
        Technique, on_delete=models.CASCADE, related_name="example_use_cases"
    )
    description: models.TextField = models.TextField()
    assurance_goal: models.ForeignKey = models.ForeignKey(
        AssuranceGoal, on_delete=models.CASCADE, null=True, blank=True
    )

    class Meta:
        db_table = "technique_example_use_case"

    def __str__(self) -> str:
        """Return the string representation of the TechniqueExampleUseCase."""
        return f"Use case for {self.technique.name}"


class TechniqueLimitation(models.Model):
    """
    Represents a limitation or constraint of a technique.

    TechniqueLimitation documents the known limitations, constraints, or cautionary
    notes about a technique. This helps users understand the boundaries and potential
    drawbacks of each technique, enabling more informed decisions about when to apply it.
    """

    technique: models.ForeignKey = models.ForeignKey(
        Technique, on_delete=models.CASCADE, related_name="limitations"
    )
    description: models.TextField = models.TextField()

    class Meta:
        db_table = "technique_limitation"

    def __str__(self) -> str:
        """Return the string representation of the TechniqueLimitation."""
        return f"Limitation for {self.technique.name}"
