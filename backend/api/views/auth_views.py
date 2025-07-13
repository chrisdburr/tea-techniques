# api/views/auth_views.py
import json
import logging
from typing import cast

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def get_csrf(request):
    """
    Get CSRF token for the front end
    """
    csrf_token = get_token(request)
    return Response({"csrfToken": csrf_token})


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    """
    Log in a user
    """
    # Handle both JSON and form data
    data = json.loads(request.body) if request.content_type == "application/json" else request.data

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return Response(
            {"detail": "Please provide both username and password"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Authenticate the user
    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)
        # Cast to User for MyPy - authenticate returns AbstractBaseUser but we know it's User
        user_cast = cast(User, user)
        return Response(
            {
                "user": {
                    "id": user_cast.id,  # type: ignore[attr-defined]
                    "username": user_cast.username,
                    "email": user_cast.email,
                    "isStaff": user_cast.is_staff,
                }
            }
        )

    return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Log out a user
    """
    logout(request)
    return Response({"detail": "Successfully logged out"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_view(request):
    """
    Get the current user's information
    """
    user = request.user
    return Response(
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "isStaff": user.is_staff,
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def auth_status_view(request):
    """
    Check if the user is authenticated
    """
    if request.user.is_authenticated:
        return Response(
            {
                "isAuthenticated": True,
                "user": {
                    "id": request.user.id,
                    "username": request.user.username,
                    "email": request.user.email,
                    "isStaff": request.user.is_staff,
                },
            }
        )

    return Response({"isAuthenticated": False})
