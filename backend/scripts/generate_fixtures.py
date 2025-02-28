import csv
import json
from pathlib import Path


def read_csv_file(file_path):
    with open(file_path, newline="", encoding="utf-8-sig") as csvfile:
        reader = csv.DictReader(csvfile)
        return list(reader)


def get_assurance_goal_id(goal_name):
    return 1 if goal_name == "Explainability" else 2


def find_category_id(categories_data, category_name):
    for category in categories_data:
        if category["fields"]["name"] == category_name:
            return category["pk"]
    return None


def find_subcategory_id(subcategories_data, subcategory_name):
    for subcategory in subcategories_data:
        if subcategory["fields"]["name"] == subcategory_name:
            return subcategory["pk"]
    return None


def load_json_fixture(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def create_technique_fixture(
    technique_data, pk, assurance_goal_id, category_id, subcategory_id
):
    return {
        "model": "api.technique",
        "pk": pk,
        "fields": {
            "name": technique_data["Technique Name"],
            "description": technique_data["Description"],
            "assurance_goal": assurance_goal_id,
            "category": category_id,
            "sub_category": subcategory_id,
            "model_dependency": technique_data.get("Model Dependency", "Agnostic"),
            "example_use_case": technique_data.get("Example Use Case", ""),
            "scope": technique_data.get("Scope", None),
            "reference": "",
            "software_package": "",
            "limitation": "",
        },
    }


def main():
    base_dir = Path(__file__).resolve().parent.parent
    fixtures_dir = base_dir / "api" / "fixtures"
    csv_dir = base_dir / "api" / "management" / "commands"

    # Load existing fixtures
    categories = load_json_fixture(fixtures_dir / "categories.json")
    subcategories = load_json_fixture(fixtures_dir / "sub_categories.json")

    # Read CSV files
    explainability_data = read_csv_file(csv_dir / "explainability_techniques.csv")
    fairness_data = read_csv_file(csv_dir / "fairness_techniques.csv")

    techniques = []
    pk_counter = 1

    # Process explainability techniques
    for technique in explainability_data:
        category_id = find_category_id(categories, technique["Category"])
        subcategory_id = (
            find_subcategory_id(subcategories, technique["Sub-Category"])
            if technique.get("Sub-Category")
            else None
        )

        technique_fixture = create_technique_fixture(
            technique,
            pk_counter,
            assurance_goal_id=1,  # Explainability
            category_id=category_id,
            subcategory_id=subcategory_id,
        )
        techniques.append(technique_fixture)
        pk_counter += 1

    # Process fairness techniques
    for technique in fairness_data:
        category_id = find_category_id(categories, technique["Category"])
        subcategory_id = (
            find_subcategory_id(subcategories, technique["Sub-Category"])
            if technique.get("Sub-Category")
            else None
        )

        technique_fixture = create_technique_fixture(
            technique,
            pk_counter,
            assurance_goal_id=2,  # Fairness
            category_id=category_id,
            subcategory_id=subcategory_id,
        )
        techniques.append(technique_fixture)
        pk_counter += 1

    # Write techniques fixture
    output_path = fixtures_dir / "techniques.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(techniques, f, indent=2, ensure_ascii=False)

    print(f"Generated techniques fixture at {output_path}")
    print(f"Total techniques: {len(techniques)}")


if __name__ == "__main__":
    main()
