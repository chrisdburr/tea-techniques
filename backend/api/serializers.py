# api/serializers.py
"""
Serializers for the API application.

This module contains serializers for all models in the API application.
Serializers handle converting between Python objects and JSON representations,
as well as validation of input data.
"""

from __future__ import annotations

import logging
import re

from django.utils.text import slugify
from rest_framework import serializers

from .models import (
    AssuranceGoal,
    ResourceType,
    Tag,
    Technique,
    TechniqueExampleUseCase,
    TechniqueLimitation,
    TechniqueResource,
)
from .services import TechniqueOperationError, TechniqueService

# Set up logger
logger = logging.getLogger(__name__)


class AssuranceGoalSerializer(serializers.ModelSerializer):
    """
    Serializer for the AssuranceGoal model.

    Serializes all fields of the AssuranceGoal model without any additional fields.
    """

    class Meta:
        model = AssuranceGoal
        fields = "__all__"


class TagSerializer(serializers.ModelSerializer):
    """
    Serializer for the Tag model.

    Serializes all fields of the Tag model without any additional fields.
    """

    class Meta:
        model = Tag
        fields = "__all__"


class ResourceTypeSerializer(serializers.ModelSerializer):
    """
    Serializer for the ResourceType model.

    Serializes all fields of the ResourceType model without any additional fields.
    """

    class Meta:
        model = ResourceType
        fields = "__all__"


class TechniqueResourceSerializer(serializers.ModelSerializer):
    """
    Serializer for the TechniqueResource model.

    Includes the name of the associated ResourceType as a read-only field.
    """

    resource_type_name = serializers.ReadOnlyField(source="resource_type.name")
    technique = serializers.SlugRelatedField(queryset=Technique.objects.all(), slug_field="slug", write_only=True)

    class Meta:
        model = TechniqueResource
        fields = [
            "id",
            "technique",
            "resource_type",
            "resource_type_name",
            "title",
            "url",
            "description",
            "authors",
            "publication_date",
            "source_type",
        ]

    def validate_url(self, value):
        """Validate URL format."""

        url_pattern = re.compile(
            r"^https?://"  # http:// or https://
            r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|"  # domain...
            r"localhost|"  # localhost...
            r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"  # ...or ip
            r"(?::\d+)?"  # optional port
            r"(?:/?|[/?]\S+)$",
            re.IGNORECASE,
        )

        if not url_pattern.match(value):
            raise serializers.ValidationError("Enter a valid URL.")
        return value


class TechniqueExampleUseCaseSerializer(serializers.ModelSerializer):
    """
    Serializer for the TechniqueExampleUseCase model.

    Includes the name of the associated AssuranceGoal as a computed field.
    Handles the case where assurance_goal might be None.
    """

    assurance_goal_name = serializers.SerializerMethodField()
    technique = serializers.SlugRelatedField(queryset=Technique.objects.all(), slug_field="slug", write_only=True)

    class Meta:
        model = TechniqueExampleUseCase
        fields = [
            "id",
            "technique",
            "description",
            "assurance_goal",
            "assurance_goal_name",
        ]

    def get_assurance_goal_name(self, obj: TechniqueExampleUseCase) -> str | None:
        """Return the name of the associated assurance goal, or None if not set."""
        if obj.assurance_goal:
            return obj.assurance_goal.name
        return None


class TechniqueLimitationSerializer(serializers.ModelSerializer):
    """
    Serializer for the TechniqueLimitation model.

    Includes id and description fields for output, and accepts technique for input.
    """

    technique = serializers.SlugRelatedField(queryset=Technique.objects.all(), slug_field="slug", write_only=True)

    class Meta:
        model = TechniqueLimitation
        fields = ["id", "technique", "description"]


class TechniqueSerializer(serializers.ModelSerializer):
    """
    Serializer for the Technique model.

    Includes nested serializers for all related models, providing a comprehensive
    representation of a technique and all its associated data. Supports both reading
    and writing relationships through ID fields.

    Uses TechniqueService for complex creation and update operations.
    """

    # Read-only relationship fields (for output)
    assurance_goals = AssuranceGoalSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    related_techniques = serializers.SlugRelatedField(many=True, read_only=True, slug_field="slug")

    # Writable ID fields (for input)
    assurance_goal_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=AssuranceGoal.objects.all(),
        write_only=True,
        required=False,
        source="assurance_goals",
    )
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Tag.objects.all(),
        write_only=True,
        required=False,
        source="tags",
    )
    related_technique_slugs = serializers.SlugRelatedField(
        many=True,
        queryset=Technique.objects.all(),
        slug_field="slug",
        write_only=True,
        required=False,
        source="related_techniques",
    )

    # Nested relationship fields
    resources = TechniqueResourceSerializer(many=True, read_only=True)
    example_use_cases = TechniqueExampleUseCaseSerializer(many=True, read_only=True)
    limitations = TechniqueLimitationSerializer(many=True, read_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.technique_service = TechniqueService()

    class Meta:
        model = Technique
        fields = [
            "slug",
            "name",
            "acronym",
            "description",
            "complexity_rating",
            "computational_cost_rating",
            "assurance_goals",
            "assurance_goal_ids",
            "tags",
            "tag_ids",
            "related_techniques",
            "related_technique_slugs",
            "resources",
            "example_use_cases",
            "limitations",
        ]
        extra_kwargs = {
            "slug": {"required": False},  # Slug will be auto-generated if not provided
            "acronym": {"required": False},  # Acronym will be auto-generated if not provided
        }

    def _extract_acronym_from_name(self, name: str) -> str | None:
        """Extract acronym from technique name if it contains one in parentheses."""
        match = re.search(r"\(([A-Z]{2,})\)", name)
        if match:
            return match.group(1)
        return None

    def _generate_slug_from_name(self, name: str) -> str:
        """Generate a slug from technique name, handling acronyms properly."""
        # Remove acronyms in parentheses for slug generation
        clean_name = re.sub(r"\s*\([^)]*\)", "", name)
        # Create slug
        slug = slugify(clean_name)
        # Check for uniqueness and add suffix if needed
        original_slug = slug
        counter = 1
        while Technique.objects.filter(slug=slug).exists():
            slug = f"{original_slug}-{counter}"
            counter += 1
        return slug

    def validate(self, attrs):
        """Validate and auto-generate slug and acronym if not provided."""
        # Only auto-generate slug for new instances (not updates)
        if not self.instance:  # This is a create operation
            # Auto-generate slug if not provided
            if "slug" not in attrs or not attrs["slug"]:
                if "name" in attrs:
                    attrs["slug"] = self._generate_slug_from_name(attrs["name"])
                else:
                    raise serializers.ValidationError({"name": "Name is required to generate slug."})

            # Auto-generate acronym if not provided
            if "acronym" not in attrs and "name" in attrs:
                attrs["acronym"] = self._extract_acronym_from_name(attrs["name"])
        else:  # This is an update operation
            # For updates, only auto-generate acronym if name is changing and acronym isn't provided
            if "name" in attrs and "acronym" not in attrs:
                attrs["acronym"] = self._extract_acronym_from_name(attrs["name"])

        return super().validate(attrs)

    def validate_complexity_rating(self, value):
        """Validate complexity rating is between 1 and 5."""
        if value is not None and (value < 1 or value > 5):
            raise serializers.ValidationError("Complexity rating must be between 1 and 5.")
        return value

    def validate_computational_cost_rating(self, value):
        """Validate computational cost rating is between 1 and 5."""
        if value is not None and (value < 1 or value > 5):
            raise serializers.ValidationError("Computational cost rating must be between 1 and 5.")
        return value

    def create(self, validated_data):
        """
        Create a new technique with relationships using TechniqueService.

        Delegates complex creation logic to the service layer for better
        testability and maintainability.
        """
        try:
            request = self.context.get("request", {})
            request_data = getattr(request, "data", {}) or {}
            return self.technique_service.create_technique(validated_data, request_data)
        except TechniqueOperationError as e:
            logger.error("Technique creation failed: %s", str(e))
            raise serializers.ValidationError(f"Failed to create technique: {e!s}")

    def update(self, instance, validated_data):
        """
        Update an existing technique with relationships using TechniqueService.

        Delegates complex update logic to the service layer for better
        testability and maintainability.
        """
        try:
            request = self.context.get("request", {})
            request_data = getattr(request, "data", {}) or {}
            return self.technique_service.update_technique(instance, validated_data, request_data)
        except TechniqueOperationError as e:
            logger.error("Technique update failed: %s", str(e))
            raise serializers.ValidationError(f"Failed to update technique: {e!s}")
