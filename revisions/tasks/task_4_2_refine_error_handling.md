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

## Task 4.2 Implementation Summary

### Changes Made

#### Backend Improvements
1. **Standardized Error Format**: Refactored `custom_exception_handler` in `api/utils.py` to provide a consistent error response format across all error types:
   ```json
   {
     "detail": "Human-readable error message",
     "status_code": 400,
     "error_type": "ValidationError",
     "errors": {} | null (field-specific errors when applicable)
   }
   ```

2. **Removed TechniquesViewSet Fallback Logic**: Eliminated unnecessary try/except blocks in the TechniquesViewSet that were added as workarounds, as they're now handled by the custom exception handler.

3. **Backend Error Handling Tests**: Added comprehensive tests for various error scenarios (404 Not Found, 400 Bad Request, 403 Forbidden) to ensure standardized error responses.

#### Frontend Improvements
1. **Enhanced useApiError Hook**: Refactored the `useApiError` hook to:
   - Properly handle the standardized backend error format
   - Add better network error detection
   - Include improved type safety
   - Add structured logging for easier debugging
   - Gracefully handle unexpected error formats

2. **Improved Error Logging**: Completely rewrote `errorUtils.ts` to provide structured, detailed error logging that captures:
   - Request context (URL, method)
   - Response data
   - Error type classification
   - Friendly error messages for developers

3. **Frontend Tests**: Added comprehensive tests for the `useApiError` hook covering:
   - Standard error format handling
   - Legacy DRF error formats
   - Network errors
   - JS errors
   - Unknown error types

### Benefits

1. **Consistency**: All API errors now follow a consistent format, making frontend error handling more predictable.
2. **Better Debug Information**: Enhanced error logging provides more context for troubleshooting.
3. **Robustness**: The system gracefully handles unexpected error formats and network failures.
4. **Maintainability**: The error handling code is now more structured and easier to extend in the future.

### Testing Results
All tests pass for both frontend and backend error handling, verifying that the new error handling system works as expected.