# Plan: Remove Deprecated `category_tags` Field

This document outlines the steps required to safely remove the deprecated `category_tags` field from the `Technique` model and related parts of the application.

**Background:**

The `category_tags` field (a string like `#category/subcategory`) was used for initial categorization but has been replaced by the more structured `categories` and `subcategories` many-to-many relationships. The `category_tags` field is marked as deprecated in the model but is still present in the database, API, frontend, import script, and tests.

**Objective:**

Remove all usage and references to `category_tags` to clean up the codebase and rely solely on the `categories` and `subcategories` relationships.

**Steps:**

1.  **Modify Frontend:**
    *   Update `frontend/src/app/techniques/[id]/page.tsx`:
        *   Remove the `parseCategoryTags` helper function.
        *   Modify the rendering logic (around line 555) to iterate over `technique.categories` and `technique.subcategories` instead of the result of `parseCategoryTags`. Display category and subcategory names using `<Badge>` components.
    *   Update `frontend/src/lib/types.ts`: Remove `category_tags` from the `Technique` type definition.
    *   Update `frontend/src/mocks/handlers.ts`: Remove `category_tags` from mock technique data.

2.  **Modify Backend Code:**
    *   Update `backend/api/models.py`: Remove the `category_tags` field definition from the `Technique` model.
    *   Update `backend/api/serializers.py`: Remove `category_tags` from the `fields` list in `TechniqueSerializer.Meta`.
    *   Update `backend/api/management/commands/import_techniques.py`:
        *   Remove the `_parse_category_tags` function.
        *   Remove the fallback logic that calls `_parse_category_tags` in `_process_categories`.
        *   Remove `category_tags` from the `defaults` dictionary in `_process_technique`.
        *   Remove the check for `category_tags` in `_compare_relationships`.
    *   Update `backend/api/tests/test_api.py`: Remove or modify the `test_category_tags_compatibility` test case, as the field will no longer exist in the API response.

3.  **Create Database Migration:**
    *   Run `python backend/manage.py makemigrations api` to generate a migration that removes the `category_tags` column from the `technique` table.
    *   Run `python backend/manage.py migrate` to apply the migration.

4.  **Update Documentation:**
    *   Edit `docs/DATA-MANAGEMENT.md`: Remove the line describing `category_tags`.
    *   Edit `docs/MODEL-ARCHITECTURE.md`: Remove the line defining `category_tags` in the model description.

5.  **Remove from Data File:**
    *   Edit `backend/data/techniques.json`: Remove the `"category_tags": "..."` line from every technique object in the array.

**Verification:**

*   Run backend tests (`pytest backend/`) to ensure all tests pass after backend changes and migration.
*   Run frontend tests (if applicable).
*   Manually test the technique detail page in the frontend to verify categories and subcategories display correctly.
*   Manually test the technique import script (`import_techniques`) to ensure it still works correctly without the fallback logic.