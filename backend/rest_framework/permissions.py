"""Stub file for rest_framework.permissions."""


class BasePermission:
    """
    Stub for a base permission class.
    All permission classes should inherit from this.
    """

    def has_permission(self, request, view):
        """
        Return `True` if permission is granted, `False` otherwise.
        """
        return True

    def has_object_permission(self, request, view, obj):
        """
        Return `True` if permission is granted, `False` otherwise.
        """
        return True


class AllowAny(BasePermission):
    """
    Stub for AllowAny permission class.
    Allow any access.
    """

    def has_permission(self, request, view):
        return True


class IsAuthenticated(BasePermission):
    """
    Stub for IsAuthenticated permission class.
    Allows access only to authenticated users.
    """

    def has_permission(self, request, view):
        return True
