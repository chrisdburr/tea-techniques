# api/views/api_views.py

from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django_filters.rest_framework import DjangoFilterBackend
from django.http import JsonResponse
from django.core import serializers
import json
import logging  # Add this for logging

from ..models import (
    AssuranceGoal,
    Category,
    SubCategory,
    FairnessApproach,
    ProjectLifecycleStage,
    Tag,
    Technique,
)
from ..serializers import (
    AssuranceGoalSerializer,
    CategorySerializer,
    SubCategorySerializer,
    FairnessApproachSerializer,
    ProjectLifecycleStageSerializer,
    TagSerializer,
    TechniqueSerializer,
    TechniqueWriteSerializer,  # Add this - crucial for our updated ViewSet
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


class FairnessApproachesViewSet(viewsets.ModelViewSet):
    queryset = FairnessApproach.objects.all()
    serializer_class = FairnessApproachSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["name"]
    search_fields = ["name", "description"]
    ordering_fields = ["id", "name"]


class ProjectLifecycleStagesViewSet(viewsets.ModelViewSet):
    queryset = ProjectLifecycleStage.objects.all()
    serializer_class = ProjectLifecycleStageSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["name"]
    search_fields = ["name", "description"]
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
        "assurance_goal",
        "category",
        "sub_category",
        "model_dependency",
        "scope",
        "tags",
    ]
    search_fields = ["name", "description", "example_use_case"]
    ordering_fields = ["id", "name"]

    def get_serializer_class(self):
        """Return appropriate serializer class based on action."""
        if self.action in ["create", "update", "partial_update"]:
            return TechniqueWriteSerializer
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
            },
            "technique_fields": {
                "required": [
                    "name",
                    "description",
                    "assurance_goal",
                    "category",
                    "model_dependency",
                ],
                "optional": ["example_use_case", "sub_category", "scope", "tags"],
            },
            "technique_example": {
                "name": "Example Technique",
                "description": "Description of the technique",
                "assurance_goal": 1,  # ID of an assurance goal (integer)
                "category": 1,  # ID of a category (integer)
                "model_dependency": "Model-Agnostic",
                "example_use_case": "Example use case description",
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
