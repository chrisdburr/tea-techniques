"""
Service layer for handling complex business logic operations.

This module contains service classes that encapsulate complex business logic
and operations that were previously embedded in serializers or views.
"""

from __future__ import annotations

import logging
from typing import Any

from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import URLValidator
from django.db import transaction

from .models import (
    AssuranceGoal,
    ResourceType,
    Technique,
    TechniqueExampleUseCase,
    TechniqueLimitation,
    TechniqueResource,
)

logger = logging.getLogger(__name__)


class TechniqueOperationError(Exception):
    """Custom exception for technique operations."""


class TechniqueService:
    """
    Service class for handling complex technique operations.

    This service encapsulates the complex logic for creating and updating
    techniques with their relationships, making the code more testable
    and maintainable.
    """

    def __init__(self):
        """Initialize the service with specialized service instances."""
        self.resource_service = TechniqueResourceService()
        self.use_case_service = TechniqueUseCaseService()
        self.limitation_service = TechniqueLimitationService()

    @transaction.atomic
    def create_technique(self, validated_data: dict[str, Any], request_data: dict[str, Any]) -> Technique:
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
            technique = Technique(**validated_data)
            technique.full_clean()  # Trigger validation
            technique.save()

            # Set M2M relationships
            self._set_m2m_relationships(technique, m2m_data)

            # Create nested objects
            self._create_nested_objects(technique, nested_data)

            return technique

        except Exception as e:
            logger.error("Error creating technique: %s", str(e))
            raise TechniqueOperationError(f"Failed to create technique: {e!s}") from e

    @transaction.atomic
    def update_technique(
        self,
        technique: Technique,
        validated_data: dict[str, Any],
        request_data: dict[str, Any],
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

            # Check if slug is changing - if so, handle it last for atomicity
            slug_changing = "slug" in validated_data and validated_data["slug"] != technique.slug
            new_slug = validated_data.pop("slug", None) if slug_changing else None

            # Update basic fields (excluding slug for now)
            self._update_basic_fields(technique, validated_data)

            # Update M2M relationships if provided
            self._update_m2m_relationships(technique, m2m_data)

            # Update nested objects
            self._update_nested_objects(technique, nested_data)

            # Handle slug change last, after all other operations succeed
            if slug_changing and new_slug:
                self._update_technique_slug(technique, new_slug)

            return technique

        except Exception as e:
            logger.error("Error updating technique %s: %s", technique.slug, str(e))
            raise TechniqueOperationError(f"Failed to update technique: {e!s}") from e

    def _extract_m2m_relationships(self, validated_data: dict[str, Any]) -> dict[str, Any]:
        """Extract M2M relationship data from validated data."""
        return {
            "assurance_goals": validated_data.pop("assurance_goals", None),
            "tags": validated_data.pop("tags", None),
            "related_techniques": validated_data.pop("related_techniques", None),
        }

    def _extract_nested_data(self, request_data: dict[str, Any]) -> dict[str, Any]:
        """Extract nested relationship data from request data."""
        return {
            "resources": request_data.get("resources"),
            "example_use_cases": request_data.get("example_use_cases"),
            "limitations": request_data.get("limitations"),
        }

    def _set_m2m_relationships(self, technique: Technique, m2m_data: dict[str, Any]) -> None:
        """Set M2M relationships for the technique."""
        if m2m_data["assurance_goals"] is not None:
            technique.assurance_goals.set(m2m_data["assurance_goals"])
        if m2m_data["tags"] is not None:
            technique.tags.set(m2m_data["tags"])
        if m2m_data["related_techniques"] is not None:
            technique.related_techniques.set(m2m_data["related_techniques"])

    def _update_m2m_relationships(self, technique: Technique, m2m_data: dict[str, Any]) -> None:
        """Update M2M relationships for the technique (only if provided)."""
        if m2m_data["assurance_goals"] is not None:
            technique.assurance_goals.set(m2m_data["assurance_goals"])
        if m2m_data["tags"] is not None:
            technique.tags.set(m2m_data["tags"])
        if m2m_data["related_techniques"] is not None:
            technique.related_techniques.set(m2m_data["related_techniques"])

    def _update_basic_fields(self, technique: Technique, validated_data: dict[str, Any]) -> None:
        """Update basic fields of the technique (excluding slug)."""
        for attr, value in validated_data.items():
            setattr(technique, attr, value)
        technique.save()

    def _update_technique_slug(self, technique: Technique, new_slug: str) -> None:
        """Update technique slug (primary key) while preserving all relationships using Django ORM."""
        from .models import TechniqueExampleUseCase, TechniqueLimitation, TechniqueResource

        # Store all the technique data we need to preserve
        technique_data = {
            "name": technique.name,
            "acronym": technique.acronym,
            "description": technique.description,
            "complexity_rating": technique.complexity_rating,
            "computational_cost_rating": technique.computational_cost_rating,
        }

        # Store related data before making changes
        assurance_goals = list(technique.assurance_goals.all())
        tags = list(technique.tags.all())
        related_techniques_from = list(technique.related_techniques.all())
        related_techniques_to = list(technique.technique_set.all())  # type: ignore[attr-defined]

        # Store related objects data with their IDs to preserve them
        resources_data = []
        for resource in technique.resources.all():  # type: ignore[attr-defined]
            resources_data.append(
                {
                    "id": resource.id,
                    "resource_type": resource.resource_type,
                    "title": resource.title,
                    "url": resource.url,
                    "description": resource.description,
                    "authors": resource.authors,
                    "publication_date": resource.publication_date,
                    "source_type": resource.source_type,
                }
            )

        use_cases_data = []
        for use_case in technique.example_use_cases.all():  # type: ignore[attr-defined]
            use_cases_data.append(
                {
                    "id": use_case.id,
                    "description": use_case.description,
                    "assurance_goal": use_case.assurance_goal,
                }
            )

        limitations_data = []
        for limitation in technique.limitations.all():  # type: ignore[attr-defined]
            limitations_data.append(
                {
                    "id": limitation.id,
                    "description": limitation.description,
                }
            )

        # Use a nested transaction to ensure atomicity
        with transaction.atomic():
            # Temporarily clear M2M relationships to avoid constraint issues
            technique.assurance_goals.clear()
            technique.tags.clear()
            technique.related_techniques.clear()

            # Clear reverse M2M relationships
            for related_tech in related_techniques_to:
                related_tech.related_techniques.remove(technique)

            # Delete the old technique first to free up constraints
            technique.delete()

            # Create new technique with new slug
            new_technique = Technique.objects.create(slug=new_slug, **technique_data)

            # Restore M2M relationships
            new_technique.assurance_goals.set(assurance_goals)
            new_technique.tags.set(tags)
            new_technique.related_techniques.set(related_techniques_from)
            for related_tech in related_techniques_to:
                related_tech.related_techniques.add(new_technique)

            # Recreate related objects with preserved IDs
            for resource_data in resources_data:
                resource_id = resource_data.pop("id")
                new_resource = TechniqueResource(id=resource_id, technique=new_technique, **resource_data)
                new_resource.save()

            for use_case_data in use_cases_data:
                use_case_id = use_case_data.pop("id")
                new_use_case = TechniqueExampleUseCase(id=use_case_id, technique=new_technique, **use_case_data)
                new_use_case.save()

            for limitation_data in limitations_data:
                limitation_id = limitation_data.pop("id")
                new_limitation = TechniqueLimitation(id=limitation_id, technique=new_technique, **limitation_data)
                new_limitation.save()

        # Update the original technique reference to point to the new one
        technique.pk = new_technique.pk
        technique.slug = new_technique.slug
        # Copy all the new technique's attributes to the original object
        for attr, value in technique_data.items():
            setattr(technique, attr, value)

    def _create_nested_objects(self, technique: Technique, nested_data: dict[str, Any]) -> None:
        """Create all nested objects for the technique."""
        if nested_data["resources"]:
            self._create_resources(technique, nested_data["resources"])
        if nested_data["example_use_cases"]:
            self._create_use_cases(technique, nested_data["example_use_cases"])
        if nested_data["limitations"]:
            self._create_limitations(technique, nested_data["limitations"])

    def _create_resources(self, technique: Technique, resources_data: list[dict[str, Any]]) -> None:
        """Create resources for a technique."""
        self.resource_service.create_resources(technique, resources_data)

    def _replace_resources(self, technique: Technique, resources_data: list[dict[str, Any]]) -> None:
        """Replace resources for a technique."""
        self.resource_service.replace_resources(technique, resources_data)

    def _create_use_cases(self, technique: Technique, use_cases_data: list[dict[str, Any]]) -> None:
        """Create use cases for a technique."""
        self.use_case_service.create_use_cases(technique, use_cases_data)

    def _replace_use_cases(self, technique: Technique, use_cases_data: list[dict[str, Any]]) -> None:
        """Replace use cases for a technique."""
        self.use_case_service.replace_use_cases(technique, use_cases_data)

    def _create_limitations(self, technique: Technique, limitations_data: list[Any]) -> None:
        """Create limitations for a technique."""
        self.limitation_service.create_limitations(technique, limitations_data)

    def _replace_limitations(self, technique: Technique, limitations_data: list[Any]) -> None:
        """Replace limitations for a technique."""
        self.limitation_service.replace_limitations(technique, limitations_data)

    def _update_nested_objects(self, technique: Technique, nested_data: dict[str, Any]) -> None:
        """Update all nested objects for the technique."""
        if nested_data["resources"] is not None:
            self._replace_resources(technique, nested_data["resources"])
        if nested_data["example_use_cases"] is not None:
            self._replace_use_cases(technique, nested_data["example_use_cases"])
        if nested_data["limitations"] is not None:
            self._replace_limitations(technique, nested_data["limitations"])


class TechniqueResourceService:
    """Service for handling technique resource operations."""

    @transaction.atomic
    def create_resources(self, technique: Technique, resources_data: list[dict[str, Any]]) -> None:
        """Create resources for a technique."""
        for resource_data in resources_data:
            self._create_single_resource(technique, resource_data)

    @transaction.atomic
    def replace_resources(self, technique: Technique, resources_data: list[dict[str, Any]]) -> None:
        """Replace all existing resources with new ones."""
        # Delete existing resources
        technique.resources.all().delete()  # type: ignore[attr-defined]
        # Create new resources
        self.create_resources(technique, resources_data)

    def _create_single_resource(self, technique: Technique, resource_data: dict[str, Any]) -> None:
        """Create a single resource for a technique."""
        # Convert resource_type ID to instance if needed
        resource_data_copy = resource_data.copy()
        if "resource_type" in resource_data_copy and isinstance(resource_data_copy["resource_type"], int):
            try:
                resource_data_copy["resource_type"] = ResourceType.objects.get(pk=resource_data_copy["resource_type"])
            except ResourceType.DoesNotExist as e:
                raise TechniqueOperationError(
                    f"ResourceType with ID {resource_data_copy['resource_type']} does not exist"
                ) from e

        try:
            # Validate URL format if present
            if "url" in resource_data_copy:
                url = resource_data_copy["url"]
                # Only allow http and https protocols
                if not (url.startswith("http://") or url.startswith("https://")):
                    raise TechniqueOperationError(
                        f"Invalid URL format: {url}. Only HTTP and HTTPS protocols are allowed."
                    )

                validator = URLValidator()
                try:
                    validator(url)
                except DjangoValidationError as e:
                    raise TechniqueOperationError(f"Invalid URL format: {url}") from e

            TechniqueResource.objects.create(technique=technique, **resource_data_copy)
        except Exception as e:
            if not isinstance(e, TechniqueOperationError):
                logger.error("Failed to create resource: %s", str(e))
                raise TechniqueOperationError(f"Failed to create resource: {e!s}") from e
            raise


class TechniqueUseCaseService:
    """Service for handling technique use case operations."""

    @transaction.atomic
    def create_use_cases(self, technique: Technique, use_cases_data: list[dict[str, Any]]) -> None:
        """Create use cases for a technique."""
        for use_case_data in use_cases_data:
            self._create_single_use_case(technique, use_case_data)

    @transaction.atomic
    def replace_use_cases(self, technique: Technique, use_cases_data: list[dict[str, Any]]) -> None:
        """Replace all existing use cases with new ones."""
        # Delete existing use cases
        technique.example_use_cases.all().delete()  # type: ignore[attr-defined]
        # Create new use cases
        self.create_use_cases(technique, use_cases_data)

    def _create_single_use_case(self, technique: Technique, use_case_data: dict[str, Any]) -> None:
        """Create a single use case for a technique."""
        # Validate required fields
        if not use_case_data.get("description", "").strip():
            raise TechniqueOperationError("Use case description cannot be empty")

        # Convert assurance_goal ID to instance if needed
        use_case_data_copy = use_case_data.copy()
        if "assurance_goal" in use_case_data_copy and isinstance(use_case_data_copy["assurance_goal"], int):
            try:
                use_case_data_copy["assurance_goal"] = AssuranceGoal.objects.get(
                    pk=use_case_data_copy["assurance_goal"]
                )
            except AssuranceGoal.DoesNotExist:
                logger.warning(
                    "AssuranceGoal %s not found, setting to None",
                    use_case_data_copy["assurance_goal"],
                )
                use_case_data_copy["assurance_goal"] = None

        try:
            TechniqueExampleUseCase.objects.create(technique=technique, **use_case_data_copy)
        except Exception as e:
            if not isinstance(e, TechniqueOperationError):
                logger.error("Failed to create use case: %s", str(e))
                raise TechniqueOperationError(f"Failed to create use case: {e!s}") from e
            raise


class TechniqueLimitationService:
    """Service for handling technique limitation operations."""

    @transaction.atomic
    def create_limitations(self, technique: Technique, limitations_data: list[Any]) -> None:
        """Create limitations for a technique."""
        for limitation_data in limitations_data:
            self._create_single_limitation(technique, limitation_data)

    @transaction.atomic
    def replace_limitations(self, technique: Technique, limitations_data: list[Any]) -> None:
        """Replace all existing limitations with new ones."""
        # Delete existing limitations
        technique.limitations.all().delete()  # type: ignore[attr-defined]
        # Create new limitations
        self.create_limitations(technique, limitations_data)

    def _create_single_limitation(self, technique: Technique, limitation_data: Any) -> None:
        """Create a single limitation for a technique."""
        try:
            if isinstance(limitation_data, str):
                # Handle simple string format
                TechniqueLimitation.objects.create(technique=technique, description=limitation_data)
            else:
                # Handle dict format
                TechniqueLimitation.objects.create(technique=technique, **limitation_data)
        except Exception as e:
            if not isinstance(e, TechniqueOperationError):
                logger.error("Failed to create limitation: %s", str(e))
                raise TechniqueOperationError(f"Failed to create limitation: {e!s}") from e
            raise
