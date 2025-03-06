# api/urls.py

from django.urls import path, include
from .views.api_views import get_categorylist, get_subcategorylist, debug_endpoint
from rest_framework import routers
from .views.api_views import (
    AssuranceGoalsViewSet,
    CategoryViewSet,
    SubCategoryViewSet,
    TagsViewSet,
    TechniquesViewSet,
    AttributeTypesViewSet,
    AttributeValuesViewSet,
    ResourceTypesViewSet,
)

router = routers.DefaultRouter()
router.register(r"assurancegoals", AssuranceGoalsViewSet)
router.register(r"category", CategoryViewSet)
router.register(r"subcategory", SubCategoryViewSet)
router.register(r"tags", TagsViewSet)
router.register(r"techniques", TechniquesViewSet)
router.register(r"attributetypes", AttributeTypesViewSet)
router.register(r"attributevalues", AttributeValuesViewSet)
router.register(r"resourcetypes", ResourceTypesViewSet)

urlpatterns = [
    path("", include(router.urls)),  # API endpoints
    path(
        "get_categorylist/<int:assurance_goal_id>/",
        get_categorylist,
        name="get_categorylist",
    ),
    path(
        "get_subcategorylist/<int:category_id>/",
        get_subcategorylist,
        name="get_subcategorylist",
    ),
    path("debug/", debug_endpoint, name="debug_endpoint"),
]
