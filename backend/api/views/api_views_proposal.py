# api/views/api_views_proposal.py

from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, action
from django_filters.rest_framework import DjangoFilterBackend
import logging

from ..models_proposal import (
    AssuranceGoal,
    Category,
    SubCategory,
    Tag,
    AttributeType,
    AttributeValue,
    Technique,
    TechniqueAttribute,
    TechniqueRelationship
)
from ..serializers_proposal import (
    AssuranceGoalSerializer,
    CategorySerializer,
    SubCategorySerializer,
    TagSerializer,
    AttributeTypeSerializer,
    AttributeValueSerializer,
    TechniqueSerializer,
    TechniqueWriteSerializer
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
    
    @action(detail=True, methods=['get'])
    def categories(self, request, pk=None):
        """Get categories associated with this assurance goal"""
        assurance_goal = self.get_object()
        categories = assurance_goal.categories.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def techniques(self, request, pk=None):
        """Get techniques associated with this assurance goal"""
        assurance_goal = self.get_object()
        techniques = Technique.objects.filter(assurance_goal=assurance_goal)
        serializer = TechniqueSerializer(techniques, many=True)
        return Response(serializer.data)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    search_fields = ["name", "description", "assurance_goals__name"]
    ordering_fields = ["id", "name"]
    
    def get_queryset(self):
        """Allow filtering categories by assurance goal"""
        queryset = super().get_queryset()
        assurance_goal_id = self.request.query_params.get('assurance_goal', None)
        
        if assurance_goal_id:
            queryset = queryset.filter(assurance_goals__id=assurance_goal_id)
            
        return queryset
    
    @action(detail=True, methods=['get'])
    def subcategories(self, request, pk=None):
        """Get subcategories associated with this category"""
        category = self.get_object()
        subcategories = category.subcategories.all()
        serializer = SubCategorySerializer(subcategories, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def techniques(self, request, pk=None):
        """Get techniques associated with this category"""
        category = self.get_object()
        techniques = category.techniques.all()
        serializer = TechniqueSerializer(techniques, many=True)
        return Response(serializer.data)

class SubCategoryViewSet(viewsets.ModelViewSet):
    queryset = SubCategory.objects.all()
    serializer_class = SubCategorySerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    search_fields = ["name", "description", "categories__name"]
    ordering_fields = ["id", "name"]
    
    def get_queryset(self):
        """Allow filtering subcategories by category"""
        queryset = super().get_queryset()
        category_id = self.request.query_params.get('category', None)
        
        if category_id:
            queryset = queryset.filter(categories__id=category_id)
            
        return queryset
    
    @action(detail=True, methods=['get'])
    def techniques(self, request, pk=None):
        """Get techniques associated with this subcategory"""
        subcategory = self.get_object()
        techniques = subcategory.techniques.all()
        serializer = TechniqueSerializer(techniques, many=True)
        return Response(serializer.data)

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
    
    @action(detail=True, methods=['get'])
    def techniques(self, request, pk=None):
        """Get techniques associated with this tag"""
        tag = self.get_object()
        techniques = tag.techniques.all()
        serializer = TechniqueSerializer(techniques, many=True)
        return Response(serializer.data)

class AttributeTypeViewSet(viewsets.ModelViewSet):
    queryset = AttributeType.objects.all()
    serializer_class = AttributeTypeSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["name", "applies_to_all"]
    search_fields = ["name", "description"]
    ordering_fields = ["id", "name"]
    
    def get_queryset(self):
        """Allow filtering attribute types by assurance goal"""
        queryset = super().get_queryset()
        assurance_goal_id = self.request.query_params.get('assurance_goal', None)
        
        if assurance_goal_id:
            # Return attribute types that apply to all + ones specifically for this goal
            queryset = queryset.filter(
                applies_to_all=True
            ) | queryset.filter(
                applicable_goals__id=assurance_goal_id
            ).distinct()
            
        return queryset
    
    @action(detail=True, methods=['get'])
    def values(self, request, pk=None):
        """Get values for this attribute type"""
        attribute_type = self.get_object()
        values = attribute_type.values.all()
        serializer = AttributeValueSerializer(values, many=True)
        return Response(serializer.data)

class AttributeValueViewSet(viewsets.ModelViewSet):
    queryset = AttributeValue.objects.all()
    serializer_class = AttributeValueSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["attribute_type"]
    search_fields = ["name", "description", "attribute_type__name"]
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
        "model_dependency",
    ]
    search_fields = ["name", "description", "example_use_case"]
    ordering_fields = ["id", "name"]

    def get_serializer_class(self):
        """Return appropriate serializer class based on action."""
        if self.action in ["create", "update", "partial_update"]:
            return TechniqueWriteSerializer
        return TechniqueSerializer
    
    def get_queryset(self):
        """Add custom filtering options"""
        queryset = super().get_queryset()
        
        # Filter by category
        category_id = self.request.query_params.get('category', None)
        if category_id:
            queryset = queryset.filter(categories__id=category_id)
        
        # Filter by subcategory
        subcategory_id = self.request.query_params.get('subcategory', None)
        if subcategory_id:
            queryset = queryset.filter(subcategories__id=subcategory_id)
        
        # Filter by tag
        tag_id = self.request.query_params.get('tag', None)
        if tag_id:
            queryset = queryset.filter(tags__id=tag_id)
        
        # Filter by attribute value
        attribute_value_id = self.request.query_params.get('attribute_value', None)
        if attribute_value_id:
            queryset = queryset.filter(attributes__attribute_value_id=attribute_value_id)
        
        # Filter by attribute type (any value of this type)
        attribute_type_id = self.request.query_params.get('attribute_type', None)
        if attribute_type_id:
            queryset = queryset.filter(attributes__attribute_value__attribute_type_id=attribute_type_id)
        
        return queryset.distinct()

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
    
    @action(detail=True, methods=['get'])
    def attributes(self, request, pk=None):
        """Get all attributes for this technique"""
        technique = self.get_object()
        attributes = technique.attributes.all()
        
        # Group attributes by type for easier frontend consumption
        attribute_groups = {}
        for attr in attributes:
            attr_type = attr.attribute_value.attribute_type
            attr_type_id = attr_type.id
            
            if attr_type_id not in attribute_groups:
                attribute_groups[attr_type_id] = {
                    'id': attr_type_id,
                    'name': attr_type.name,
                    'multi_valued': attr_type.multi_valued,
                    'values': []
                }
            
            attribute_groups[attr_type_id]['values'].append({
                'id': attr.attribute_value.id,
                'name': attr.attribute_value.name,
                'description': attr.attribute_value.description
            })
        
        return Response(list(attribute_groups.values()))
    
    @action(detail=True, methods=['get'])
    def related(self, request, pk=None):
        """Get related techniques"""
        technique = self.get_object()
        related_ids = technique.related_from.values_list('technique_to_id', flat=True)
        related_techniques = Technique.objects.filter(id__in=related_ids)
        
        serializer = TechniqueSerializer(related_techniques, many=True)
        return Response(serializer.data)


@api_view(["GET"])
def get_techniques_by_goal(request, goal_id):
    """Get all techniques for a specific assurance goal"""
    techniques = Technique.objects.filter(assurance_goal_id=goal_id)
    serializer = TechniqueSerializer(techniques, many=True)
    return Response(serializer.data)

@api_view(["GET"])
def get_categories_by_goal(request, goal_id):
    """Get all categories for a specific assurance goal"""
    assurance_goal = AssuranceGoal.objects.get(id=goal_id)
    categories = assurance_goal.categories.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)

@api_view(["GET"])
def get_subcategories_by_category(request, category_id):
    """Get all subcategories for a specific category"""
    category = Category.objects.get(id=category_id)
    subcategories = category.subcategories.all()
    serializer = SubCategorySerializer(subcategories, many=True)
    return Response(serializer.data)

@api_view(["GET"])
def get_attribute_types_by_goal(request, goal_id):
    """Get all attribute types applicable to a specific assurance goal"""
    # Get attribute types that apply to all goals
    global_types = AttributeType.objects.filter(applies_to_all=True)
    
    # Get attribute types specific to this goal
    goal_specific_types = AttributeType.objects.filter(
        applicable_goals__id=goal_id
    )
    
    # Combine both querysets
    attribute_types = (global_types | goal_specific_types).distinct()
    
    serializer = AttributeTypeSerializer(attribute_types, many=True)
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

        response_data = {
            "available_models": {
                "assurance_goals": [
                    {"id": goal.id, "name": goal.name} for goal in assurance_goals
                ],
                "categories": [
                    {
                        "id": cat.id,
                        "name": cat.name,
                        "assurance_goals": [goal.id for goal in cat.assurance_goals.all()],
                    }
                    for cat in categories
                ],
                "subcategories": [
                    {
                        "id": subcat.id,
                        "name": subcat.name,
                        "categories": [cat.id for cat in subcat.categories.all()],
                    }
                    for subcat in subcategories
                ],
                "attribute_types": [
                    {
                        "id": attr_type.id,
                        "name": attr_type.name,
                        "applies_to_all": attr_type.applies_to_all,
                        "applicable_goals": [goal.id for goal in attr_type.applicable_goals.all()] if not attr_type.applies_to_all else [],
                        "multi_valued": attr_type.multi_valued,
                    }
                    for attr_type in attribute_types
                ],
            },
            "technique_fields": {
                "required": [
                    "name",
                    "description",
                    "assurance_goal",
                    "model_dependency",
                ],
                "optional": [
                    "example_use_case",
                    "reference",
                    "software_package",
                    "limitation",
                    "category_ids",
                    "subcategory_ids",
                    "tag_ids",
                    "attributes_data",
                ],
            },
            "technique_example": {
                "name": "Example Technique",
                "description": "Description of the technique",
                "assurance_goal": 1,  # ID of an assurance goal (integer)
                "model_dependency": "Model-Agnostic",
                "example_use_case": "Example use case description",
                "category_ids": [1, 2],  # IDs of categories
                "subcategory_ids": [1],  # IDs of subcategories (optional)
                "tag_ids": [1, 2],  # IDs of tags (optional)
                "attributes_data": {
                    "1": 2,  # Single-valued attribute: attribute_type_id: attribute_value_id
                    "2": [3, 4]  # Multi-valued attribute: attribute_type_id: [attribute_value_ids]
                }
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