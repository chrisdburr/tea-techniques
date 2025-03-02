# api/serializers_proposal.py

from rest_framework import serializers
from .models_proposal import (
    AssuranceGoal,
    Category,
    CategoryAssuranceGoal,
    SubCategory,
    SubCategoryCategory,
    Tag,
    AttributeType,
    AttributeValue,
    Technique,
    TechniqueCategory,
    TechniqueSubCategory,
    TechniqueTag,
    TechniqueAttribute,
    TechniqueRelationship
)

class AssuranceGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssuranceGoal
        fields = "__all__"

class CategorySerializer(serializers.ModelSerializer):
    assurance_goals = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=AssuranceGoal.objects.all()
    )
    
    class Meta:
        model = Category
        fields = ["id", "name", "description", "assurance_goals"]
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['assurance_goal_names'] = [
            goal.name for goal in instance.assurance_goals.all()
        ]
        return representation

class SubCategorySerializer(serializers.ModelSerializer):
    categories = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Category.objects.all()
    )
    
    class Meta:
        model = SubCategory
        fields = ["id", "name", "description", "categories"]
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['category_names'] = [
            category.name for category in instance.categories.all()
        ]
        return representation

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = "__all__"

class AttributeTypeSerializer(serializers.ModelSerializer):
    applicable_goals = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=AssuranceGoal.objects.all(),
        required=False
    )
    
    class Meta:
        model = AttributeType
        fields = ["id", "name", "description", "applies_to_all", "applicable_goals", "multi_valued"]
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if not instance.applies_to_all:
            representation['applicable_goal_names'] = [
                goal.name for goal in instance.applicable_goals.all()
            ]
        return representation

class AttributeValueSerializer(serializers.ModelSerializer):
    attribute_type_name = serializers.ReadOnlyField(source="attribute_type.name")
    
    class Meta:
        model = AttributeValue
        fields = ["id", "name", "description", "attribute_type", "attribute_type_name"]

class TechniqueAttributeSerializer(serializers.ModelSerializer):
    attribute_type_id = serializers.ReadOnlyField(source="attribute_value.attribute_type.id")
    attribute_type_name = serializers.ReadOnlyField(source="attribute_value.attribute_type.name")
    attribute_value_name = serializers.ReadOnlyField(source="attribute_value.name")
    
    class Meta:
        model = TechniqueAttribute
        fields = ["id", "attribute_value", "attribute_value_name", "attribute_type_id", "attribute_type_name"]

class TechniqueRelationshipSerializer(serializers.ModelSerializer):
    technique_to_name = serializers.ReadOnlyField(source="technique_to.name")
    
    class Meta:
        model = TechniqueRelationship
        fields = ["id", "technique_to", "technique_to_name", "relationship_type"]

class TechniqueSerializer(serializers.ModelSerializer):
    # Related fields with nested serialization
    assurance_goal_name = serializers.ReadOnlyField(source="assurance_goal.name")
    categories = CategorySerializer(many=True, read_only=True)
    subcategories = SubCategorySerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    attributes = TechniqueAttributeSerializer(many=True, read_only=True)
    relationships = TechniqueRelationshipSerializer(
        source="related_from", 
        many=True, 
        read_only=True
    )
    
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
            "reference",
            "software_package",
            "limitation",
            "categories",
            "subcategories",
            "tags",
            "attributes",
            "relationships",
        ]

# Write serializer with simpler representation for creating/updating techniques
class TechniqueWriteSerializer(serializers.ModelSerializer):
    category_ids = serializers.PrimaryKeyRelatedField(
        source="categories",
        queryset=Category.objects.all(),
        many=True,
        required=False
    )
    subcategory_ids = serializers.PrimaryKeyRelatedField(
        source="subcategories",
        queryset=SubCategory.objects.all(),
        many=True,
        required=False
    )
    tag_ids = serializers.PrimaryKeyRelatedField(
        source="tags",
        queryset=Tag.objects.all(),
        many=True,
        required=False
    )
    # Dynamic structured format for attributes
    # Format: {attribute_type_id: attribute_value_id} or {attribute_type_id: [value_ids]} for multi-valued
    attributes_data = serializers.DictField(
        child=serializers.ListField(child=serializers.IntegerField()) | serializers.IntegerField(),
        required=False
    )
    
    class Meta:
        model = Technique
        fields = [
            "id",
            "name",
            "description",
            "assurance_goal",
            "model_dependency",
            "example_use_case",
            "reference",
            "software_package",
            "limitation",
            "category_ids",
            "subcategory_ids",
            "tag_ids",
            "attributes_data",
        ]
    
    def create(self, validated_data):
        categories_data = validated_data.pop('categories', [])
        subcategories_data = validated_data.pop('subcategories', [])
        tags_data = validated_data.pop('tags', [])
        attributes_data = validated_data.pop('attributes_data', {})
        
        # Create technique
        technique = Technique.objects.create(**validated_data)
        
        # Add many-to-many relationships
        if categories_data:
            for category in categories_data:
                TechniqueCategory.objects.create(technique=technique, category=category)
                
        if subcategories_data:
            for subcategory in subcategories_data:
                TechniqueSubCategory.objects.create(technique=technique, subcategory=subcategory)
                
        if tags_data:
            for tag in tags_data:
                TechniqueTag.objects.create(technique=technique, tag=tag)
        
        # Process attributes
        for attr_type_id, value_data in attributes_data.items():
            attr_type = AttributeType.objects.get(id=attr_type_id)
            
            # Handle both single and multi-valued attributes
            if isinstance(value_data, list):
                for value_id in value_data:
                    attr_value = AttributeValue.objects.get(id=value_id)
                    TechniqueAttribute.objects.create(
                        technique=technique,
                        attribute_value=attr_value
                    )
            else:
                # Single value case
                attr_value = AttributeValue.objects.get(id=value_data)
                TechniqueAttribute.objects.create(
                    technique=technique,
                    attribute_value=attr_value
                )
        
        return technique
    
    def update(self, instance, validated_data):
        categories_data = validated_data.pop('categories', None)
        subcategories_data = validated_data.pop('subcategories', None)
        tags_data = validated_data.pop('tags', None)
        attributes_data = validated_data.pop('attributes_data', None)
        
        # Update the base fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update related data if provided
        if categories_data is not None:
            # Clear existing categories and add new ones
            TechniqueCategory.objects.filter(technique=instance).delete()
            for category in categories_data:
                TechniqueCategory.objects.create(technique=instance, category=category)
                
        if subcategories_data is not None:
            # Clear existing subcategories and add new ones
            TechniqueSubCategory.objects.filter(technique=instance).delete()
            for subcategory in subcategories_data:
                TechniqueSubCategory.objects.create(technique=instance, subcategory=subcategory)
                
        if tags_data is not None:
            # Clear existing tags and add new ones
            TechniqueTag.objects.filter(technique=instance).delete()
            for tag in tags_data:
                TechniqueTag.objects.create(technique=instance, tag=tag)
        
        # Update attributes if provided
        if attributes_data is not None:
            # Clear existing attributes
            TechniqueAttribute.objects.filter(technique=instance).delete()
            
            # Add new attributes
            for attr_type_id, value_data in attributes_data.items():
                attr_type = AttributeType.objects.get(id=attr_type_id)
                
                # Handle both single and multi-valued attributes
                if isinstance(value_data, list):
                    for value_id in value_data:
                        attr_value = AttributeValue.objects.get(id=value_id)
                        TechniqueAttribute.objects.create(
                            technique=instance,
                            attribute_value=attr_value
                        )
                else:
                    # Single value case
                    attr_value = AttributeValue.objects.get(id=value_data)
                    TechniqueAttribute.objects.create(
                        technique=instance,
                        attribute_value=attr_value
                    )
        
        return instance