from django.contrib import admin
from .models import (
    AssuranceGoal,
    Category,
    SubCategory,
    Tag,
    Technique,
    AttributeType,
    AttributeValue,
    ResourceType,
    TechniqueResource,
    TechniqueExampleUseCase,
    TechniqueLimitation,
)

# Register all models
admin.site.register(AssuranceGoal)
admin.site.register(Category)
admin.site.register(SubCategory)
admin.site.register(Tag)
admin.site.register(AttributeType)
admin.site.register(AttributeValue)
admin.site.register(ResourceType)
admin.site.register(Technique)
admin.site.register(TechniqueResource)
admin.site.register(TechniqueExampleUseCase)
admin.site.register(TechniqueLimitation)
