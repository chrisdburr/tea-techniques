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
from typing import Any, Dict, List, Optional, Union, cast

from .models import (
    AssuranceGoal,
    Category,
    SubCategory,
    Tag,
    ResourceType,
    Technique,
    AttributeType,
    AttributeValue,
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


class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for the Category model.
    
    Includes the name of the associated AssuranceGoal as a read-only field.
    """
    assurance_goal_name = serializers.ReadOnlyField(source="assurance_goal.name")

    class Meta:
        model = Category
        fields = ["id", "name", "description", "assurance_goal", "assurance_goal_name"]


class SubCategorySerializer(serializers.ModelSerializer):
    """
    Serializer for the SubCategory model.
    
    Includes the name of the associated Category as a read-only field.
    """
    category_name = serializers.ReadOnlyField(source="category.name")

    class Meta:
        model = SubCategory
        fields = ["id", "name", "description", "category", "category_name"]


class TagSerializer(serializers.ModelSerializer):
    """
    Serializer for the Tag model.
    
    Serializes all fields of the Tag model without any additional fields.
    """
    class Meta:
        model = Tag
        fields = "__all__"


class AttributeTypeSerializer(serializers.ModelSerializer):
    """
    Serializer for the AttributeType model.
    
    Serializes all fields of the AttributeType model without any additional fields.
    """
    class Meta:
        model = AttributeType
        fields = "__all__"


class AttributeValueSerializer(serializers.ModelSerializer):
    """
    Serializer for the AttributeValue model.
    
    Includes the name of the associated AttributeType as a read-only field.
    """
    attribute_type_name = serializers.ReadOnlyField(source="attribute_type.name")

    class Meta:
        model = AttributeValue
        fields = [
            "id",
            "attribute_type",
            "attribute_type_name",
            "name",
            "description",
            "technique",
        ]


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
    categories = CategorySerializer(many=True, read_only=True)
    subcategories = SubCategorySerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    # Additional relationship fields - note the change from attributes to attribute_values
    attribute_values = AttributeValueSerializer(many=True, read_only=True)
    resources = TechniqueResourceSerializer(many=True, read_only=True)
    example_use_cases = TechniqueExampleUseCaseSerializer(many=True, read_only=True)
    limitations = TechniqueLimitationSerializer(many=True, read_only=True)
    
    # Add a dummy field for applicable_models if it doesn't exist in the database
    applicable_models = serializers.SerializerMethodField()
    
    def get_applicable_models(self, obj: Technique) -> List[str]:
        """
        Get the applicable_models field from the Technique object.
        Returns an empty list if the field doesn't exist or is None.
        """
        return obj.applicable_models or []

    class Meta:
        model = Technique
        fields = [
            "id",
            "name",
            "description",
            "model_dependency",
            "category_tags",
            "complexity_rating",
            "computational_cost_rating",
            "assurance_goals",
            "categories",
            "subcategories",
            "tags",
            "attribute_values",
            "resources",
            "example_use_cases",
            "limitations",
            "applicable_models",
        ]
