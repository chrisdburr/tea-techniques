"""Stub file for rest_framework.serializers."""

from typing import Any, Dict, List, Type, Callable


class Field:
    """Base Field class for serializers."""

    def __init__(self, **kwargs):
        self.source = kwargs.get("source")
        self.required = kwargs.get("required", True)
        self.default = kwargs.get("default")
        self.label = kwargs.get("label")
        self.help_text = kwargs.get("help_text")


class ReadOnlyField(Field):
    """A field class that represents read-only fields."""

    def __init__(self, **kwargs):
        kwargs["read_only"] = True
        super().__init__(**kwargs)


class SerializerMethodField(Field):
    """A field class that calls a method on the serializer to get its value."""

    def __init__(self, method_name=None, **kwargs):
        self.method_name = method_name
        kwargs["read_only"] = True
        super().__init__(**kwargs)


class Serializer:
    """Base Serializer class."""

    def __init__(self, instance=None, data=None, **kwargs):
        self.instance = instance
        self.initial_data = data
        self.data = {}
        for key, value in kwargs.items():
            setattr(self, key, value)

    def is_valid(self, raise_exception=False):
        """Validate the serializer data."""
        return True

    def save(self, **kwargs):
        """Save the serializer instance."""
        return self.instance


class ModelSerializer(Serializer):
    """Base ModelSerializer class."""

    class Meta:
        model = None
        fields = "__all__"
