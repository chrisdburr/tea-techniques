"""
Service layer for handling complex business logic operations.

This module contains service classes that encapsulate complex business logic
and operations that were previously embedded in serializers or views.
"""

from __future__ import annotations

import logging
from typing import Dict, List, Any, Optional
from django.db import transaction
from django.core.exceptions import ValidationError

from .models import (
    AssuranceGoal,
    Tag,
    ResourceType,
    Technique,
    TechniqueResource,
    TechniqueExampleUseCase,
    TechniqueLimitation,
)

logger = logging.getLogger(__name__)


class TechniqueOperationError(Exception):
    """Custom exception for technique operations."""
    pass


class TechniqueService:
    """
    Service class for handling complex technique operations.
    
    This service encapsulates the complex logic for creating and updating
    techniques with their relationships, making the code more testable
    and maintainable.
    """

    @transaction.atomic
    def create_technique(
        self, 
        validated_data: Dict[str, Any], 
        request_data: Dict[str, Any]
    ) -> Technique:
        """
        Create a new technique with all its relationships.
        
        Args:
            validated_data: Validated data from the serializer
            request_data: Raw request data containing nested relationships
            
        Returns:
            The created Technique instance
            
        Raises:
            TechniqueOperationError: If technique creation fails
        """
        try:
            # Extract M2M relationships
            m2m_data = self._extract_m2m_relationships(validated_data)
            
            # Extract nested data
            nested_data = self._extract_nested_data(request_data)
            
            # Create the technique
            technique = Technique.objects.create(**validated_data)
            
            # Set M2M relationships
            self._set_m2m_relationships(technique, m2m_data)
            
            # Create nested objects
            self._create_nested_objects(technique, nested_data)
            
            return technique
            
        except Exception as e:
            logger.error(f"Error creating technique: {str(e)}")
            raise TechniqueOperationError(f"Failed to create technique: {str(e)}") from e

    @transaction.atomic
    def update_technique(
        self, 
        technique: Technique, 
        validated_data: Dict[str, Any], 
        request_data: Dict[str, Any]
    ) -> Technique:
        """
        Update an existing technique with all its relationships.
        
        Args:
            technique: The technique instance to update
            validated_data: Validated data from the serializer
            request_data: Raw request data containing nested relationships
            
        Returns:
            The updated Technique instance
            
        Raises:
            TechniqueOperationError: If technique update fails
        """
        try:
            # Extract M2M relationships
            m2m_data = self._extract_m2m_relationships(validated_data)
            
            # Extract nested data
            nested_data = self._extract_nested_data(request_data)
            
            # Update basic fields
            self._update_basic_fields(technique, validated_data)
            
            # Update M2M relationships if provided
            self._update_m2m_relationships(technique, m2m_data)
            
            # Update nested objects
            self._update_nested_objects(technique, nested_data)
            
            return technique
            
        except Exception as e:
            logger.error(f"Error updating technique {technique.id}: {str(e)}")
            raise TechniqueOperationError(f"Failed to update technique: {str(e)}") from e

    def _extract_m2m_relationships(self, validated_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract M2M relationship data from validated data."""
        return {
            'assurance_goals': validated_data.pop('assurance_goals', None),
            'tags': validated_data.pop('tags', None),
            'related_techniques': validated_data.pop('related_techniques', None),
        }

    def _extract_nested_data(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract nested relationship data from request data."""
        return {
            'resources': request_data.get('resources', None),
            'example_use_cases': request_data.get('example_use_cases', None),
            'limitations': request_data.get('limitations', None),
        }

    def _set_m2m_relationships(self, technique: Technique, m2m_data: Dict[str, Any]) -> None:
        """Set M2M relationships for the technique."""
        if m2m_data['assurance_goals'] is not None:
            technique.assurance_goals.set(m2m_data['assurance_goals'])
        if m2m_data['tags'] is not None:
            technique.tags.set(m2m_data['tags'])
        if m2m_data['related_techniques'] is not None:
            technique.related_techniques.set(m2m_data['related_techniques'])

    def _update_m2m_relationships(self, technique: Technique, m2m_data: Dict[str, Any]) -> None:
        """Update M2M relationships for the technique (only if provided)."""
        if m2m_data['assurance_goals'] is not None:
            technique.assurance_goals.set(m2m_data['assurance_goals'])
        if m2m_data['tags'] is not None:
            technique.tags.set(m2m_data['tags'])
        if m2m_data['related_techniques'] is not None:
            technique.related_techniques.set(m2m_data['related_techniques'])

    def _update_basic_fields(self, technique: Technique, validated_data: Dict[str, Any]) -> None:
        """Update basic fields of the technique."""
        for attr, value in validated_data.items():
            setattr(technique, attr, value)
        technique.save()

    def _create_nested_objects(self, technique: Technique, nested_data: Dict[str, Any]) -> None:
        """Create all nested objects for the technique."""
        if nested_data['resources']:
            self._create_resources(technique, nested_data['resources'])
        if nested_data['example_use_cases']:
            self._create_use_cases(technique, nested_data['example_use_cases'])
        if nested_data['limitations']:
            self._create_limitations(technique, nested_data['limitations'])

    def _update_nested_objects(self, technique: Technique, nested_data: Dict[str, Any]) -> None:
        """Update all nested objects for the technique."""
        if nested_data['resources'] is not None:
            self._replace_resources(technique, nested_data['resources'])
        if nested_data['example_use_cases'] is not None:
            self._replace_use_cases(technique, nested_data['example_use_cases'])
        if nested_data['limitations'] is not None:
            self._replace_limitations(technique, nested_data['limitations'])


class TechniqueResourceService:
    """Service for handling technique resource operations."""

    def create_resources(self, technique: Technique, resources_data: List[Dict[str, Any]]) -> None:
        """Create resources for a technique."""
        for resource_data in resources_data:
            self._create_single_resource(technique, resource_data)

    def replace_resources(self, technique: Technique, resources_data: List[Dict[str, Any]]) -> None:
        """Replace all existing resources with new ones."""
        # Delete existing resources
        technique.resources.all().delete()
        # Create new resources
        self.create_resources(technique, resources_data)

    def _create_single_resource(self, technique: Technique, resource_data: Dict[str, Any]) -> None:
        """Create a single resource for a technique."""
        # Convert resource_type ID to instance if needed
        resource_data_copy = resource_data.copy()
        if 'resource_type' in resource_data_copy and isinstance(resource_data_copy['resource_type'], int):
            try:
                resource_data_copy['resource_type'] = ResourceType.objects.get(
                    pk=resource_data_copy['resource_type']
                )
            except ResourceType.DoesNotExist:
                logger.warning(f"ResourceType {resource_data_copy['resource_type']} not found")
                return

        TechniqueResource.objects.create(technique=technique, **resource_data_copy)


class TechniqueUseCaseService:
    """Service for handling technique use case operations."""

    def create_use_cases(self, technique: Technique, use_cases_data: List[Dict[str, Any]]) -> None:
        """Create use cases for a technique."""
        for use_case_data in use_cases_data:
            self._create_single_use_case(technique, use_case_data)

    def replace_use_cases(self, technique: Technique, use_cases_data: List[Dict[str, Any]]) -> None:
        """Replace all existing use cases with new ones."""
        # Delete existing use cases
        technique.example_use_cases.all().delete()
        # Create new use cases
        self.create_use_cases(technique, use_cases_data)

    def _create_single_use_case(self, technique: Technique, use_case_data: Dict[str, Any]) -> None:
        """Create a single use case for a technique."""
        # Convert assurance_goal ID to instance if needed
        use_case_data_copy = use_case_data.copy()
        if ('assurance_goal' in use_case_data_copy and 
            isinstance(use_case_data_copy['assurance_goal'], int)):
            try:
                use_case_data_copy['assurance_goal'] = AssuranceGoal.objects.get(
                    pk=use_case_data_copy['assurance_goal']
                )
            except AssuranceGoal.DoesNotExist:
                logger.warning(f"AssuranceGoal {use_case_data_copy['assurance_goal']} not found")
                use_case_data_copy['assurance_goal'] = None

        TechniqueExampleUseCase.objects.create(technique=technique, **use_case_data_copy)


class TechniqueLimitationService:
    """Service for handling technique limitation operations."""

    def create_limitations(self, technique: Technique, limitations_data: List[Any]) -> None:
        """Create limitations for a technique."""
        for limitation_data in limitations_data:
            self._create_single_limitation(technique, limitation_data)

    def replace_limitations(self, technique: Technique, limitations_data: List[Any]) -> None:
        """Replace all existing limitations with new ones."""
        # Delete existing limitations
        technique.limitations.all().delete()
        # Create new limitations
        self.create_limitations(technique, limitations_data)

    def _create_single_limitation(self, technique: Technique, limitation_data: Any) -> None:
        """Create a single limitation for a technique."""
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


# Extend TechniqueService with the specialized services
class TechniqueService(TechniqueService):
    """Extended TechniqueService with specialized service integration."""

    def __init__(self):
        self.resource_service = TechniqueResourceService()
        self.use_case_service = TechniqueUseCaseService()
        self.limitation_service = TechniqueLimitationService()

    def _create_resources(self, technique: Technique, resources_data: List[Dict[str, Any]]) -> None:
        """Create resources using the specialized service."""
        self.resource_service.create_resources(technique, resources_data)

    def _replace_resources(self, technique: Technique, resources_data: List[Dict[str, Any]]) -> None:
        """Replace resources using the specialized service."""
        self.resource_service.replace_resources(technique, resources_data)

    def _create_use_cases(self, technique: Technique, use_cases_data: List[Dict[str, Any]]) -> None:
        """Create use cases using the specialized service."""
        self.use_case_service.create_use_cases(technique, use_cases_data)

    def _replace_use_cases(self, technique: Technique, use_cases_data: List[Dict[str, Any]]) -> None:
        """Replace use cases using the specialized service."""
        self.use_case_service.replace_use_cases(technique, use_cases_data)

    def _create_limitations(self, technique: Technique, limitations_data: List[Any]) -> None:
        """Create limitations using the specialized service."""
        self.limitation_service.create_limitations(technique, limitations_data)

    def _replace_limitations(self, technique: Technique, limitations_data: List[Any]) -> None:
        """Replace limitations using the specialized service."""
        self.limitation_service.replace_limitations(technique, limitations_data)