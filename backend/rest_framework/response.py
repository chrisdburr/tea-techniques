"""Stub file for rest_framework.response."""


class Response:
    """Stub for Response class."""

    def __init__(
        self,
        data=None,
        status=None,
        template_name=None,
        headers=None,
        exception=False,
        content_type=None,
    ):
        self.data = data
        self.status = status
        self.status_code = status  # Added this attribute
        self.template_name = template_name
        self.headers = headers
        self.exception = exception
        self.content_type = content_type
