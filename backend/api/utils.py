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
            raw_detail = response.data["detail"]
            if isinstance(raw_detail, dict):
                detail_str_parts = []
                for field, errors in raw_detail.items():
                    if isinstance(errors, list):
                        errors_joined = "; ".join(errors)
                        detail_str_parts.append(f"{field}: {errors_joined}")
                    else:
                        detail_str_parts.append(f"{field}: {errors}")
                detail_str = " | ".join(detail_str_parts)
                response.data["detail"] = detail_str
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
