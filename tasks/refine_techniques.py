import json
import sys

input_file = "backend/data/techniques.json"
output_file = "backend/data/techniques_refined.json"  # Save to refined first

# --- Step 2: Load Data ---
try:
    with open(input_file, "r", encoding="utf-8") as f:
        techniques_list = json.load(f)
    print(f"Successfully loaded {len(techniques_list)} techniques from {input_file}")
except Exception as e:
    print(f"Error loading JSON: {e}")
    sys.exit(1)  # Stop execution if loading fails

# --- Step 3: Remove Redundant/Categorical Techniques ---
ids_to_remove = {4, 9, 38, 41, 43, 58, 74, 80, 81, 82, 84, 114, 119, 124}
expected_names = {  # Optional: For safety check
    4: "Gini Importance",
    9: "Variable Importance in Random Forests (MDA MDG)",
    38: "Fairness-Aware Data Preprocessing",
    41: "Fairness Constraints and Regularization",
    43: "Individual Fairness Metrics",
    58: "Statistical Hypothesis Testing",
    74: "Feature Importance Ranking",
    80: "Variable Importance in Random Forests (MDA, MDG)",
    81: "Bayesian Networks",
    82: "Fairness Metrics (e.g., Equalized Odds, Demographic Parity)",
    84: "Knowledge Distillation",
    114: "Demographic Parity",
    119: "Counterfactual Fairness (Causal Modeling)",
    124: "SHAP Values for Fairness",
}

refined_techniques = []
removed_count = 0
print("\n--- Removing Techniques ---")
for technique in techniques_list:
    tech_id = technique.get("id")
    tech_name = technique.get("name")
    if tech_id in ids_to_remove:
        # Safety check (optional but recommended)
        if tech_id in expected_names and tech_name != expected_names[tech_id]:
            print(
                f"Warning: ID {tech_id} has unexpected name '{tech_name}'. Expected '{expected_names[tech_id]}'. Still removing."
            )
        elif tech_id not in expected_names:
            print(
                f"Warning: ID {tech_id} ('{tech_name}') was marked for removal but not in expected name list."
            )
        removed_count += 1
        print(f"Removing technique ID {tech_id}: {tech_name}")
    else:
        refined_techniques.append(technique)

print(f"Removed {removed_count} techniques. {len(refined_techniques)} remaining.")
techniques_list = refined_techniques  # Update the list for the next steps

# --- Step 4: Clean Up `limitations` Field Format ---
cleaned_limitations_count = 0
print("\n--- Cleaning Limitations ---")
for technique in techniques_list:
    if "limitations" in technique and isinstance(technique["limitations"], list):
        new_limitations = []
        needs_update = False
        for item in technique["limitations"]:
            if isinstance(item, str):
                needs_update = True  # Mark that we are changing the format
                cleaned_item = item.strip()
                if cleaned_item.startswith("[") and cleaned_item.endswith("]"):
                    try:
                        # Attempt to parse escaped JSON string like "[{\"description\": \"...\"}]"
                        parsed_list = json.loads(cleaned_item)
                        if isinstance(parsed_list, list) and len(parsed_list) > 0:
                            # Extract descriptions from the list items
                            for sub_item in parsed_list:
                                if (
                                    isinstance(sub_item, dict)
                                    and "description" in sub_item
                                    and sub_item["description"].strip()
                                ):
                                    new_limitations.append(
                                        {"description": sub_item["description"].strip()}
                                    )
                                elif (
                                    isinstance(sub_item, str) and sub_item.strip()
                                ):  # Handle lists of strings within the escaped JSON
                                    new_limitations.append(
                                        {"description": sub_item.strip()}
                                    )
                                else:
                                    print(
                                        f"Warning: Technique ID {technique.get('id')}: Found non-standard item in parsed limitation list: {sub_item}"
                                    )
                        else:
                            print(
                                f"Warning: Technique ID {technique.get('id')}: Parsed limitation string resulted in empty or non-list: {cleaned_item}"
                            )
                    except json.JSONDecodeError:
                        # If parsing fails, treat as plain string if non-empty
                        if cleaned_item:
                            new_limitations.append({"description": cleaned_item})
                        print(
                            f"Warning: Technique ID {technique.get('id')}: Failed to parse limitation string: {cleaned_item}"
                        )
                elif cleaned_item:  # Handle plain, non-empty strings
                    new_limitations.append({"description": cleaned_item})
            elif (
                isinstance(item, dict)
                and "description" in item
                and item["description"].strip()
            ):
                # Item is already in the correct format
                new_limitations.append({"description": item["description"].strip()})
            elif item is not None:  # Log unexpected formats but don't add them
                print(
                    f"Warning: Technique ID {technique.get('id')}: Unexpected item format in limitations: {item}"
                )

        if needs_update:
            technique["limitations"] = new_limitations
            cleaned_limitations_count += 1

print(f"Cleaned limitations format for {cleaned_limitations_count} techniques.")

# --- Step 5: Renumber Technique IDs ---
renumbered_count = 0
print("\n--- Renumbering IDs ---")
for index, technique in enumerate(techniques_list):
    new_id = index + 1
    if technique.get("id") != new_id:
        technique["id"] = new_id
        renumbered_count += 1

print(f"Renumbered {renumbered_count} techniques with consecutive IDs starting from 1.")

# --- Step 7: Save Refined Data ---
print(f"\n--- Saving Refined Data to {output_file} ---")
try:
    with open(output_file, "w", encoding="utf-8") as f:
        # Use indent for pretty-printing
        json.dump(techniques_list, f, ensure_ascii=False, indent=2)
    print(f"Successfully saved refined data to {output_file}")
except Exception as e:
    print(f"Error saving JSON: {e}")
    sys.exit(1)

print("\nRefinement script finished.")
