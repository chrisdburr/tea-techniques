# api/views/api_views.py

from __future__ import annotations

from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.permissions import BasePermission, IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.http import JsonResponse
from django.core import serializers
from django.views.decorators.csrf import csrf_exempt
from django.middleware.common import CommonMiddleware
from django.db import connection
import json
import logging
from typing import Any, Dict, List, Optional, Type, Union, cast

from ..models import (
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
from ..serializers import (
    AssuranceGoalSerializer,
    CategorySerializer,
    SubCategorySerializer,
    TagSerializer,
    TechniqueSerializer,
    AttributeTypeSerializer,
    AttributeValueSerializer,
    ResourceTypeSerializer,
    TechniqueResourceSerializer,
    TechniqueExampleUseCaseSerializer,
    TechniqueLimitationSerializer,
)

# Set up logger
logger = logging.getLogger(__name__)


class AssuranceGoalsViewSet(viewsets.ModelViewSet):
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
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        # Default permission for list and retrieve
        return [AllowAny()]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["name", "assurance_goal"]
    search_fields = ["name", "assurance_goal__name"]
    ordering_fields = ["id", "name"]
    
    def get_permissions(self) -> List[BasePermission]:
        """Require authentication for write operations"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]


class SubCategoryViewSet(viewsets.ModelViewSet):
    queryset = SubCategory.objects.all()
    serializer_class = SubCategorySerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["name", "category"]
    search_fields = ["name", "category__name"]
    ordering_fields = ["id", "name"]
    
    def get_permissions(self) -> List[BasePermission]:
        """Require authentication for write operations"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]


class TagsViewSet(viewsets.ModelViewSet):
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
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]


class TechniquesViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Techniques that provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions.
    
    Authentication is required for create, update, and delete operations.
    """

    queryset = Technique.objects.all()
    serializer_class = TechniqueSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = [
        "name",
        "model_dependency",
        "assurance_goals",
        "categories",
        "subcategories",
        "tags",
    ]
    search_fields = ["name", "description"]
    ordering_fields = ["id", "name"]
    
    def get_permissions(self) -> List[BasePermission]:
        """
        Customize permissions based on action:
        - list and retrieve are allowed for any user (even unauthenticated)
        - create, update, delete require authentication
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        # Default permission for list and retrieve
        return [AllowAny()]

    def get_serializer_class(self) -> Type[TechniqueSerializer]:
        """Return appropriate serializer class based on action."""
        return TechniqueSerializer
    
    def get_queryset(self):
        """Get queryset with optimized prefetching for related entities."""
        return Technique.objects.all().prefetch_related(
            'assurance_goals',
            'categories',
            'subcategories',
            'tags',
            'attribute_values',
            'resources',
            'example_use_cases',
            'limitations'
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
        instance = serializer.save()

        # Return the created instance
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Update a technique."""
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=kwargs.get("partial", False)
        )
        serializer.is_valid(raise_exception=True)
        updated_instance = serializer.save()

        # Return the updated instance
        return Response(serializer.data)


class AttributeTypesViewSet(viewsets.ModelViewSet):
    queryset = AttributeType.objects.all()
    serializer_class = AttributeTypeSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["name", "applicable_goals", "required_for_goals"]
    search_fields = ["name", "description"]
    ordering_fields = ["id", "name"]
    
    def get_permissions(self) -> List[BasePermission]:
        """Require authentication for write operations"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]


class AttributeValuesViewSet(viewsets.ModelViewSet):
    queryset = AttributeValue.objects.all()
    serializer_class = AttributeValueSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["name", "attribute_type"]
    search_fields = ["name", "description"]
    ordering_fields = ["id", "name"]
    
    def get_permissions(self) -> List[BasePermission]:
        """Require authentication for write operations"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]


class ResourceTypesViewSet(viewsets.ModelViewSet):
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
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]


@api_view(["GET"])
def get_categorylist(request: Request, assurance_goal_id: int) -> Response:
    categories = Category.objects.filter(assurance_goal_id=assurance_goal_id)
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def get_subcategorylist(request: Request, category_id: int) -> Response:
    subcategories = SubCategory.objects.filter(category_id=category_id)
    serializer = SubCategorySerializer(subcategories, many=True)
    return Response(serializer.data)


@api_view(["GET"])
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
def debug_endpoint(request: Request) -> Response:
    """
    Debugging endpoint with restricted access.
    
    Only available in development mode (DEBUG=True).
    """
    from django.conf import settings

    # Only allow debug endpoint in development
    if not settings.DEBUG:
        return Response(
            {"error": "Debug endpoint not available in production"},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.method == "GET":
        # Return connection information for debugging
        
        # Safe version of settings that doesn't expose sensitive information
        safe_settings = {
            "DEBUG": settings.DEBUG,
            "ALLOWED_HOSTS": settings.ALLOWED_HOSTS,
            "CORS_ALLOWED_ORIGINS": getattr(settings, "CORS_ALLOWED_ORIGINS", "Not set"),
            "CORS_ALLOW_ALL_ORIGINS": getattr(settings, "CORS_ALLOW_ALL_ORIGINS", "Not set"),
            "DATABASE_ENGINE": settings.DATABASES["default"]["ENGINE"],
            "INSTALLED_APPS": settings.INSTALLED_APPS,
            "MIDDLEWARE": settings.MIDDLEWARE,
        }
        
        # Get current database connection info
        db_info = {
            "vendor": connection.vendor,
            "queries_executed": len(connection.queries) if settings.DEBUG else "Query logging disabled",
            "is_usable": connection.is_usable(),
        }
        
        # Return model information for debugging
        assurance_goals_count = AssuranceGoal.objects.count()
        categories_count = Category.objects.count()
        subcategories_count = SubCategory.objects.count()
        techniques_count = Technique.objects.count()

        response_data = {
            "api_status": "API is running correctly",
            "request_info": {
                "path": request.path,
                "host": request.get_host(),
                "method": request.method,
                "content_type": request.content_type or "Not set",
                "headers": {k: v for k, v in request.headers.items() if k.lower() not in ('cookie', 'authorization')},
            },
            "database_info": db_info,
            "database_counts": {
                "assurance_goals": assurance_goals_count,
                "categories": categories_count,
                "subcategories": subcategories_count,
                "techniques": techniques_count,
            },
            "api_endpoints": {
                "assurance_goals": "/api/assurance-goals/",
                "categories": "/api/categories/",
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
                "headers": {k: v for k, v in request.headers.items() if k.lower() not in ('cookie', 'authorization')},
            }
        )
        
    # Default fallback response - should never reach here due to DRF's api_view decorator
    return Response({"error": "Unsupported HTTP method"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
