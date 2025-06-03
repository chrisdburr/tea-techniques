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
    representation of a technique and all its associated data. Supports both reading
    and writing relationships through ID fields.
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
    
    # Nested relationship fields
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
        
        Handles creation of the technique and all its relationships including
        assurance goals, tags, related techniques, resources, example use cases,
        and limitations.
        """
        # Extract M2M relationships
        assurance_goals = validated_data.pop('assurance_goals', [])
        tags = validated_data.pop('tags', [])
        related_techniques = validated_data.pop('related_techniques', [])
        
        # Extract nested data from request context
        resources_data = self.context.get('request').data.get('resources', [])
        example_use_cases_data = self.context.get('request').data.get('example_use_cases', [])
        limitations_data = self.context.get('request').data.get('limitations', [])
        
        # Create the technique
        technique = Technique.objects.create(**validated_data)
        
        # Set M2M relationships
        technique.assurance_goals.set(assurance_goals)
        technique.tags.set(tags)
        technique.related_techniques.set(related_techniques)
        
        # Create resources
        for resource_data in resources_data:
            # Convert resource_type ID to instance if needed
            resource_data_copy = resource_data.copy()
            if 'resource_type' in resource_data_copy and isinstance(resource_data_copy['resource_type'], int):
                resource_data_copy['resource_type'] = ResourceType.objects.get(pk=resource_data_copy['resource_type'])
            TechniqueResource.objects.create(technique=technique, **resource_data_copy)
        
        # Create example use cases
        for use_case_data in example_use_cases_data:
            # Convert assurance_goal ID to instance if needed
            use_case_data_copy = use_case_data.copy()
            if 'assurance_goal' in use_case_data_copy and isinstance(use_case_data_copy['assurance_goal'], int):
                use_case_data_copy['assurance_goal'] = AssuranceGoal.objects.get(pk=use_case_data_copy['assurance_goal'])
            TechniqueExampleUseCase.objects.create(technique=technique, **use_case_data_copy)
        
        # Create limitations
        for limitation_data in limitations_data:
            if isinstance(limitation_data, str):
                # Handle simple string format
                TechniqueLimitation.objects.create(
                    technique=technique,
                    description=limitation_data
                )
            else:
                # Handle dict format
                TechniqueLimitation.objects.create(
                    technique=technique,
                    **limitation_data
                )
        
        return technique

    def update(self, instance, validated_data):
        """
        Update an existing technique with relationships.
        
        Updates the technique and all its relationships. Replaces existing
        relationships with the new data provided.
        """
        # Extract M2M relationships
        assurance_goals = validated_data.pop('assurance_goals', None)
        tags = validated_data.pop('tags', None)
        related_techniques = validated_data.pop('related_techniques', None)
        
        # Extract nested data from request context
        request_data = self.context.get('request').data
        resources_data = request_data.get('resources', None)
        example_use_cases_data = request_data.get('example_use_cases', None)
        limitations_data = request_data.get('limitations', None)
        
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
        
        # Update resources if provided
        if resources_data is not None:
            # Delete existing resources
            instance.resources.all().delete()
            # Create new resources
            for resource_data in resources_data:
                # Convert resource_type ID to instance if needed
                resource_data_copy = resource_data.copy()
                if 'resource_type' in resource_data_copy and isinstance(resource_data_copy['resource_type'], int):
                    resource_data_copy['resource_type'] = ResourceType.objects.get(pk=resource_data_copy['resource_type'])
                TechniqueResource.objects.create(technique=instance, **resource_data_copy)
        
        # Update example use cases if provided
        if example_use_cases_data is not None:
            # Delete existing use cases
            instance.example_use_cases.all().delete()
            # Create new use cases
            for use_case_data in example_use_cases_data:
                # Convert assurance_goal ID to instance if needed
                use_case_data_copy = use_case_data.copy()
                if 'assurance_goal' in use_case_data_copy and isinstance(use_case_data_copy['assurance_goal'], int):
                    use_case_data_copy['assurance_goal'] = AssuranceGoal.objects.get(pk=use_case_data_copy['assurance_goal'])
                TechniqueExampleUseCase.objects.create(technique=instance, **use_case_data_copy)
        
        # Update limitations if provided
        if limitations_data is not None:
            # Delete existing limitations
            instance.limitations.all().delete()
            # Create new limitations
            for limitation_data in limitations_data:
                if isinstance(limitation_data, str):
                    # Handle simple string format
                    TechniqueLimitation.objects.create(
                        technique=instance,
                        description=limitation_data
                    )
                else:
                    # Handle dict format
                    TechniqueLimitation.objects.create(
                        technique=instance,
                        **limitation_data
                    )
        
        return instance
