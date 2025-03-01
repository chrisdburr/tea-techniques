# api/api_urls.py

from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions
from .views.api_views import (
    AssuranceGoalsViewSet,
    CategoryViewSet,
    SubCategoryViewSet,
    TagsViewSet,
    TechniquesViewSet,
    get_categorylist,
    get_subcategorylist,
    FairnessApproachesViewSet,
    ProjectLifecycleStagesViewSet,
    debug_endpoint,
)


@api_view(["GET"])
def api_root(request, format=None):
    """
    API root providing links to all primary endpoints
    """
    return Response(
        {
            "assurance_goals": reverse(
                "assurancegoal-list", request=request, format=format
            ),
            "categories": reverse("category-list", request=request, format=format),
            "subcategories": reverse(
                "subcategory-list", request=request, format=format
            ),
            "tags": reverse("tag-list", request=request, format=format),
            "techniques": reverse("technique-list", request=request, format=format),
            "fairness_approaches": reverse(
                "fairnessapproach-list", request=request, format=format
            ),
            "project_lifecycle_stages": reverse(
                "projectlifecyclestage-list", request=request, format=format
            ),
        }
    )


# Schema view for Swagger documentation
schema_view = get_schema_view(
    openapi.Info(
        title="TEA Techniques API",
        default_version="v1",
        description="API for Trustworthy and Ethical Assurance (TEA) Techniques",
        terms_of_service="https://www.yourapp.com/terms/",
        contact=openapi.Contact(email="contact@yourapp.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

router = DefaultRouter()
router.register(r"assurance-goals", AssuranceGoalsViewSet)
router.register(r"categories", CategoryViewSet)
router.register(r"subcategories", SubCategoryViewSet)
router.register(r"tags", TagsViewSet)
router.register(r"techniques", TechniquesViewSet)
router.register(r"fairness-approaches", FairnessApproachesViewSet)
router.register(r"project-lifecycle-stages", ProjectLifecycleStagesViewSet)

urlpatterns = [
    path("debug/", debug_endpoint, name="debug-endpoint"),
    path("", api_root, name="api-root"),
    path("", include(router.urls)),
    path(
        "categories-by-goal/<int:assurance_goal_id>/",
        get_categorylist,
        name="categories-by-goal",
    ),
    path(
        "subcategories-by-category/<int:category_id>/",
        get_subcategorylist,
        name="subcategories-by-category",
    ),
    # Authentication
    path("auth/", include("rest_framework.urls", namespace="rest_framework")),
    # Swagger documentation
    re_path(
        r"^swagger(?P<format>\.json|\.yaml)$",
        schema_view.without_ui(cache_timeout=0),
        name="schema-json",
    ),
    re_path(
        r"^swagger/$",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    re_path(
        r"^redoc/$", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"
    ),
]
