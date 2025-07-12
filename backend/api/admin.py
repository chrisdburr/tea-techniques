from django.contrib import admin

from .models import (AssuranceGoal, ResourceType, Tag, Technique,
                     TechniqueExampleUseCase, TechniqueLimitation,
                     TechniqueResource)


class TechniqueResourceInline(admin.TabularInline):
    """Inline admin for TechniqueResource model."""

    model = TechniqueResource
    extra = 1
    fields = [
        "resource_type",
        "title",
        "url",
        "source_type",
        "authors",
        "publication_date",
    ]


class TechniqueExampleUseCaseInline(admin.TabularInline):
    """Inline admin for TechniqueExampleUseCase model."""

    model = TechniqueExampleUseCase
    extra = 1
    fields = ["description", "assurance_goal"]


class TechniqueLimitationInline(admin.TabularInline):
    """Inline admin for TechniqueLimitation model."""

    model = TechniqueLimitation
    extra = 1
    fields = ["description"]


@admin.register(Technique)
class TechniqueAdmin(admin.ModelAdmin):
    """Admin interface for Technique model with comprehensive editing capabilities."""

    list_display = [
        "name",
        "complexity_rating",
        "computational_cost_rating",
        "get_tags_count",
        "get_goals_count",
    ]
    list_filter = [
        "complexity_rating",
        "computational_cost_rating",
        "assurance_goals",
        "tags",
    ]
    search_fields = ["name", "description"]
    filter_horizontal = ["assurance_goals", "tags", "related_techniques"]
    inlines = [
        TechniqueResourceInline,
        TechniqueExampleUseCaseInline,
        TechniqueLimitationInline,
    ]

    fieldsets = (
        ("Basic Information", {"fields": ("name", "description")}),
        ("Ratings", {"fields": ("complexity_rating", "computational_cost_rating")}),
        (
            "Classifications",
            {"fields": ("assurance_goals", "tags", "related_techniques")},
        ),
    )

    def get_tags_count(self, obj):
        """Return the number of tags associated with the technique."""
        return obj.tags.count()

    get_tags_count.short_description = "Tags"

    def get_goals_count(self, obj):
        """Return the number of assurance goals associated with the technique."""
        return obj.assurance_goals.count()

    get_goals_count.short_description = "Goals"


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    """Admin interface for Tag model."""

    list_display = ["name", "get_techniques_count"]
    search_fields = ["name"]

    def get_techniques_count(self, obj):
        """Return the number of techniques associated with the tag."""
        return obj.techniques.count()

    get_techniques_count.short_description = "Techniques"


# Register other models
admin.site.register(AssuranceGoal)
admin.site.register(ResourceType)
admin.site.register(TechniqueResource)
admin.site.register(TechniqueExampleUseCase)
admin.site.register(TechniqueLimitation)
