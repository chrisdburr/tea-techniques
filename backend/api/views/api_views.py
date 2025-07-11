# api/views/api_views.py

from __future__ import annotations

import logging
from typing import Any, List, Type

from django.db import connection
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from ..models import (
    AssuranceGoal,
    ResourceType,
    Tag,
    Technique,
)
from ..serializers import (
    AssuranceGoalSerializer,
    ResourceTypeSerializer,
    TagSerializer,
    TechniqueSerializer,
)

# Set up logger
logger = logging.getLogger(__name__)


class AssuranceGoalsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing AssuranceGoal instances.
    
    Provides CRUD operations for assurance goals with search and filtering capabilities.
    Read operations are allowed for any user, while write operations require authentication.
    """
    queryset = AssuranceGoal.objects.all()
    serializer_class = AssuranceGoalSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["name"]
    search_fields = ["name", "description"]
    ordering_fields = ["id", "name"]

    def get_permissions(self) -> List[BasePermission]:
        """
        Customize permissions based on action:
        - list and retrieve are allowed for any user (even unauthenticated)
        - create, update, delete require authentication
        """
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated()]
        # Default permission for list and retrieve
        return [AllowAny()]


class TagsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Tag instances.
    
    Provides CRUD operations for tags with search and filtering capabilities.
    Read operations are allowed for any user, while write operations require authentication.
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["name"]
    search_fields = ["name"]
    ordering_fields = ["id", "name"]

    def get_permissions(self) -> List[BasePermission]:
        """Require authentication for write operations"""
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated()]
        return [AllowAny()]


class TechniquesViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Techniques that provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions.

    Authentication is required for create, update, and delete operations.
    Uses slug-based lookups instead of numeric IDs.
    """

    queryset = Technique.objects.all()
    serializer_class = TechniqueSerializer
    lookup_field = "slug"
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = [
        "name",
        "slug",
        "acronym",
        "complexity_rating",
        "computational_cost_rating",
        "assurance_goals",
        "tags",
    ]
    search_fields = ["name", "description", "acronym"]
    ordering_fields = ["slug", "name", "complexity_rating", "computational_cost_rating"]

    def get_permissions(self) -> List[BasePermission]:
        """
        Customize permissions based on action:
        - list and retrieve are allowed for any user (even unauthenticated)
        - create, update, delete require authentication
        """
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated()]
        # Default permission for list and retrieve
        return [AllowAny()]

    def get_serializer_class(self) -> Type[TechniqueSerializer]:
        """Return appropriate serializer class based on action."""
        return TechniqueSerializer

    def get_queryset(self):
        """Get queryset with optimized prefetching for related entities."""
        return Technique.objects.all().prefetch_related(
            "assurance_goals",
            "tags",
            "related_techniques",
            "resources",
            "example_use_cases",
            "limitations",
        )


    def create(self, request: Request) -> Response:
        """Create a new technique."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()  # Removed unused 'instance' variable

        # Return the created instance
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request: Request, **kwargs: Any) -> Response:
        """Update a technique."""
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=kwargs.get("partial", False)
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()  # Removed unused 'updated_instance' variable

        # Return the updated instance
        return Response(serializer.data)


class ResourceTypesViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing ResourceType instances.
    
    Provides CRUD operations for resource types with search and filtering capabilities.
    Read operations are allowed for any user, while write operations require authentication.
    """
    queryset = ResourceType.objects.all()
    serializer_class = ResourceTypeSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["name"]
    search_fields = ["name"]
    ordering_fields = ["id", "name"]

    def get_permissions(self) -> List[BasePermission]:
        """Require authentication for write operations"""
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated()]
        return [AllowAny()]


@api_view(["GET"])
def health_check(_request: Request) -> Response:
    """
    Simple health check endpoint that verifies the API is running
    and the database connection is working.
    """
    try:
        # Check database connection by making a simple query
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            one = cursor.fetchone()[0]
            assert one == 1

        return Response(
            {
                "status": "healthy",
                "database": "connected",
                "api": "running",
            }
        )
    except Exception as e:
        logger.error("Health check failed: %s", str(e))
        return Response(
            {
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e),
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )


# Debug utility functions


def _sanitize_settings():
    """Extract and sanitize settings for debug output."""
    from django.conf import settings

    return {
        "DEBUG": settings.DEBUG,
        "ALLOWED_HOSTS": settings.ALLOWED_HOSTS,
        "CORS_ALLOWED_ORIGINS": getattr(settings, "CORS_ALLOWED_ORIGINS", "Not set"),
        "CORS_ALLOW_ALL_ORIGINS": getattr(
            settings, "CORS_ALLOW_ALL_ORIGINS", "Not set"
        ),
        "DATABASE_ENGINE": settings.DATABASES["default"]["ENGINE"],
        "INSTALLED_APPS": settings.INSTALLED_APPS,
        "MIDDLEWARE": settings.MIDDLEWARE,
    }


def _get_database_info():
    """Get current database connection information."""
    from django.conf import settings

    return {
        "vendor": connection.vendor,
        "queries_executed": (
            len(connection.queries) if settings.DEBUG else "Query logging disabled"
        ),
        "is_usable": connection.is_usable(),
    }


def _get_model_counts():
    """Get count of records in each model for debugging."""
    return {
        "assurance_goals": AssuranceGoal.objects.count(),
        "tags": Tag.objects.count(),
        "techniques": Technique.objects.count(),
    }


def _format_request_info(request: Request):
    """Format request information excluding sensitive data."""
    return {
        "path": request.path,
        "host": request.get_host(),
        "method": request.method,
        "content_type": request.content_type or "Not set",
        "headers": {
            k: v
            for k, v in request.headers.items()
            if k.lower() not in ("cookie", "authorization")
        },
    }


def _get_api_endpoints():
    """Get list of available API endpoints."""
    return {
        "assurance_goals": "/api/assurance-goals/",
        "tags": "/api/tags/",
        "techniques": "/api/techniques/",
        "debug": "/api/debug/",
    }


@api_view(["GET"])
def health_check_detailed(request: Request) -> Response:
    """Comprehensive health check with detailed system information."""
    from django.conf import settings

    # Only allow in development
    if not settings.DEBUG:
        return Response(
            {"error": "Detailed health check not available in production"},
            status=status.HTTP_403_FORBIDDEN,
        )

    response_data = {
        "api_status": "API is running correctly",
        "request_info": _format_request_info(request),
        "database_info": _get_database_info(),
        "database_counts": _get_model_counts(),
        "api_endpoints": _get_api_endpoints(),
        "settings": _sanitize_settings(),
    }

    return Response(response_data)


@api_view(["GET", "POST"])
def debug_echo(request: Request) -> Response:
    """Echo back received data for debugging POST requests."""
    from django.conf import settings

    # Only allow in development - check this before method validation
    if not settings.DEBUG:
        return Response(
            {"error": "Debug echo not available in production"},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Only allow POST method in production
    if request.method != "POST":
        return Response(
            {"error": "Debug echo only accepts POST requests"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    return Response(
        {
            "api_status": "API is running correctly",
            "received_data": request.data,
            "request_info": _format_request_info(request),
        }
    )
