#!/usr/bin/env python
"""
Validation script for techniques.json
Run from the project root: python scripts/validate_json.py
"""

import json
import sys
import os
from pathlib import Path
from jsonschema import validate, ValidationError


def validate_techniques_json(json_path, schema_path):
    """Validate the techniques JSON file against the schema"""
    try:
        # Load the JSON data
        with open(json_path, "r", encoding="utf-8") as json_file:
            techniques_data = json.load(json_file)

        # Load the schema
        with open(schema_path, "r", encoding="utf-8") as schema_file:
            schema = json.load(schema_file)

        # Validate the data against the schema
        validate(instance=techniques_data, schema=schema)

        # Additional custom validations
        errors = []

        for i, technique in enumerate(techniques_data):
            # Check for name uniqueness
            names = [t["name"] for t in techniques_data]
            duplicate_names = {name for name in names if names.count(name) > 1}
            if duplicate_names:
                errors.append(
                    f"Duplicate technique names found: {', '.join(duplicate_names)}"
                )

            # Check for valid assurance goals
            valid_goals = [
                "Explainability",
                "Fairness",
                "Privacy",
                "Reliability",
                "Safety",
                "Transparency",
            ]

            for goal in technique.get("assurance_goals", []):
                if goal not in valid_goals:
                    errors.append(
                        f"Technique '{technique['name']}': Invalid assurance goal '{goal}'"
                    )

            # Additional custom validations can be added here

        # Report any errors
        if errors:
            print("Custom validation errors found:")
            for error in errors:
                print(f"- {error}")
            return False

        print(
            f"✅ Validation successful: {len(techniques_data)} techniques validated against schema"
        )
        return True

    except ValidationError as e:
        print(f"❌ Schema validation error: {e.message}")
        print(f"   at path: {'.'.join([str(p) for p in e.path])}")
        return False
    except Exception as e:
        print(f"❌ Error validating JSON: {str(e)}")
        return False


if __name__ == "__main__":
    # Determine file paths
    base_dir = Path(__file__).resolve().parent.parent
    data_dir = base_dir / "backend" / "data"

    json_path = data_dir / "techniques.json"
    schema_path = data_dir / "techniques_schema.json"

    # Check if files exist
    if not json_path.exists():
        print(f"Error: JSON file not found at {json_path}")
        sys.exit(1)

    if not schema_path.exists():
        print(f"Error: Schema file not found at {schema_path}")
        sys.exit(1)

    # Validate the JSON
    is_valid = validate_techniques_json(json_path, schema_path)

    if is_valid:
        sys.exit(0)
    else:
        sys.exit(1)
