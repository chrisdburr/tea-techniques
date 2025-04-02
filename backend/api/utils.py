# backend/api/utils.py

from __future__ import annotations

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import APIException
import logging
from typing import Any, Dict, List, Optional, Union, cast

logger = logging.getLogger(__name__)


def custom_exception_handler(exc: Exception, context: Dict[str, Any]) -> Optional[Response]:
    """
    Custom exception handler for REST framework that standardizes error responses.
    
    Returns a consistent error format for all exceptions:
    {
        "detail": "Human-readable error message",
        "status_code": 400,
        "error_type": "ValidationError",
        "errors": {} | null (field-specific errors when applicable)
    }
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    # If response is None, there was an unhandled exception
    if response is None:
        logger.error(f"Unhandled exception: {str(exc)}")
        return Response(
            {
                "detail": "Internal server error occurred",
                "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
                "error_type": exc.__class__.__name__,
                "errors": None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Standardize the response format
    field_errors = None
    detail_message = "An error occurred"
    
    if isinstance(response.data, dict):
        # Case 1: Validation errors with field-specific messages
        if "non_field_errors" in response.data or any(
            isinstance(response.data.get(field), list) for field in response.data
        ):
            # This is likely a validation error with field-specific messages
            field_errors = response.data
            
            # Create a user-friendly summary message
            if "non_field_errors" in response.data:
                detail_message = "; ".join(response.data["non_field_errors"])
            else:
                detail_message = "Validation error"
                
        # Case 2: Response with 'detail' field
        elif "detail" in response.data:
            detail_message = str(response.data["detail"])
            # Check if there are nested errors to extract
            if isinstance(response.data.get("errors"), dict):
                field_errors = response.data["errors"]
    
    # Prepare the standardized response format
    standardized_response = {
        "detail": detail_message,
        "status_code": response.status_code,
        "error_type": exc.__class__.__name__,
        "errors": field_errors
    }
    
    # Replace the original response data with our standardized format
    response.data = standardized_response
    
    return response
