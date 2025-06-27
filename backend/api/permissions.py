# api/permissions.py
"""
Custom permission classes for role-based access control.

This module contains permission classes that enforce access control
based on user roles defined in the User model.
"""

from __future__ import annotations

from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import View


class IsAdminUser(BasePermission):
    """
    Permission that only allows access to admin users.
    """
    
    def has_permission(self, request: Request, view: View) -> bool:
        """Check if user is authenticated and has admin role."""
        return (
            request.user 
            and request.user.is_authenticated 
            and hasattr(request.user, 'is_admin')
            and request.user.is_admin()
        )


class IsModeratorOrAdmin(BasePermission):
    """
    Permission that allows access to moderator and admin users.
    """
    
    def has_permission(self, request: Request, view: View) -> bool:
        """Check if user is authenticated and has moderator role or higher."""
        return (
            request.user 
            and request.user.is_authenticated 
            and hasattr(request.user, 'is_moderator')
            and request.user.is_moderator()
        )


class IsAuthenticatedUser(BasePermission):
    """
    Permission that allows access to all authenticated users.
    """
    
    def has_permission(self, request: Request, view: View) -> bool:
        """Check if user is authenticated."""
        return (
            request.user 
            and request.user.is_authenticated 
            and hasattr(request.user, 'is_authenticated_user')
            and request.user.is_authenticated_user()
        )


class ReadOnlyOrModeratorPermission(BasePermission):
    """
    Permission that allows read-only access to all users,
    but write access only to moderators and admins.
    """
    
    def has_permission(self, request: Request, view: View) -> bool:
        """
        Allow read access to all users, write access only to moderators/admins.
        """
        # Allow read access (GET, HEAD, OPTIONS) to all users
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # For write operations, require moderator role or higher
        return (
            request.user 
            and request.user.is_authenticated 
            and hasattr(request.user, 'is_moderator')
            and request.user.is_moderator()
        )


class CanSuggestChangesPermission(BasePermission):
    """
    Permission that allows authenticated users to suggest changes.
    """
    
    def has_permission(self, request: Request, view: View) -> bool:
        """
        Allow authenticated users to create suggestions.
        """
        return (
            request.user 
            and request.user.is_authenticated 
            and hasattr(request.user, 'can_suggest_changes')
            and request.user.can_suggest_changes()
        )


class AdminOnlyWritePermission(BasePermission):
    """
    Permission that allows read access to all users,
    but write access only to admins.
    """
    
    def has_permission(self, request: Request, view: View) -> bool:
        """
        Allow read access to all users, write access only to admins.
        """
        # Allow read access to all users (including unauthenticated)
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # For write operations, require admin role
        return (
            request.user 
            and request.user.is_authenticated 
            and hasattr(request.user, 'is_admin')
            and request.user.is_admin()
        )