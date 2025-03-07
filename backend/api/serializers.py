# api/serializers.py

from rest_framework import serializers
import logging
from .models import (
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

# Set up logger
logger = logging.getLogger(__name__)


class AssuranceGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssuranceGoal
        fields = "__all__"


class CategorySerializer(serializers.ModelSerializer):
    assurance_goal_name = serializers.ReadOnlyField(source="assurance_goal.name")

    class Meta:
        model = Category
        fields = ["id", "name", "description", "assurance_goal", "assurance_goal_name"]


class SubCategorySerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source="category.name")

    class Meta:
        model = SubCategory
        fields = ["id", "name", "description", "category", "category_name"]


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = "__all__"


class AttributeTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttributeType
        fields = "__all__"


class AttributeValueSerializer(serializers.ModelSerializer):
    attribute_type_name = serializers.ReadOnlyField(source="attribute_type.name")

    class Meta:
        model = AttributeValue
        fields = [
            "id",
            "attribute_type",
            "attribute_type_name",
            "name",
            "description",
            "technique",
        ]


class ResourceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceType
        fields = "__all__"


class TechniqueResourceSerializer(serializers.ModelSerializer):
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
        ]


class TechniqueExampleUseCaseSerializer(serializers.ModelSerializer):
    assurance_goal_name = serializers.SerializerMethodField()

    class Meta:
        model = TechniqueExampleUseCase
        fields = ["id", "description", "assurance_goal", "assurance_goal_name"]

    def get_assurance_goal_name(self, obj):
        if obj.assurance_goal:
            return obj.assurance_goal.name
        return None


class TechniqueLimitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TechniqueLimitation
        fields = ["id", "description"]


class TechniqueSerializer(serializers.ModelSerializer):
    # Relationship fields
    assurance_goals = AssuranceGoalSerializer(many=True, read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    subcategories = SubCategorySerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    # Additional relationship fields - note the change from attributes to attribute_values
    attribute_values = AttributeValueSerializer(many=True, read_only=True)
    resources = TechniqueResourceSerializer(many=True, read_only=True)
    example_use_cases = TechniqueExampleUseCaseSerializer(many=True, read_only=True)
    limitations = TechniqueLimitationSerializer(many=True, read_only=True)

    class Meta:
        model = Technique
        fields = [
            "id",
            "name",
            "description",
            "model_dependency",
            "category_tags",
            "complexity_rating",
            "computational_cost_rating",
            "assurance_goals",
            "categories",
            "subcategories",
            "tags",
            "attribute_values",
            "resources",
            "example_use_cases",
            "limitations",
        ]
