# api/views/api_views.py

from __future__ import annotations

from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import Request
from rest_framework.permissions import BasePermission, IsAuthenticated, AllowAny

from ..permissions import ReadOnlyOrModeratorPermission, AdminOnlyWritePermission
from django_filters.rest_framework import DjangoFilterBackend
from django.db import connection
import logging
from typing import Any, List, Type

from ..models import (
    AssuranceGoal,
    Tag,
    ResourceType,
    Technique,
)
from ..serializers import (
    AssuranceGoalSerializer,
    TagSerializer,
    TechniqueSerializer,
    ResourceTypeSerializer,
)

# Set up logger
logger = logging.getLogger(__name__)


class AssuranceGoalsViewSet(viewsets.ModelViewSet):
    queryset = AssuranceGoal.objects.all()
    serializer_class = AssuranceGoalSerializer
    permission_classes = [AdminOnlyWritePermission]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["name"]
    search_fields = ["name", "description"]
    ordering_fields = ["id", "name"]


class TagsViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [AdminOnlyWritePermission]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["name"]
    search_fields = ["name"]
    ordering_fields = ["id", "name"]


class TechniquesViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Techniques that provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions.

    Uses role-based permissions: read access for all, write access for editors/admins.
    """

    queryset = Technique.objects.all()
    serializer_class = TechniqueSerializer
    permission_classes = [ReadOnlyOrModeratorPermission]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = [
        "name",
        "assurance_goals",
        "tags",
    ]
    search_fields = ["name", "description"]
    ordering_fields = ["id", "name"]

    def get_serializer_class(self) -> Type[TechniqueSerializer]:
        """Return appropriate serializer class based on action."""
        return TechniqueSerializer

    def get_queryset(self):
        """Get queryset with optimized prefetching for related entities."""
        return Technique.objects.all().prefetch_related(
            "assurance_goals",
            "tags",
            "related_techniques",
            "resources__resource_type",  # Optimize nested FK lookup
            "example_use_cases__assurance_goal",  # Optimize nested FK lookup
            "limitations",
        )

    def list(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Standard list method for techniques"""
        return super().list(request, *args, **kwargs)

    def retrieve(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Standard retrieve method for techniques"""
        return super().retrieve(request, *args, **kwargs)

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Create a new technique."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()  # Removed unused 'instance' variable

        # Return the created instance
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request: Request, *args: Any, **kwargs: Any) -> Response:
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
    queryset = ResourceType.objects.all()
    serializer_class = ResourceTypeSerializer
    permission_classes = [AdminOnlyWritePermission]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["name"]
    search_fields = ["name"]
    ordering_fields = ["id", "name"]


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request: Request) -> Response:
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
        logger.error(f"Health check failed: {str(e)}")
        return Response(
            {
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e),
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )


@api_view(["GET", "POST"])
def debug_endpoint(
    request: Request,
) -> Response:  # noqa: C901 # Ignore complexity for debug view
    """
    Debugging endpoint with restricted access.

    Only available in development mode (DEBUG=True).
    """
    from django.conf import settings

    # Only allow debug endpoint in development
    if not settings.DEBUG:
        return Response(
            {"error": "Debug endpoint not available in production"},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == "GET":
        # Return connection information for debugging

        # Safe version of settings that doesn't expose sensitive information
        safe_settings = {
            "DEBUG": settings.DEBUG,
            "ALLOWED_HOSTS": settings.ALLOWED_HOSTS,
            "CORS_ALLOWED_ORIGINS": getattr(
                settings, "CORS_ALLOWED_ORIGINS", "Not set"
            ),
            "CORS_ALLOW_ALL_ORIGINS": getattr(
                settings, "CORS_ALLOW_ALL_ORIGINS", "Not set"
            ),
            "DATABASE_ENGINE": settings.DATABASES["default"]["ENGINE"],
            "INSTALLED_APPS": settings.INSTALLED_APPS,
            "MIDDLEWARE": settings.MIDDLEWARE,
        }

        # Get current database connection info
        db_info = {
            "vendor": connection.vendor,
            "queries_executed": (
                len(connection.queries) if settings.DEBUG else "Query logging disabled"
            ),
            "is_usable": connection.is_usable(),
        }

        # Return model information for debugging
        assurance_goals_count = AssuranceGoal.objects.count()
        tags_count = Tag.objects.count()
        techniques_count = Technique.objects.count()

        response_data = {
            "api_status": "API is running correctly",
            "request_info": {
                "path": request.path,
                "host": request.get_host(),
                "method": request.method,
                "content_type": request.content_type or "Not set",
                "headers": {
                    k: v
                    for k, v in request.headers.items()
                    if k.lower() not in ("cookie", "authorization")
                },
            },
            "database_info": db_info,
            "database_counts": {
                "assurance_goals": assurance_goals_count,
                "tags": tags_count,
                "techniques": techniques_count,
            },
            "api_endpoints": {
                "assurance_goals": "/api/assurance-goals/",
                "tags": "/api/tags/",
                "techniques": "/api/techniques/",
                "debug": "/api/debug/",
            },
            "settings": safe_settings,
        }

        return Response(response_data)

    elif request.method == "POST":
        # Echo back received data for debugging
        return Response(
            {
                "api_status": "API is running correctly",
                "received_data": request.data,
                "content_type": request.content_type,
                "method": request.method,
                "headers": {
                    k: v
                    for k, v in request.headers.items()
                    if k.lower() not in ("cookie", "authorization")
                },
            }
        )

    # Default fallback response - should never reach here due to DRF's api_view decorator
    return Response(
        {"error": "Unsupported HTTP method"}, status=status.HTTP_405_METHOD_NOT_ALLOWED
    )
