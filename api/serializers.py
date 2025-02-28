# api/serializers.py

from rest_framework import serializers
from .models import (
    AssuranceGoal,
    Category,
    SubCategory,
    FairnessApproach,
    ProjectLifecycleStage,
    Tag,
    Technique,
)


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


class FairnessApproachSerializer(serializers.ModelSerializer):
    class Meta:
        model = FairnessApproach
        fields = "__all__"


class ProjectLifecycleStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectLifecycleStage
        fields = "__all__"


class TechniqueSerializer(serializers.ModelSerializer):
    assurance_goal_name = serializers.ReadOnlyField(source="assurance_goal.name")
    category_name = serializers.ReadOnlyField(source="category.name")
    sub_category_name = serializers.ReadOnlyField(source="sub_category.name")
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Technique
        fields = [
            "id",
            "name",
            "description",
            "assurance_goal",
            "assurance_goal_name",
            "model_dependency",
            "example_use_case",
            "scope",
            "category",
            "category_name",
            "sub_category",
            "sub_category_name",
            "tags",
            "reference",
            "software_package",
            "limitation",
        ]


# For creating and updating techniques
class TechniqueWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Technique
        fields = [
            "id",
            "name",
            "description",
            "assurance_goal",
            "model_dependency",
            "example_use_case",
            "scope",
            "category",
            "sub_category",
            "tags",
            "reference",
            "software_package",
            "limitation",
        ]
