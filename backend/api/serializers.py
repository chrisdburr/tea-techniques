# api/serializers.py
"""
Serializers for the API application.

This module contains serializers for all models in the API application.
Serializers handle converting between Python objects and JSON representations,
as well as validation of input data.
"""

from __future__ import annotations

from rest_framework import serializers
import logging
from typing import List, Optional

from .models import (
    AssuranceGoal,
    Tag,
    ResourceType,
    Technique,
    TechniqueResource,
    TechniqueExampleUseCase,
    TechniqueLimitation,
)
from .services import TechniqueService, TechniqueOperationError

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
    technique = serializers.PrimaryKeyRelatedField(
        queryset=Technique.objects.all(),
        write_only=True
    )

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
        import re
        url_pattern = re.compile(
            r'^https?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        
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
    technique = serializers.PrimaryKeyRelatedField(
        queryset=Technique.objects.all(),
        write_only=True
    )

    class Meta:
        model = TechniqueExampleUseCase
        fields = ["id", "technique", "description", "assurance_goal", "assurance_goal_name"]

    def get_assurance_goal_name(self, obj: TechniqueExampleUseCase) -> Optional[str]:
        """Return the name of the associated assurance goal, or None if not set."""
        if obj.assurance_goal:
            return obj.assurance_goal.name
        return None


class TechniqueLimitationSerializer(serializers.ModelSerializer):
    """
    Serializer for the TechniqueLimitation model.

    Includes id and description fields for output, and accepts technique for input.
    """

    technique = serializers.PrimaryKeyRelatedField(
        queryset=Technique.objects.all(),
        write_only=True
    )

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
    related_techniques = serializers.SlugRelatedField(many=True, read_only=True, slug_field='slug')
    
    # Writable ID fields (for input)
    assurance_goal_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=AssuranceGoal.objects.all(),
        write_only=True,
        required=False,
        source='assurance_goals'
    )
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Tag.objects.all(),
        write_only=True,
        required=False,
        source='tags'
    )
    related_technique_slugs = serializers.SlugRelatedField(
        many=True,
        queryset=Technique.objects.all(),
        slug_field='slug',
        write_only=True,
        required=False,
        source='related_techniques'
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
            request = self.context.get('request', {})
            request_data = getattr(request, 'data', {}) or {}
            return self.technique_service.create_technique(validated_data, request_data)
        except TechniqueOperationError as e:
            logger.error(f"Technique creation failed: {str(e)}")
            raise serializers.ValidationError(f"Failed to create technique: {str(e)}")

    def update(self, instance, validated_data):
        """
        Update an existing technique with relationships using TechniqueService.
        
        Delegates complex update logic to the service layer for better
        testability and maintainability.
        """
        try:
            request = self.context.get('request', {})
            request_data = getattr(request, 'data', {}) or {}
            return self.technique_service.update_technique(instance, validated_data, request_data)
        except TechniqueOperationError as e:
            logger.error(f"Technique update failed: {str(e)}")
            raise serializers.ValidationError(f"Failed to update technique: {str(e)}")
