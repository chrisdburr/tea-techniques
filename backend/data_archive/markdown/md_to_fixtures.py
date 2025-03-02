# backend/scripts/md_to_fixtures.py

import pandas as pd
import json
from pathlib import Path
import markdown
from bs4 import BeautifulSoup


def md_table_to_df(md_file):
    """Convert markdown table to pandas DataFrame."""
    with open(md_file, "r", encoding="utf-8") as f:
        md_content = f.read()

    # Convert markdown to HTML
    html = markdown.markdown(md_content, extensions=["tables"])
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table")

    return pd.read_html(str(table))[0]


def create_technique_fixture(df, assurance_goal_id):
    """Create Django fixture for techniques."""
    fixtures = []
    for index, row in df.iterrows():
        # Get or create related objects (you'll need to implement this logic)
        category_id = get_category_id(row["Category"])
        subcategory_id = get_subcategory_id(row["Sub-Category"])

        fixture = {
            "model": "api.technique",
            "pk": index + 1,
            "fields": {
                "name": row["Technique Name"],
                "description": row["Description"],
                "assurance_goal": assurance_goal_id,
                "category": category_id,
                "sub_category": subcategory_id,
                "model_dependency": row["Model Dependency"],
                "example_use_case": row["Example Use Case"],
                # Add other fields as needed
            },
        }
        fixtures.append(fixture)

    return fixtures


def main():
    base_dir = Path(__file__).resolve().parent.parent

    # Convert explainability techniques
    explainability_df = md_table_to_df(
        base_dir / "md_to_db" / "explainability_techniques.md"
    )
    explainability_fixtures = create_technique_fixture(
        explainability_df, assurance_goal_id=1
    )

    # Convert fairness techniques
    fairness_df = md_table_to_df(base_dir / "md_to_db" / "fairness_techniques.md")
    fairness_fixtures = create_technique_fixture(fairness_df, assurance_goal_id=2)

    # Combine fixtures
    all_fixtures = explainability_fixtures + fairness_fixtures

    # Write to fixture file
    fixture_path = base_dir / "api" / "fixtures" / "techniques.json"
    with open(fixture_path, "w", encoding="utf-8") as f:
        json.dump(all_fixtures, f, indent=2)


if __name__ == "__main__":
    main()
