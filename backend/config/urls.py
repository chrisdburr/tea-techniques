# config/urls.py

from django.contrib import admin
from django.urls import path, include
from rest_framework.documentation import include_docs_urls
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

# Create schema view for Swagger documentation
schema_view = get_schema_view(
    openapi.Info(
        title="TEA Techniques API",
        default_version="v1",
        description="API for Trustworthy and Ethical Assurance Techniques",
        contact=openapi.Contact(email="cburr@turing.ac.uk"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.api_urls")),
    # Also support paths without trailing slash
    path("api", include("api.api_urls")),
    path("__reload__/", include("django_browser_reload.urls")),
    path(
        "swagger/",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    path(
        "swagger",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui-no-slash",
    ),
    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
    path(
        "redoc",
        schema_view.with_ui("redoc", cache_timeout=0),
        name="schema-redoc-no-slash",
    ),
    path("", include("api.root_urls")),
]
