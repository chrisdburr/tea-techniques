# api/views/api_views.py

from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django_filters.rest_framework import DjangoFilterBackend
from django.http import JsonResponse
from django.core import serializers
from django.views.decorators.csrf import csrf_exempt
from django.middleware.common import CommonMiddleware
from django.db import connection
import json
import logging

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


class TechniquesViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Techniques that provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions.
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

    def get_serializer_class(self):
        """Return appropriate serializer class based on action."""
        return TechniqueSerializer
        
    def list(self, request, *args, **kwargs):
        """Override list method to handle database schema issues"""
        try:
            # Try the standard list implementation
            return super().list(request, *args, **kwargs)
        except Exception as e:
            # Log the error
            logger.error(f"Error in TechniquesViewSet list: {str(e)}")
            
            # Try a more basic query to avoid errors with missing columns
            try:
                # Use a simpler query that only selects basic fields
                techniques = Technique.objects.only('id', 'name', 'description', 
                                                  'model_dependency', 'category_tags',
                                                  'complexity_rating', 'computational_cost_rating')
                
                # Handle pagination manually
                page = self.paginate_queryset(techniques)
                if page is not None:
                    serializer = self.get_serializer(page, many=True)
                    return self.get_paginated_response(serializer.data)
                
                serializer = self.get_serializer(techniques, many=True)
                return Response(serializer.data)
            except Exception as fallback_error:
                # If even the fallback fails, return an error response
                logger.error(f"Fallback query also failed: {str(fallback_error)}")
                return Response(
                    {"error": "Unable to retrieve techniques due to a database issue. Please contact support."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
    def retrieve(self, request, *args, **kwargs):
        """Override retrieve method to handle database schema issues"""
        try:
            # Try the standard retrieve implementation
            return super().retrieve(request, *args, **kwargs)
        except Exception as e:
            # Log the error
            logger.error(f"Error in TechniquesViewSet retrieve: {str(e)}")
            
            # Try a more basic query to avoid errors with missing columns
            try:
                # Get the instance with only basic fields
                instance = Technique.objects.only(
                    'id', 'name', 'description', 'model_dependency', 'category_tags',
                    'complexity_rating', 'computational_cost_rating'
                ).get(pk=kwargs['pk'])
                
                serializer = self.get_serializer(instance)
                return Response(serializer.data)
            except Exception as fallback_error:
                # If even the fallback fails, return an error response
                logger.error(f"Fallback query also failed: {str(fallback_error)}")
                return Response(
                    {"error": "Unable to retrieve the technique due to a database issue. Please contact support."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

    def create(self, request, *args, **kwargs):
        """Create a new technique with improved error handling."""
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            instance = serializer.save()

            # Return the created instance using the read serializer
            read_serializer = TechniqueSerializer(instance)
            return Response(read_serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            # Log the error for debugging
            logger.error(f"Error creating technique: {str(e)}")
            raise

    def update(self, request, *args, **kwargs):
        """Update a technique with improved error handling."""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(
                instance, data=request.data, partial=kwargs.get("partial", False)
            )
            serializer.is_valid(raise_exception=True)
            updated_instance = serializer.save()

            # Return the updated instance using the read serializer
            read_serializer = TechniqueSerializer(updated_instance)
            return Response(read_serializer.data)
        except Exception as e:
            # Log the error for debugging
            logger.error(f"Error updating technique: {str(e)}")
            raise


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


@api_view(["GET"])
def get_categorylist(request, assurance_goal_id):
    categories = Category.objects.filter(assurance_goal_id=assurance_goal_id)
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def get_subcategorylist(request, category_id):
    subcategories = SubCategory.objects.filter(category_id=category_id)
    serializer = SubCategorySerializer(subcategories, many=True)
    return Response(serializer.data)


@api_view(["GET", "POST"])
@csrf_exempt
def debug_endpoint(request):
    """
    Debugging endpoint to check what the API is receiving and can return.
    GET: Returns the available models and their structure
    POST: Echoes back the received data, useful for checking what's being sent
    """
    if request.method == "GET":
        # Return connection information for debugging
        from django.conf import settings
        
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
