"""Stub file for rest_framework.decorators."""

from typing import Callable, List, Any, Union


def api_view(http_methods: List[str]) -> Callable:
    """
    Stub for the @api_view decorator which specifies the HTTP methods
    that a view should respond to.
    """

    def decorator(func: Callable) -> Callable:
        return func

    return decorator


def permission_classes(permission_classes: List[Any]) -> Callable:
    """
    Stub for the @permission_classes decorator which specifies the
    permissions that should be required to access the view.
    """

    def decorator(func: Callable) -> Callable:
        return func

    return decorator


def authentication_classes(authentication_classes: List[Any]) -> Callable:
    """
    Stub for the @authentication_classes decorator which specifies
    the authentication methods that should be used.
    """

    def decorator(func: Callable) -> Callable:
        return func

    return decorator
