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

    class Meta:
        model = TechniqueResource
        fields = [
            "id",
            "resource_type",
            "resource_type_name",
            "title",
            "url",
            "description",
            "authors",
            "publication_date",
            "source_type",
        ]


class TechniqueExampleUseCaseSerializer(serializers.ModelSerializer):
    """
    Serializer for the TechniqueExampleUseCase model.

    Includes the name of the associated AssuranceGoal as a computed field.
    Handles the case where assurance_goal might be None.
    """

    assurance_goal_name = serializers.SerializerMethodField()

    class Meta:
        model = TechniqueExampleUseCase
        fields = ["id", "description", "assurance_goal", "assurance_goal_name"]

    def get_assurance_goal_name(self, obj: TechniqueExampleUseCase) -> Optional[str]:
        """Return the name of the associated assurance goal, or None if not set."""
        if obj.assurance_goal:
            return obj.assurance_goal.name
        return None


class TechniqueLimitationSerializer(serializers.ModelSerializer):
    """
    Serializer for the TechniqueLimitation model.

    Only includes the id and description fields.
    """

    class Meta:
        model = TechniqueLimitation
        fields = ["id", "description"]


class TechniqueSerializer(serializers.ModelSerializer):
    """
    Serializer for the Technique model.

    Includes nested serializers for all related models, providing a comprehensive
    representation of a technique and all its associated data. All relationship
    fields are read-only in this serializer.
    """

    # Relationship fields
    assurance_goals = AssuranceGoalSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    related_techniques = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    
    # Additional relationship fields
    resources = TechniqueResourceSerializer(many=True, read_only=True)
    example_use_cases = TechniqueExampleUseCaseSerializer(many=True, read_only=True)
    limitations = TechniqueLimitationSerializer(many=True, read_only=True)

    class Meta:
        model = Technique
        fields = [
            "id",
            "name",
            "description",
            "complexity_rating",
            "computational_cost_rating",
            "assurance_goals",
            "tags",
            "related_techniques",
            "resources",
            "example_use_cases",
            "limitations",
        ]
