# api/urls.py

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
    TagsViewSet,
    TechniquesViewSet,
    ResourceTypesViewSet,
    health_check_detailed,
    debug_echo,
    health_check,
)
from .views.auth_views import (
    get_csrf,
    login_view,
    logout_view,
    user_view,
    auth_status_view,
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
            "tags": reverse("tag-list", request=request, format=format),
            "techniques": reverse("technique-list", request=request, format=format),
            "resource_types": reverse(
                "resourcetype-list", request=request, format=format
            ),
            "health": reverse("health-check", request=request, format=format),
            "debug_info": reverse("debug-info", request=request, format=format),
            "debug_echo": reverse("debug-echo", request=request, format=format),
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
router.register(r"tags", TagsViewSet)
router.register(r"techniques", TechniquesViewSet)
router.register(r"resource-types", ResourceTypesViewSet)

urlpatterns = [
    path("health/", health_check, name="health-check"),
    path("debug/info", health_check_detailed, name="debug-info"),
    path("debug/info/", health_check_detailed, name="debug-info-slash"),
    path("debug/echo", debug_echo, name="debug-echo"),
    path("debug/echo/", debug_echo, name="debug-echo-slash"),
    path("", api_root, name="api-root"),
    path("", include(router.urls)),
    # Authentication - DRF's built-in auth views
    path("auth/", include("rest_framework.urls")),
    # Custom auth endpoints
    path("auth/csrf", get_csrf, name="get-csrf"),
    path("auth/login", login_view, name="login"),
    path("auth/logout", logout_view, name="logout"),
    path("auth/user", user_view, name="user"),
    path("auth/status", auth_status_view, name="auth-status"),
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
        r"^redoc/$",
        schema_view.with_ui("redoc", cache_timeout=0),
        name="schema-redoc-slash",
    ),
]
