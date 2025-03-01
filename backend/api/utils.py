# backend/api/utils.py

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler for REST framework that improves error responses.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    # If response is None, there was an unhandled exception
    if response is None:
        logger.error(f"Unhandled exception: {str(exc)}")
        return Response(
            {"detail": "Internal server error", "message": str(exc)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Add more context to the response data
    if isinstance(response.data, dict):
        # If it's a dictionary with a 'detail' key, keep that structure
        if "detail" in response.data:
            response.data = {
                "detail": response.data["detail"],
                "status_code": response.status_code,
                "error_type": exc.__class__.__name__,
            }
        # Otherwise, wrap the data in a standardized format
        else:
            response.data = {
                "errors": response.data,
                "status_code": response.status_code,
                "error_type": exc.__class__.__name__,
            }

    return response
