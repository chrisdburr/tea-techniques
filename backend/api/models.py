from __future__ import annotations

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """
    Custom user model with role-based access control.
    
    Extends Django's AbstractUser to add role-based permissions
    for controlling access to different parts of the application.
    """
    
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        MODERATOR = 'moderator', 'Moderator'
        USER = 'user', 'User'
    
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.USER,
        help_text="User's role determining their permissions"
    )
    
    class Meta:
        pass
    
    def is_admin(self) -> bool:
        """Check if user has admin role."""
        return self.role == self.Role.ADMIN
    
    def is_moderator(self) -> bool:
        """Check if user has moderator role or higher."""
        return self.role in [self.Role.ADMIN, self.Role.MODERATOR]
    
    def is_authenticated_user(self) -> bool:
        """Check if user is authenticated (all signed-in users)."""
        return self.role in [self.Role.ADMIN, self.Role.MODERATOR, self.Role.USER]
    
    def can_suggest_changes(self) -> bool:
        """Check if user can suggest changes to techniques."""
        return self.role in [self.Role.ADMIN, self.Role.MODERATOR, self.Role.USER]
    
    def can_approve_suggestions(self) -> bool:
        """Check if user can approve suggestions and edit techniques."""
        return self.role in [self.Role.ADMIN, self.Role.MODERATOR]
    
    def can_delete_techniques(self) -> bool:
        """Check if user can delete techniques."""
        return self.role == self.Role.ADMIN
    
    def can_manage_users(self) -> bool:
        """Check if user can promote users to moderator."""
        return self.role == self.Role.ADMIN


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
    complexity_rating = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    computational_cost_rating = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    assurance_goals = models.ManyToManyField(AssuranceGoal, related_name="techniques")
    tags = models.ManyToManyField(Tag, related_name="techniques", blank=True)
    related_techniques = models.ManyToManyField('self', blank=True, symmetrical=False)

    class Meta:
        db_table = "technique"

    def __str__(self) -> str:
        return self.name




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


class TechniqueSuggestion(models.Model):
    """
    Represents a suggestion for creating or modifying a technique.
    
    TechniqueSuggestion allows authenticated users to suggest changes to existing
    techniques or propose new techniques. Moderators and admins can review and
    approve these suggestions.
    """
    
    class SuggestionType(models.TextChoices):
        CREATE = 'create', 'Create New Technique'
        EDIT = 'edit', 'Edit Existing Technique'
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending Review'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
    
    # Suggestion metadata
    suggestion_type = models.CharField(max_length=10, choices=SuggestionType.choices)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    
    # User who made the suggestion
    suggested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='technique_suggestions')
    
    # Moderator who reviewed (if any)
    reviewed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='reviewed_suggestions'
    )
    
    # If editing an existing technique
    original_technique = models.ForeignKey(
        Technique, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='suggestions'
    )
    
    # Suggested changes (stored as JSON)
    suggested_name = models.CharField(max_length=255)
    suggested_description = models.TextField()
    suggested_complexity_rating = models.PositiveSmallIntegerField(
        null=True, 
        blank=True, 
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    suggested_computational_cost_rating = models.PositiveSmallIntegerField(
        null=True, 
        blank=True, 
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    
    # Suggestion notes
    suggestion_notes = models.TextField(
        blank=True, 
        help_text="Additional notes or reasoning for the suggestion"
    )
    
    # Review notes
    review_notes = models.TextField(
        blank=True, 
        help_text="Notes from the moderator during review"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = "technique_suggestion"
        ordering = ['-created_at']
    
    def __str__(self) -> str:
        action = "Create" if self.suggestion_type == self.SuggestionType.CREATE else "Edit"
        target = self.suggested_name if self.suggestion_type == self.SuggestionType.CREATE else self.original_technique.name
        return f"{action} suggestion for '{target}' by {self.suggested_by.username}"
