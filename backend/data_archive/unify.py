import csv
import json
import pandas as pd

# Read both CSV files
explainability_df = pd.read_csv("explainability_techniques.csv")
fairness_df = pd.read_csv("fairness_techniques.csv")

# Prepare output data
unified_data = []
id_counter = 1

# Process explainability techniques
for _, row in explainability_df.iterrows():
    # Extract scope attributes
    attributes = []
    if row["Scope Global"].lower() == "yes":
        attributes.append({"type": "Scope", "value": "Global"})
    if row["Scope Local"].lower() == "yes":
        attributes.append({"type": "Scope", "value": "Local"})

    # Create categories and subcategories
    categories = [{"goal": "Explainability", "category": row["Category"]}]
    subcategories = []
    if pd.notna(row["Sub-Category"]) and row["Sub-Category"]:
        subcategories.append(
            {"category": row["Category"], "subcategory": row["Sub-Category"]}
        )

    technique = {
        "id": id_counter,
        "name": row["Technique Name"],
        "description": row["Description"],
        "model_dependency": row["Model Dependency"],
        "assurance_goals": "Explainability",
        "categories": json.dumps(categories),
        "subcategories": json.dumps(subcategories),
        "attributes": json.dumps(attributes),
        "example_use_cases": json.dumps(
            [{"description": row["Example Use Case"], "goal": "Explainability"}]
        ),
        "limitations": "",
        "resources": "[]",
    }

    unified_data.append(technique)
    id_counter += 1

# Process fairness techniques
for _, row in fairness_df.iterrows():
    # Extract fairness-specific attributes
    attributes = []
    if pd.notna(row["Fairness Approach"]) and row["Fairness Approach"]:
        attributes.append(
            {"type": "Fairness Approach", "value": row["Fairness Approach"]}
        )
    if pd.notna(row["Project Lifecycle Stage"]) and row["Project Lifecycle Stage"]:
        attributes.append(
            {"type": "Project Lifecycle Stage", "value": row["Project Lifecycle Stage"]}
        )

    # Create categories and subcategories
    categories = [{"goal": "Fairness", "category": row["Category"]}]
    subcategories = []
    if pd.notna(row["Sub-Category"]) and row["Sub-Category"]:
        subcategories.append(
            {"category": row["Category"], "subcategory": row["Sub-Category"]}
        )

    technique = {
        "id": id_counter,
        "name": row["Technique Name"],
        "description": row["Description"],
        "model_dependency": row["Model Dependency"],
        "assurance_goals": "Fairness",
        "categories": json.dumps(categories),
        "subcategories": json.dumps(subcategories),
        "attributes": json.dumps(attributes),
        "example_use_cases": json.dumps(
            [{"description": row["Example Use Case"], "goal": "Fairness"}]
        ),
        "limitations": "",
        "resources": "[]",
    }

    unified_data.append(technique)
    id_counter += 1

# Write unified CSV
with open("unified_techniques.csv", "w", newline="", encoding="utf-8") as csvfile:
    fieldnames = [
        "id",
        "name",
        "description",
        "model_dependency",
        "assurance_goals",
        "categories",
        "subcategories",
        "attributes",
        "example_use_cases",
        "limitations",
        "resources",
    ]
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

    writer.writeheader()
    for technique in unified_data:
        writer.writerow(technique)

print(f"Unified CSV created with {len(unified_data)} techniques")
