# config/urls.py

from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from drf_yasg import openapi

# from rest_framework.documentation import include_docs_urls # Unused import
from drf_yasg.views import get_schema_view
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
    path("api/", include("api.urls")),
    path("__reload__/", include("django_browser_reload.urls")),
    path(
        "swagger/",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",  # Keep only the version without trailing slash
    ),
    # path(
    #     "swagger/", # Removed redundant trailing slash version
    #     schema_view.with_ui("swagger", cache_timeout=0),
    #     name="schema-swagger-ui",
    # ),
    path(
        "redoc", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"
    ),  # Keep only the version without trailing slash
    # path(
    #     "redoc/", # Removed redundant trailing slash version
    #     schema_view.with_ui("redoc", cache_timeout=0),
    #     name="schema-redoc",
    # ),
    path("", include("api.root_urls")),
]

if settings.DEBUG:
    try:
        import debug_toolbar

        urlpatterns = [
            path("__debug__/", include(debug_toolbar.urls)),
            *urlpatterns,
        ]
    except ImportError:
        # Handle case where debug_toolbar is not installed
        pass
