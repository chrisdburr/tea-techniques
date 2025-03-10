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
    AttributeTypesViewSet,
    AttributeValuesViewSet,
    ResourceTypesViewSet,
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
            "attribute_types": reverse(
                "attributetype-list", request=request, format=format
            ),
            "attribute_values": reverse(
                "attributevalue-list", request=request, format=format
            ),
            "resource_types": reverse(
                "resourcetype-list", request=request, format=format
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

router = DefaultRouter(trailing_slash=False)
router.register(r"assurance-goals", AssuranceGoalsViewSet)
router.register(r"categories", CategoryViewSet)
router.register(r"subcategories", SubCategoryViewSet)
router.register(r"tags", TagsViewSet)
router.register(r"techniques", TechniquesViewSet)
router.register(r"attribute-types", AttributeTypesViewSet)
router.register(r"attribute-values", AttributeValuesViewSet)
router.register(r"resource-types", ResourceTypesViewSet)

urlpatterns = [
    path("debug", debug_endpoint, name="debug-endpoint"),
    # Also add path with trailing slash for compatibility
    path("debug/", debug_endpoint, name="debug-endpoint-slash"),
    path("", api_root, name="api-root"),
    path("", include(router.urls)),
    path(
        "categories-by-goal/<int:assurance_goal_id>",
        get_categorylist,
        name="categories-by-goal",
    ),
    path(
        "subcategories-by-category/<int:category_id>",
        get_subcategorylist,
        name="subcategories-by-category",
    ),
    # Authentication
    path("auth", include("rest_framework.urls", namespace="rest_framework")),
    # Swagger documentation
    re_path(
        r"^swagger(?P<format>\.json|\.yaml)$",
        schema_view.without_ui(cache_timeout=0),
        name="schema-json",
    ),
    re_path(
        r"^swagger$",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    # Also keep trailing slash versions for backward compatibility
    re_path(
        r"^swagger/$",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui-slash",
    ),
    re_path(
        r"^redoc$", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"
    ),
    re_path(
        r"^redoc/$", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc-slash"
    ),
]
