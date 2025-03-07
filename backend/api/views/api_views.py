# api/views/api_views.py

from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django_filters.rest_framework import DjangoFilterBackend
from django.http import JsonResponse
from django.core import serializers
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
        # if self.action in ["create", "update", "partial_update"]:
        #     return TechniqueWriteSerializer
        return TechniqueSerializer

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
def debug_endpoint(request):
    """
    Debugging endpoint to check what the API is receiving and can return.
    GET: Returns the available models and their structure
    POST: Echoes back the received data, useful for checking what's being sent
    """
    if request.method == "GET":
        # Return model information for debugging
        assurance_goals = AssuranceGoal.objects.all()
        categories = Category.objects.all()
        subcategories = SubCategory.objects.all()
        attribute_types = AttributeType.objects.all()
        resource_types = ResourceType.objects.all()

        response_data = {
            "available_models": {
                "assurance_goals": [
                    {"id": goal.id, "name": goal.name} for goal in assurance_goals
                ],
                "categories": [
                    {
                        "id": cat.id,
                        "name": cat.name,
                        "assurance_goal_id": cat.assurance_goal_id,
                    }
                    for cat in categories
                ],
                "subcategories": [
                    {
                        "id": subcat.id,
                        "name": subcat.name,
                        "category_id": subcat.category_id,
                    }
                    for subcat in subcategories
                ],
                "attribute_types": [
                    {"id": at.id, "name": at.name} for at in attribute_types
                ],
                "resource_types": [
                    {"id": rt.id, "name": rt.name} for rt in resource_types
                ],
            },
            "technique_fields": {
                "required": [
                    "name",
                    "description",
                    "model_dependency",
                ],
                "optional": [
                    "assurance_goal_ids",
                    "category_ids",
                    "subcategory_ids",
                    "tag_ids",
                    "attributes",
                    "resources",
                    "example_use_cases",
                    "limitations",
                ],
            },
            "technique_example": {
                "name": "Example Technique",
                "description": "Description of the technique",
                "model_dependency": "Model-Agnostic",
                "assurance_goal_ids": [1, 2],
                "category_ids": [1, 2],
                "subcategory_ids": [1],
                "tag_ids": [1, 2],
                "attributes": [{"attribute_value": 1}],
                "resources": [
                    {
                        "resource_type": 1,
                        "title": "Documentation",
                        "url": "https://example.com",
                        "description": "Official documentation",
                    }
                ],
                "example_use_cases": [
                    {"description": "Example use case description", "assurance_goal": 1}
                ],
                "limitations": ["Limitation 1", "Limitation 2"],
            },
        }

        return Response(response_data)

    elif request.method == "POST":
        # Echo back received data for debugging
        return Response(
            {
                "received_data": request.data,
                "content_type": request.content_type,
                "method": request.method,
                "user": str(request.user),
            }
        )
