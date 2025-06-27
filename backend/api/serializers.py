# api/serializers.py
"""
Serializers for the API application.

This module contains serializers for all models in the API application.
Serializers handle converting between Python objects and JSON representations,
as well as validation of input data.
"""

from __future__ import annotations

import logging
from typing import Optional

from rest_framework import serializers

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
    resource_type = serializers.PrimaryKeyRelatedField(
        queryset=ResourceType.objects.all(),
        required=True
    )

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
        read_only_fields = ['id']


class TechniqueExampleUseCaseSerializer(serializers.ModelSerializer):
    """
    Serializer for the TechniqueExampleUseCase model.

    Includes the name of the associated AssuranceGoal as a computed field.
    Handles the case where assurance_goal might be None.
    """

    assurance_goal_name = serializers.SerializerMethodField()
    assurance_goal = serializers.PrimaryKeyRelatedField(
        queryset=AssuranceGoal.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = TechniqueExampleUseCase
        fields = ["id", "description", "assurance_goal", "assurance_goal_name"]
        read_only_fields = ['id']

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
        read_only_fields = ['id']


class TechniqueSerializer(serializers.ModelSerializer):
    """
    Serializer for the Technique model.

    Includes nested serializers for all related models, providing a comprehensive
    representation of a technique and all its associated data. Supports both reading
    and writing relationships through ID fields and nested serializers.
    """

    # Read-only relationship fields (for output)
    assurance_goals = AssuranceGoalSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    related_techniques = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    
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
    related_technique_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Technique.objects.all(),
        write_only=True,
        required=False,
        source='related_techniques'
    )
    
    # Nested relationship fields - now writable
    resources = TechniqueResourceSerializer(many=True, required=False)
    example_use_cases = TechniqueExampleUseCaseSerializer(many=True, required=False)
    limitations = TechniqueLimitationSerializer(many=True, required=False)

    class Meta:
        model = Technique
        fields = [
            "id",
            "name",
            "description",
            "complexity_rating",
            "computational_cost_rating",
            "assurance_goals",
            "assurance_goal_ids",
            "tags",
            "tag_ids",
            "related_techniques",
            "related_technique_ids",
            "resources",
            "example_use_cases",
            "limitations",
        ]

    def create(self, validated_data):
        """
        Create a new technique with relationships.
        
        Uses DRF's built-in support for nested serializers to handle
        related object creation automatically.
        """
        # Extract M2M relationships
        assurance_goals = validated_data.pop('assurance_goals', [])
        tags = validated_data.pop('tags', [])
        related_techniques = validated_data.pop('related_techniques', [])
        
        # Extract nested data
        resources_data = validated_data.pop('resources', [])
        example_use_cases_data = validated_data.pop('example_use_cases', [])
        limitations_data = validated_data.pop('limitations', [])
        
        # Create the technique
        technique = Technique.objects.create(**validated_data)
        
        # Set M2M relationships
        technique.assurance_goals.set(assurance_goals)
        technique.tags.set(tags)
        technique.related_techniques.set(related_techniques)
        
        # Create nested objects using serializers
        for resource_data in resources_data:
            resource_data['technique'] = technique
            resource_serializer = TechniqueResourceSerializer(data=resource_data)
            resource_serializer.is_valid(raise_exception=True)
            resource_serializer.save(technique=technique)
        
        for use_case_data in example_use_cases_data:
            use_case_data['technique'] = technique
            use_case_serializer = TechniqueExampleUseCaseSerializer(data=use_case_data)
            use_case_serializer.is_valid(raise_exception=True)
            use_case_serializer.save(technique=technique)
        
        for limitation_data in limitations_data:
            # Handle both string and dict formats
            if isinstance(limitation_data, str):
                limitation_data = {'description': limitation_data}
            limitation_data['technique'] = technique
            limitation_serializer = TechniqueLimitationSerializer(data=limitation_data)
            limitation_serializer.is_valid(raise_exception=True)
            limitation_serializer.save(technique=technique)
        
        return technique

    def update(self, instance, validated_data):
        """
        Update an existing technique with relationships.
        
        Uses DRF's built-in support for nested serializers to handle
        related object updates automatically.
        """
        # Extract M2M relationships
        assurance_goals = validated_data.pop('assurance_goals', None)
        tags = validated_data.pop('tags', None)
        related_techniques = validated_data.pop('related_techniques', None)
        
        # Extract nested data
        resources_data = validated_data.pop('resources', None)
        example_use_cases_data = validated_data.pop('example_use_cases', None)
        limitations_data = validated_data.pop('limitations', None)
        
        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update M2M relationships if provided
        if assurance_goals is not None:
            instance.assurance_goals.set(assurance_goals)
        if tags is not None:
            instance.tags.set(tags)
        if related_techniques is not None:
            instance.related_techniques.set(related_techniques)
        
        # Update nested objects if provided
        if resources_data is not None:
            # Delete existing and create new
            instance.resources.all().delete()
            for resource_data in resources_data:
                resource_data['technique'] = instance
                resource_serializer = TechniqueResourceSerializer(data=resource_data)
                resource_serializer.is_valid(raise_exception=True)
                resource_serializer.save(technique=instance)
        
        if example_use_cases_data is not None:
            # Delete existing and create new
            instance.example_use_cases.all().delete()
            for use_case_data in example_use_cases_data:
                use_case_data['technique'] = instance
                use_case_serializer = TechniqueExampleUseCaseSerializer(data=use_case_data)
                use_case_serializer.is_valid(raise_exception=True)
                use_case_serializer.save(technique=instance)
        
        if limitations_data is not None:
            # Delete existing and create new
            instance.limitations.all().delete()
            for limitation_data in limitations_data:
                # Handle both string and dict formats
                if isinstance(limitation_data, str):
                    limitation_data = {'description': limitation_data}
                limitation_data['technique'] = instance
                limitation_serializer = TechniqueLimitationSerializer(data=limitation_data)
                limitation_serializer.is_valid(raise_exception=True)
                limitation_serializer.save(technique=instance)
        
        return instance
