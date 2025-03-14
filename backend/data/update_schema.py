import json
import csv
import os
from typing import Dict, List, Any, Optional


def load_json_file(file_path: str) -> Dict:
    """Load a JSON file and return its contents as a dictionary."""
    with open(file_path, "r") as f:
        return json.load(f)


def load_csv_file(file_path: str) -> List[Dict]:
    """Load a CSV file and return its contents as a list of dictionaries."""
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)


def save_csv_file(file_path: str, data: List[Dict], fieldnames: List[str]) -> None:
    """Save a list of dictionaries to a CSV file."""
    with open(file_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)


def update_schema(schema_path: str, output_path: str) -> None:
    """Update the schema to include model-specific information."""
    schema = load_json_file(schema_path)

    # Add applicable_models field to the schema
    schema["properties"]["applicable_models"] = {
        "type": "string",
        "description": "JSON string containing model types this technique is specifically applicable to",
    }

    # Save the updated schema
    with open(output_path, "w") as f:
        json.dump(schema, f, indent=2)

    print(f"Updated schema saved to {output_path}")


def extract_model_specific_info(model_specific_path: str) -> Dict[int, List[str]]:
    """Extract model-specific information from the JSON file."""
    model_specific_data = load_json_file(model_specific_path)

    # Create a mapping from technique ID to list of applicable models
    technique_to_models = {}

    for model_category, category_data in model_specific_data.get(
        "model_specific_techniques", {}
    ).items():
        for technique in category_data.get("techniques", []):
            technique_id = technique.get("id")
            applicable_models = technique.get("applicable_models", [])

            if technique_id and applicable_models:
                technique_to_models[technique_id] = applicable_models

    return technique_to_models


def update_csv_with_model_info(
    csv_path: str, technique_to_models: Dict[int, List[str]], output_path: str
) -> None:
    """Update the CSV file with model-specific information."""
    # Load the CSV data
    csv_data = load_csv_file(csv_path)

    # Add the new applicable_models field
    for row in csv_data:
        technique_id = int(row["id"])
        if technique_id in technique_to_models:
            # Convert the model list to a JSON string
            row["applicable_models"] = json.dumps(technique_to_models[technique_id])
        else:
            # If no specific models are listed, include an empty array
            row["applicable_models"] = "[]"

    # Get all field names (old fields + new field)
    fieldnames = list(csv_data[0].keys())

    # Save the updated CSV
    save_csv_file(output_path, csv_data, fieldnames)

    print(f"Updated CSV saved to {output_path}")


def main():
    # Define file paths
    current_dir = os.path.dirname(os.path.abspath(__file__))
    schema_path = os.path.join(current_dir, "schema.json")
    model_specific_path = os.path.join(current_dir, "model-specific.json")
    csv_path = os.path.join(current_dir, "techniques_v2.csv")

    # Define output paths
    updated_schema_path = os.path.join(current_dir, "schema_updated.json")
    updated_csv_path = os.path.join(current_dir, "techniques_v2_updated.csv")

    # Update the schema
    update_schema(schema_path, updated_schema_path)

    # Extract model-specific information
    technique_to_models = extract_model_specific_info(model_specific_path)

    # Update the CSV with model-specific information
    update_csv_with_model_info(csv_path, technique_to_models, updated_csv_path)

    print("Process completed successfully!")


if __name__ == "__main__":
    main()
