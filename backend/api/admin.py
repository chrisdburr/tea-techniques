from django.contrib import admin
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
    TechniqueLimitation,
)

# Register base models
admin.site.register(AssuranceGoal)
admin.site.register(Category)
admin.site.register(SubCategory)
admin.site.register(Tag)

# Register attribute models
admin.site.register(AttributeType)
admin.site.register(AttributeValue)
admin.site.register(ResourceType)

# Register technique model
admin.site.register(Technique)

# Register relationships and through models
admin.site.register(TechniqueAssuranceGoal)
admin.site.register(TechniqueCategory)
admin.site.register(TechniqueSubCategory)
admin.site.register(TechniqueTag)
admin.site.register(TechniqueRelationship)
admin.site.register(TechniqueAttribute)
admin.site.register(TechniqueResource)
admin.site.register(TechniqueExampleUseCase)
admin.site.register(TechniqueLimitation)