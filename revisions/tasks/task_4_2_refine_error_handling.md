## Task 4.2: Refine Error Handling Logic

-   **Issue:** Error handling is centralized but includes workarounds (`TechniquesViewSet` fallback) and potentially brittle parsing (`useApiError`).
-   **Priority:** Medium
-   **Branch:** `refactor/error-handling`
-   **Steps:**
    1.  **Backend:** Remove the fallback logic in `TechniquesViewSet` (assuming Task 1.1 fixed the root cause). Ensure the `custom_exception_handler` (`backend/api/utils.py`) consistently returns a standardized error format for common DRF errors (Validation, Auth, NotFound).
    2.  **Frontend:** Refine `useApiError` (`frontend/src/lib/hooks/useApiError.ts`). Simplify the error parsing logic if the backend now returns a more consistent format. Ensure it gracefully handles unexpected error structures or network failures. Add specific logging for unparseable errors.
    3.  **Review API Calls:** Ensure all API call sites (primarily within `frontend/src/lib/api/hooks.ts`) use `try...catch` and call `handleError` appropriately.
-   **Considerations:** Depends on standardizing backend error responses first.
-   **Testing:** Add specific tests for error scenarios in both backend (API tests expecting 4xx/5xx) and frontend (mocking API errors in hook tests).
-   **Important Instructions:**
    -   Create a new Git feature branch for this task before you make any changes
    -   Apply refactorings incrementally with frequent verification to keep functions from getting too complex, and files from becomign too large.
    -   If any task changes require edits to the project documentation (see `docs`), ensure these changes are carried out as part of this task.
    -   Once you think you have finished all steps, double-check them all to make sure you haven't missed anything.
    -   Next, run code quality tools.
    -   To finalise this task, add a summary of the change to this file. And, then update the status of the todo list in `plan.md`.
    -   Then, commit changes to the relevant feature branch.