# api/root_urls.py

from django.urls import path
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse


@api_view(["GET"])
def api_root(request, format=None):
    """
    Welcome page that provides links to the API documentation
    """
    return Response(
        {
            "message": "Welcome to the TEA XAI Techniques API",
            "documentation": {
                "swagger": reverse("schema-swagger-ui", request=request, format=format),
                "redoc": reverse("schema-redoc", request=request, format=format),
            },
            "api_endpoints": reverse("api-root", request=request, format=format),
        }
    )


urlpatterns = [
    path("", api_root, name="root"),
]
