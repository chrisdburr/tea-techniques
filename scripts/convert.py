#!/usr/bin/env python
"""
Converter script to transform techniques.csv into techniques.json
Run from the project root: python scripts/convert_csv_to_json.py
"""

import csv
import json
import sys
import os
from pathlib import Path

def clean_json_string(json_str):
    """Clean and parse a JSON string from the CSV"""
    if not json_str or not json_str.strip():
        return []
    
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        print(f"Problematic string: {json_str}")
        return []

def convert_csv_to_json(csv_path, json_path):
    """Convert techniques CSV file to JSON format"""
    techniques = []
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as csv_file:
            reader = csv.DictReader(csv_file)
            
            for row in reader:
                # Process each row and convert embedded JSON strings
                technique = {
                    "id": int(row["id"]) if row.get("id", "").strip().isdigit() else None,
                    "name": row.get("name", "").strip(),
                    "description": row.get("description", "").strip(),
                    "model_dependency": row.get("model_dependency", "").strip(),
                    "assurance_goals": [
                        goal.strip() for goal in row.get("assurance_goals", "").split(",") 
                        if goal.strip()
                    ],
                    "category_tags": row.get("category_tags", "").strip(),
                    "complexity_rating": int(row["complexity_rating"]) if row.get("complexity_rating", "").strip().isdigit() else None,
                    "computational_cost_rating": int(row["computational_cost_rating"]) if row.get("computational_cost_rating", "").strip().isdigit() else None,
                }
                
                # Handle JSON fields
                technique["attributes"] = clean_json_string(row.get("attributes", ""))
                technique["example_use_cases"] = clean_json_string(row.get("example_use_cases", ""))
                technique["resources"] = clean_json_string(row.get("resources", ""))
                
                # Handle applicable_models
                if "applicable_models" in row:
                    applicable_models = clean_json_string(row.get("applicable_models", ""))
                    technique["applicable_models"] = applicable_models
                
                # Handle limitations (pipe-separated)
                if "limitations" in row and row["limitations"].strip():
                    technique["limitations"] = [
                        limit.strip() for limit in row["limitations"].split("|") 
                        if limit.strip()
                    ]
                else:
                    technique["limitations"] = []
                
                techniques.append(technique)
        
        # Write the JSON file with proper formatting
        with open(json_path, 'w', encoding='utf-8') as json_file:
            json.dump(techniques, json_file, indent=2, ensure_ascii=False)
            
        print(f"Successfully converted {len(techniques)} techniques to JSON format.")
        print(f"Output saved to: {json_path}")
        
    except Exception as e:
        print(f"Error converting CSV to JSON: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Determine file paths
    base_dir = Path(__file__).resolve().parent.parent
    data_dir = base_dir / "backend" / "data"
    
    csv_path = data_dir / "techniques.csv"
    json_path = data_dir / "techniques.json"
    
    # Ensure data directory exists
    os.makedirs(data_dir, exist_ok=True)
    
    print(f"Converting: {csv_path}")
    convert_csv_to_json(csv_path, json_path)