#!/usr/bin/env python
# backend/scripts/generate_techniques.py

import csv
import json
import os


def read_csv(filepath):
    techniques = []
    with open(filepath, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            techniques.append(row)
    return techniques


def get_category_id(category_name, assurance_goal_id):
    # This mapping should match your categories.json fixture
    category_mapping = {
        # Explainability categories (assurance_goal_id = 1)
        ("Feature Analysis", 1): 1,
        ("Model Approximation", 1): 2,
        ("Visualisation Techniques", 1): 3,
        ("Example-Based Methods", 1): 4,
        ("Rule Extraction", 1): 5,
        ("Uncertainty and Reliability", 1): 6,
        ("Fairness Explanations", 1): 7,
        ("Model Simplification", 1): 8,
        # Fairness categories (assurance_goal_id = 2)
        ("Pre-Processing", 2): 9,
        ("In-Processing", 2): 10,
        ("Post-Processing", 2): 11,
        ("Fairness Metrics and Evaluation", 2): 12,
        ("Causal Fairness Methods", 2): 13,
        ("Interpretability and Explainability", 2): 14,
        ("Causal Methods", 2): 15,
    }
    return category_mapping.get((category_name, assurance_goal_id))


def get_subcategory_id(subcategory_name, category_id):
    # You'll need to update this mapping based on your actual subcategories.json
    subcategory_mapping = {
        ("Importance and Attribution", 1): 1,
        ("Interaction Analysis", 1): 2,
        ("Local Surrogates", 2): 3,
        ("Global Surrogates", 2): 4,
        ("Feature Visualisation", 3): 5,
        # Add more mappings as needed
    }
    return subcategory_mapping.get((subcategory_name, category_id))


def create_technique_object(row, pk, assurance_goal_id):
    category_id = get_category_id(row["Category"], assurance_goal_id)
    subcategory_id = get_subcategory_id(row.get("Sub-Category", ""), category_id)
    
    # If no valid category_id is found, default to the first category for the assurance goal
    if category_id is None:
        category_id = 1 if assurance_goal_id == 1 else 9  # Default to Feature Analysis or Pre-Processing
    
    # Create the technique object
    return {
        "model": "api.technique",
        "pk": pk,
        "fields": {
            "name": row["Technique Name"],
            "description": row["Description"],
            "assurance_goal": assurance_goal_id,
            "category": category_id,
            "sub_category": subcategory_id,
            "model_dependency": row.get("Model Dependency", "Model-Agnostic"),
            "example_use_case": row.get("Example Use Case", ""),
            "scope": row.get("Scope", None),
            "reference": "",
            "software_package": "",
            "limitation": "",
        },
    }


def main():
    # Define paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    commands_dir = os.path.join(base_dir, "api", "management", "commands")
    fixtures_dir = os.path.join(base_dir, "api", "fixtures")

    # Read the CSV files
    explainability_path = os.path.join(commands_dir, "explainability_techniques.csv")
    fairness_path = os.path.join(commands_dir, "fairness_techniques.csv")

    techniques = []
    pk = 1

    # Process explainability techniques
    if os.path.exists(explainability_path):
        explainability_techniques = read_csv(explainability_path)
        for technique in explainability_techniques:
            techniques.append(create_technique_object(technique, pk, 1))
            pk += 1

    # Process fairness techniques
    if os.path.exists(fairness_path):
        fairness_techniques = read_csv(fairness_path)
        for technique in fairness_techniques:
            techniques.append(create_technique_object(technique, pk, 2))
            pk += 1

    # Write the output file
    output_path = os.path.join(fixtures_dir, "techniques.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(techniques, f, indent=2, ensure_ascii=False)

    print(f"Generated {len(techniques)} techniques")
    print(f"Output written to {output_path}")


if __name__ == "__main__":
    main()
