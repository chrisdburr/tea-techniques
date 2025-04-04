"""Stub file for rest_framework.request."""


class Request:
    """Stub for Request class."""

    def __init__(
        self,
        request=None,
        parsers=None,
        authenticators=None,
        negotiator=None,
        parser_context=None,
        accepted_media_type=None,
    ):
        self.request = request
        self.parsers = parsers
        self.authenticators = authenticators
        self.negotiator = negotiator
        self.parser_context = parser_context
        self.accepted_media_type = accepted_media_type
        self.data = {}
        self.content_type = None
        self.headers = {}

    def get_host(self):
        """Return the host from the request."""
        return "localhost"

    @property
    def path(self):
        """Return the path from the request."""
        return "/api/"

    @property
    def method(self):
        """Return the HTTP method from the request."""
        return "GET"
