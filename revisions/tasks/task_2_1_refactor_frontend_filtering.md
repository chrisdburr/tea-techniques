## Task 2.1: Refactor Frontend Filtering & Navigation

-   **Issue:** `useFilterParams` uses `window.location.href`, causing full page reloads instead of client-side navigation. Hook logic is complex.
-   **Priority:** Medium (High impact on UX)
-   **Branch:** `refactor/frontend-filtering-navigation`
-   **Steps:**
    1.  **Analyze `useFilterParams.ts`:** Identify all instances where `window.location.href` is used (`applyFilters`, `resetFilters`, `changePage`).
    2.  **Replace Navigation:** Replace `window.location.href` calls with Next.js `router.push` or `router.replace` from `next/navigation`. Use `router.push` to update the URL with new filter/page parameters.
    3.  **Debug Router Issues:** Investigate _why_ `window.location.href` was chosen previously. If `router.push` doesn't trigger data refetching reliably with React Query, ensure query keys in `frontend/src/lib/api/hooks.ts` (`useTechniques`) correctly include all relevant filter parameters from the URL `searchParams` so React Query detects changes.
    4.  **Simplify Logic:** Review the state management and parameter mapping logic within `useFilterParams`. Can it be simplified? Consider if URL state management could be handled more directly by components reading `useSearchParams` and triggering API calls, potentially reducing the hook's complexity.
    5.  **Fix `usePagination`:** Remove the `errorPages` workaround logic in `frontend/src/lib/hooks/usePagination.ts`. Ensure pagination relies on the now-fixed navigation in `useFilterParams` (or its replacement) and robust API error handling.
-   **Considerations:** Making `router.push` work reliably with React Query state updates is key. Thorough testing across different filter combinations and pagination is crucial.
-   **Testing:** Add specific integration tests for `TechniquesList.tsx` and `TechniquesSidebar.tsx` focusing on filter application and pagination _without_ page reloads. Manually verify smooth filtering and pagination. Run linters.
-   **Important Instructions:**
    -   Create a new Git feature branch for this task before you make any changes
    -   Apply refactorings incrementally with frequent verification to keep functions from getting too complex, and files from becomign too large.
    -   If any task changes require edits to the project documentation (see `docs`), ensure these changes are carried out as part of this task.
    -   Once you think you have finished all steps, double-check them all to make sure you haven't missed anything.
    -   Next, run code quality tools.
    -   To finalise this task, add a summary of the change to this file. And, then update the status of the todo list in `plan.md`.
    -   Then, commit changes to the relevant feature branch.

## Task Summary

The frontend filtering and navigation refactoring has been completed successfully. Here's a summary of the changes:

1. **Replaced `window.location.href` with Next.js Router**:
   - Updated `useFilterParams.ts` to use `router.push()` instead of direct window navigation
   - Implemented proper router usage in all navigation methods (applyFilters, resetFilters, changePage)
   - Added useCallback for better performance in navigation functions

2. **Improved `usePagination`**:
   - Removed the errorPages workaround which was a temporary solution
   - Implemented proper error handling and page validation
   - Used router.push with pathname for consistent navigation

3. **Enhanced React Query Integration**:
   - Updated the queryKey in useTechniques to capture all filter parameters
   - Included comprehensive parameter monitoring for all filter types
   - Improved staleTime settings to better control refetching behavior

4. **Optimized State Management**:
   - Added useEffect to listen for URL parameter changes in TechniquesList
   - Implemented useCallback for filter initialization to prevent unnecessary recreation
   - Used React.useTransition for smoother UI during navigation operations

5. **Code Cleanup**:
   - Fixed ESLint warnings about unused variables
   - Removed unnecessary comments and disabled ESLint directives
   - Improved code organization and readability

These changes significantly improve the user experience by eliminating full page reloads during filtering and pagination operations. The application now uses client-side navigation properly, making interactions much faster and smoother for users. React Query integration has been improved to ensure proper data fetching based on URL parameters.