#!/usr/bin/env python3
import json
import os

# Paths to fixture files
fixtures_dir = "../api/fixtures"
assurance_goals_file = os.path.join(fixtures_dir, "assurance_goals.json")
categories_file = os.path.join(fixtures_dir, "categories.json")
sub_categories_file = os.path.join(fixtures_dir, "sub_categories.json")
techniques_file = os.path.join(fixtures_dir, "techniques.json")

# Fix sub_categories.json - add missing primary keys
with open(sub_categories_file, 'r') as f:
    sub_categories = json.load(f)

for i, sub_category in enumerate(sub_categories, 1):
    if 'pk' not in sub_category:
        sub_category['pk'] = i

with open(sub_categories_file, 'w') as f:
    json.dump(sub_categories, f, indent=4)

print("Fixed sub_categories.json - added primary keys")

# Create new techniques fixtures with proper relationships
with open(techniques_file, 'r') as f:
    techniques = json.load(f)

new_fixtures = []
technique_assurance_goals = []
technique_categories = []
technique_sub_categories = []

for technique in techniques:
    pk = technique['pk']
    fields = technique['fields']
    
    # Create a new technique without the relationships
    new_technique = {
        "model": "api.technique",
        "pk": pk,
        "fields": {
            "name": fields["name"],
            "description": fields["description"],
            "model_dependency": fields["model_dependency"]
        }
    }
    
    # Add the technique
    new_fixtures.append(new_technique)
    
    # Create assurance goal relationship if it exists
    if "assurance_goal" in fields and fields["assurance_goal"]:
        technique_assurance_goals.append({
            "model": "api.techniqueassurancegoal",
            "pk": pk,  # Using technique ID as PK for simplicity
            "fields": {
                "technique": pk,
                "assurance_goal": fields["assurance_goal"]
            }
        })
    
    # Create category relationship if it exists
    if "category" in fields and fields["category"]:
        technique_categories.append({
            "model": "api.techniquecategory",
            "pk": pk,  # Using technique ID as PK for simplicity
            "fields": {
                "technique": pk,
                "category": fields["category"]
            }
        })
    
    # Create subcategory relationship if it exists
    if "sub_category" in fields and fields["sub_category"]:
        technique_sub_categories.append({
            "model": "api.techniquesubcategory",
            "pk": pk,  # Using technique ID as PK for simplicity
            "fields": {
                "technique": pk,
                "subcategory": fields["sub_category"]
            }
        })

# Combine all fixtures
all_fixtures = new_fixtures + technique_assurance_goals + technique_categories + technique_sub_categories

# Save the new fixtures
with open(os.path.join(fixtures_dir, "updated_techniques.json"), 'w') as f:
    json.dump(all_fixtures, f, indent=4)

print("Created updated_techniques.json with proper relationships")
print("Done!")