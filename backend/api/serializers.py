# api/serializers.py

from rest_framework import serializers
import logging
from .models import (
    AssuranceGoal,
    Category,
    SubCategory,
    Tag,
    Technique,
    TechniqueAssuranceGoal,
    TechniqueCategory,
    TechniqueSubCategory,
    TechniqueTag,
    TechniqueRelationship,
    AttributeType,
    AttributeValue,
    TechniqueAttribute,
    ResourceType,
    TechniqueResource,
    TechniqueExampleUseCase,
    TechniqueLimitation
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


# FairnessApproach and ProjectLifecycleStage serializers have been removed as part of the cleanup


class TechniqueRelationshipSerializer(serializers.ModelSerializer):
    technique_from_name = serializers.ReadOnlyField(source="technique_from.name")
    technique_to_name = serializers.ReadOnlyField(source="technique_to.name")
    
    class Meta:
        model = TechniqueRelationship
        fields = ["id", "technique_from", "technique_from_name", "technique_to", "technique_to_name", "relationship_type"]


class AttributeTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttributeType
        fields = "__all__"


class AttributeValueSerializer(serializers.ModelSerializer):
    attribute_type_name = serializers.ReadOnlyField(source="attribute_type.name")
    
    class Meta:
        model = AttributeValue
        fields = ["id", "attribute_type", "attribute_type_name", "name", "description"]


class TechniqueAttributeSerializer(serializers.ModelSerializer):
    attribute_type = serializers.ReadOnlyField(source="attribute_value.attribute_type.name")
    attribute_value_name = serializers.ReadOnlyField(source="attribute_value.name")
    
    class Meta:
        model = TechniqueAttribute
        fields = ["id", "attribute_type", "attribute_value", "attribute_value_name"]


class ResourceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceType
        fields = "__all__"


class TechniqueResourceSerializer(serializers.ModelSerializer):
    resource_type_name = serializers.ReadOnlyField(source="resource_type.name")
    
    class Meta:
        model = TechniqueResource
        fields = ["id", "resource_type", "resource_type_name", "title", "url", "description"]


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
    
    # Additional relationship fields
    attributes = TechniqueAttributeSerializer(many=True, read_only=True)
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
            "assurance_goals",
            "categories",
            "subcategories",
            "tags",
            "attributes",
            "resources",
            "example_use_cases",
            "limitations",
        ]


# For creating and updating techniques
class TechniqueWriteSerializer(serializers.ModelSerializer):
    # Fields for nested data
    assurance_goal_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )
    category_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )
    subcategory_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )
    attributes = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True
    )
    resources = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True
    )
    example_use_cases = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True
    )
    limitations = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True
    )
    
    class Meta:
        model = Technique
        fields = [
            "id",
            "name",
            "description",
            "model_dependency",
            "assurance_goal_ids",
            "category_ids",
            "subcategory_ids",
            "tag_ids",
            "attributes",
            "resources",
            "example_use_cases",
            "limitations",
        ]
    
    def create(self, validated_data):
        try:
            # Extract nested data
            assurance_goal_ids = validated_data.pop('assurance_goal_ids', [])
            category_ids = validated_data.pop('category_ids', [])
            subcategory_ids = validated_data.pop('subcategory_ids', [])
            tag_ids = validated_data.pop('tag_ids', [])
            attributes_data = validated_data.pop('attributes', [])
            resources_data = validated_data.pop('resources', [])
            example_use_cases_data = validated_data.pop('example_use_cases', [])
            limitations_data = validated_data.pop('limitations', [])
            
            # Create the technique
            technique = Technique.objects.create(**validated_data)
            
            # Add many-to-many relationships
            self._add_relationships(
                technique, 
                assurance_goal_ids, 
                category_ids, 
                subcategory_ids, 
                tag_ids,
                attributes_data,
                resources_data,
                example_use_cases_data,
                limitations_data
            )
            
            return technique
        except Exception as e:
            # Log the error for debugging
            logger.error(f"Error creating technique: {str(e)}")
            raise serializers.ValidationError(f"Failed to create technique: {str(e)}")
    
    def update(self, instance, validated_data):
        try:
            # Extract nested data
            assurance_goal_ids = validated_data.pop('assurance_goal_ids', None)
            category_ids = validated_data.pop('category_ids', None)
            subcategory_ids = validated_data.pop('subcategory_ids', None)
            tag_ids = validated_data.pop('tag_ids', None)
            attributes_data = validated_data.pop('attributes', None)
            resources_data = validated_data.pop('resources', None)
            example_use_cases_data = validated_data.pop('example_use_cases', None)
            limitations_data = validated_data.pop('limitations', None)
            
            # Update basic fields
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            
            # Update relationships if provided
            if assurance_goal_ids is not None or category_ids is not None or subcategory_ids is not None or tag_ids is not None:
                # Clear existing relationships if new ones are provided
                if assurance_goal_ids is not None:
                    instance.assurance_goals.clear()
                if category_ids is not None:
                    instance.categories.clear()
                if subcategory_ids is not None:
                    instance.subcategories.clear()
                if tag_ids is not None:
                    instance.tags.clear()
                
                # Add the new relationships
                self._add_relationships(
                    instance, 
                    assurance_goal_ids or [], 
                    category_ids or [], 
                    subcategory_ids or [], 
                    tag_ids or [],
                    attributes_data,
                    resources_data,
                    example_use_cases_data,
                    limitations_data
                )
            
            return instance
        except Exception as e:
            # Log the error for debugging
            logger.error(f"Error updating technique: {str(e)}")
            raise serializers.ValidationError(f"Failed to update technique: {str(e)}")
    
    def _add_relationships(self, technique, assurance_goal_ids, category_ids, subcategory_ids, tag_ids, 
                          attributes_data, resources_data, example_use_cases_data, limitations_data):
        """Helper method to add relationships to a technique."""
        # Add assurance goals
        for goal_id in assurance_goal_ids:
            TechniqueAssuranceGoal.objects.create(
                technique=technique,
                assurance_goal_id=goal_id
            )
        
        # Add categories
        for category_id in category_ids:
            TechniqueCategory.objects.create(
                technique=technique,
                category_id=category_id
            )
        
        # Add subcategories
        for subcategory_id in subcategory_ids:
            TechniqueSubCategory.objects.create(
                technique=technique,
                subcategory_id=subcategory_id
            )
        
        # Add tags
        for tag_id in tag_ids:
            TechniqueTag.objects.create(
                technique=technique,
                tag_id=tag_id
            )
        
        # Add attributes
        if attributes_data:
            # Clear existing attributes if new ones are provided
            if hasattr(technique, 'attributes'):
                TechniqueAttribute.objects.filter(technique=technique).delete()
                
            for attr_data in attributes_data:
                attribute_type_id = attr_data.get('attribute_type')
                attribute_value_id = attr_data.get('attribute_value')
                
                if attribute_value_id:
                    TechniqueAttribute.objects.create(
                        technique=technique,
                        attribute_value_id=attribute_value_id
                    )
        
        # Add resources
        if resources_data:
            # Clear existing resources if new ones are provided
            if hasattr(technique, 'resources'):
                TechniqueResource.objects.filter(technique=technique).delete()
                
            for res_data in resources_data:
                TechniqueResource.objects.create(
                    technique=technique,
                    resource_type_id=res_data.get('resource_type'),
                    title=res_data.get('title', ''),
                    url=res_data.get('url', ''),
                    description=res_data.get('description', '')
                )
        
        # Add example use cases
        if example_use_cases_data:
            # Clear existing use cases if new ones are provided
            if hasattr(technique, 'example_use_cases'):
                TechniqueExampleUseCase.objects.filter(technique=technique).delete()
                
            for uc_data in example_use_cases_data:
                TechniqueExampleUseCase.objects.create(
                    technique=technique,
                    description=uc_data.get('description', ''),
                    assurance_goal_id=uc_data.get('assurance_goal')
                )
        
        # Add limitations
        if limitations_data:
            # Clear existing limitations if new ones are provided
            if hasattr(technique, 'limitations'):
                TechniqueLimitation.objects.filter(technique=technique).delete()
                
            for limitation_text in limitations_data:
                if limitation_text:
                    TechniqueLimitation.objects.create(
                        technique=technique,
                        description=limitation_text
                    )
