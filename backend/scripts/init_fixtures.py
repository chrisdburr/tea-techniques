#!/usr/bin/env python
# backend/scripts/init_fixtures.py

import os
import json
import csv
from pathlib import Path


def ensure_directory(path):
    """Ensure a directory exists"""
    os.makedirs(path, exist_ok=True)


def create_fixture_if_not_exists(fixture_path, default_data):
    """Create a fixture file if it doesn't exist"""
    if not os.path.exists(fixture_path):
        with open(fixture_path, "w", encoding="utf-8") as f:
            json.dump(default_data, f, indent=2)
            print(f"Created fixture: {fixture_path}")


def main():
    # Setup paths
    base_dir = Path(__file__).resolve().parent.parent
    fixtures_dir = base_dir / "api" / "fixtures"

    # Ensure fixtures directory exists
    ensure_directory(fixtures_dir)

    # Create fixtures if they don't exist
    fixtures = {
        "assurance_goals.json": [
            {
                "model": "api.assurancegoal",
                "pk": 1,
                "fields": {
                    "name": "Explainability",
                    "description": "Ensuring model decisions are transparent and understandable.",
                },
            },
            {
                "model": "api.assurancegoal",
                "pk": 2,
                "fields": {
                    "name": "Fairness",
                    "description": "Promoting equitable outcomes across different user groups.",
                },
            },
        ],
        "techniques.json": [],  # Empty initial techniques fixture
    }

    for fixture_name, default_data in fixtures.items():
        fixture_path = fixtures_dir / fixture_name
        create_fixture_if_not_exists(fixture_path, default_data)


if __name__ == "__main__":
    main()
    print("Fixtures initialization complete")
