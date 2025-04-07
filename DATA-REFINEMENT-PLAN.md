# Plan: Refining techniques.json Dataset

**Goal:** To apply the structural recommendations (removals, format cleanup, renumbering) identified in `REPORT.md` to the `backend/data/techniques.json` file, preparing it for future content enhancements.

**Prerequisites:**

*   Access to the project repository.
*   Basic familiarity with JSON format.
*   Python environment (recommended for scripting modifications).
*   Reference Files:
    *   `backend/data/techniques.json` (The file to be modified)
    *   `REPORT.md` (Contains the evaluation and recommendations)
    *   `backend/data/techniques_schema.json` (For context, though cleanup might make data temporarily deviate slightly from schema regarding `limitations` format if schema isn't updated yet).

**Recommended Tooling:**

*   A text editor or IDE.
*   Python (with the `json` library) for scripted modifications to minimize manual errors.

**Steps:**

1.  **Preparation & Backup:**
    *   **Action:** Create a backup copy of the original `backend/data/techniques.json` file.
    *   **Example:** Name the backup `backend/data/techniques.json.bak_YYYYMMDD`.
    *   **Rationale:** Ensures the original data is safe in case of errors during modification.

2.  **Load Data:**
    *   **Action:** Load the `techniques.json` data into a suitable structure for manipulation.
    *   **Systematic Approach (Python):**
        ```python
        import json

        input_file = 'backend/data/techniques.json'
        try:
            with open(input_file, 'r', encoding='utf-8') as f:
                techniques_list = json.load(f)
            print(f"Successfully loaded {len(techniques_list)} techniques from {input_file}")
        except Exception as e:
            print(f"Error loading JSON: {e}")
            # Stop execution if loading fails
            exit(1)
        ```

3.  **Remove Redundant/Categorical Techniques:**
    *   **Action:** Remove the technique objects identified for removal in `REPORT.md`.
    *   **IDs to Remove:** 4, 9, 38, 41, 43, 58, 74, 80, 81, 82, 84, 114, 119, 124. (Note: Added IDs 58 and 81 based on the final review).
    *   **Systematic Approach (Python):**
        ```python
        import json # Ensure json is imported

        ids_to_remove = {4, 9, 38, 41, 43, 58, 74, 80, 81, 82, 84, 114, 119, 124}
        expected_names = { # Optional: For safety check
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
            124: "SHAP Values for Fairness"
        }

        refined_techniques = []
        removed_count = 0
        # Assuming techniques_list is loaded from Step 2
        for technique in techniques_list:
            tech_id = technique.get('id')
            tech_name = technique.get('name')
            if tech_id in ids_to_remove:
                # Safety check (optional but recommended)
                if tech_id in expected_names and tech_name != expected_names[tech_id]:
                    print(f"Warning: ID {tech_id} has unexpected name '{tech_name}'. Expected '{expected_names[tech_id]}'. Still removing.")
                elif tech_id not in expected_names:
                     print(f"Warning: ID {tech_id} ('{tech_name}') was marked for removal but not in expected name list.")
                removed_count += 1
                print(f"Removing technique ID {tech_id}: {tech_name}")
            else:
                refined_techniques.append(technique)

        print(f"Removed {removed_count} techniques. {len(refined_techniques)} remaining.")
        techniques_list = refined_techniques # Update the list for the next step
        ```

4.  **Clean Up `limitations` Field Format:**
    *   **Action:** Iterate through the remaining techniques and standardize the `limitations` field to be an array of objects, each containing a `description` key. Parse escaped JSON strings where necessary.
    *   **Systematic Approach (Python):**
        ```python
        import json # Ensure json is imported

        cleaned_limitations_count = 0
        # Assuming techniques_list is the list after removals from Step 3
        for technique in techniques_list:
            if 'limitations' in technique and isinstance(technique['limitations'], list):
                new_limitations = []
                needs_update = False
                for item in technique['limitations']:
                    if isinstance(item, str):
                        needs_update = True # Mark that we are changing the format
                        cleaned_item = item.strip()
                        if cleaned_item.startswith('[') and cleaned_item.endswith(']'):
                            try:
                                # Attempt to parse escaped JSON string like "[{\"description\": \"...\"}]"
                                parsed_list = json.loads(cleaned_item)
                                if isinstance(parsed_list, list) and len(parsed_list) > 0:
                                    # Extract descriptions from the list items
                                    for sub_item in parsed_list:
                                        if isinstance(sub_item, dict) and 'description' in sub_item and sub_item['description'].strip():
                                            new_limitations.append({"description": sub_item['description'].strip()})
                                        elif isinstance(sub_item, str) and sub_item.strip(): # Handle lists of strings within the escaped JSON
                                             new_limitations.append({"description": sub_item.strip()})
                                        else:
                                            print(f"Warning: Technique ID {technique.get('id')}: Found non-standard item in parsed limitation list: {sub_item}")
                                else:
                                     print(f"Warning: Technique ID {technique.get('id')}: Parsed limitation string resulted in empty or non-list: {cleaned_item}")
                            except json.JSONDecodeError:
                                # If parsing fails, treat as plain string if non-empty
                                if cleaned_item:
                                    new_limitations.append({"description": cleaned_item})
                                print(f"Warning: Technique ID {technique.get('id')}: Failed to parse limitation string: {cleaned_item}")
                        elif cleaned_item: # Handle plain, non-empty strings
                            new_limitations.append({"description": cleaned_item})
                    elif isinstance(item, dict) and 'description' in item and item['description'].strip():
                        # Item is already in the correct format
                        new_limitations.append({"description": item['description'].strip()})
                    elif item is not None: # Log unexpected formats but don't add them
                         print(f"Warning: Technique ID {technique.get('id')}: Unexpected item format in limitations: {item}")

                if needs_update:
                    technique['limitations'] = new_limitations
                    cleaned_limitations_count += 1

        print(f"Cleaned limitations format for {cleaned_limitations_count} techniques.")
        ```

5.  **Renumber Technique IDs:**
    *   **Action:** Iterate through the filtered `techniques_list` and assign new, consecutive IDs starting from 1.
    *   **Systematic Approach (Python):**
        ```python
        renumbered_count = 0
        # Assuming techniques_list is the list after removals and cleanup
        for index, technique in enumerate(techniques_list):
            new_id = index + 1
            if technique.get('id') != new_id:
                technique['id'] = new_id
                renumbered_count += 1

        print(f"Renumbered {renumbered_count} techniques with consecutive IDs starting from 1.")
        ```
    *   **Rationale:** Ensures IDs are sequential after deletions, simplifying potential future lookups or database primary key management.

6.  **Verification:**
    *   **Action:** Manually review the `techniques_list` (or the output file from Step 7).
    *   **Checks:**
        *   Confirm the total number of techniques matches the expected count after removals.
        *   Spot-check several techniques to ensure the `limitations` field now contains `[{"description": "..."}, ...]`.
        *   Verify that techniques marked for removal are indeed gone.
        *   Confirm that technique IDs are now consecutive integers starting from 1.
        *   (Optional) Use a JSON validator against `techniques_schema.json` (expect potential minor discrepancies in `limitations` if schema wasn't updated).

7.  **Save Refined Data:**
    *   **Action:** Write the processed `techniques_list` to a *new* JSON file (e.g., `techniques_refined.json`) initially. After verification, overwrite the original `backend/data/techniques.json`.
    *   **Systematic Approach (Python):**
        ```python
        output_file = 'backend/data/techniques_refined.json' # Or techniques.json to overwrite
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                # Use indent for pretty-printing
                json.dump(techniques_list, f, ensure_ascii=False, indent=2)
            print(f"Successfully saved refined data to {output_file}")
        except Exception as e:
            print(f"Error saving JSON: {e}")
        ```

---