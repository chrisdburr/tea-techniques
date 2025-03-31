## Task 3.1: Refactor Data Import and `category_tags`

-   **Issue:** The `category_tags` field on the `Technique` model seems redundant given M2M relationships. Parsing this string (`#category/subcategory`) is brittle. JSON strings are stored within JSON fields (`limitations`).
-   **Priority:** Medium
-   **Branch:** `refactor/data-import-structure`
-   **Steps:**
    1.  **Analyze `category_tags` Usage:** Confirm if `category_tags` provides any information _not_ captured by the `categories` and `subcategories` M2M fields. If not, plan for removal.
    2.  **Refactor `import_techniques.py`:**
        -   Modify `_process_technique` to directly use `assurance_goals`, `categories`, and `subcategories` data if available in the JSON source _instead_ of parsing `category_tags`.
        -   Modify `_parse_category_tags` and its usage to be a fallback _only_ if primary relationship data isn't in the source JSON.
        -   Update the logic handling `limitations` to expect an array of strings/objects directly in the JSON, not a JSON string. Update `TechniqueLimitation` creation accordingly.
    3.  **Update Source Data:** Modify `backend/data/techniques.json`:
        -   Ensure `assurance_goals`, `categories`, `subcategories` are populated correctly (e.g., using names or IDs).
        -   Convert the `limitations` field from a stringified JSON array to a direct JSON array of strings or objects (e.g., `[{"description": "Limitation 1"}, {"description": "Limitation 2"}]`).
    4.  **Update Frontend Parsing:** Modify `TechniqueLimitations` component in `frontend/src/app/techniques/[id]/page.tsx` to directly use the `description` field from the (now correctly structured) limitation objects, removing the `JSON.parse` logic.
    5.  **Model/Serializer Cleanup (Optional, after confirming redundancy):**
        -   Remove the `category_tags` field from `backend/api/models.py` (`Technique` model).
        -   Remove `category_tags` from `backend/api/serializers.py` (`TechniqueSerializer`).
        -   Generate and apply migrations (`makemigrations`, `migrate`).
-   **Considerations:** Changing the source JSON structure requires careful validation. Removing the model field is a breaking change if anything still relies on it.
-   **Testing:** Run backend tests. Manually test data import (`reset_and_import_techniques`). Verify technique detail pages display limitations correctly. Run linters.
-   **Important Instructions:**
    -   Create a new Git feature branch for this task before you make any changes
    -   Apply refactorings incrementally with frequent verification to keep functions from getting too complex, and files from becomign too large.
    -   If any task changes require edits to the project documentation (see `docs`), ensure these changes are carried out as part of this task.
    -   Once you think you have finished all steps, double-check them all to make sure you haven't missed anything.
    -   Next, run code quality tools.
    -   To finalise this task, add a summary of the change to this file. And, then update the status of the todo list in `plan.md`.
    -   Then, commit changes to the relevant feature branch.