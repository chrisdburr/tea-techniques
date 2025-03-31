## Task 1.2: Fix Core Add/Edit Technique Functionality

-   **Issue:** Add/Edit Technique pages (`frontend/src/app/techniques/[id]/edit/page.tsx`, `frontend/src/app/techniques/add/page.tsx`) are explicitly disabled. Authentication is cited but seems missing.
-   **Priority:** High
-   **Branch:** `feature/enable-technique-crud`
-   **Steps:**
    1.  **Implement Authentication:**
        -   Backend: Configure DRF authentication (e.g., SessionAuthentication for admin, potentially TokenAuthentication for future API users). Secure the necessary views in `backend/api/views/api_views.py` (Create, Update, Delete in `TechniquesViewSet`) using `permission_classes`.
        -   Frontend: Implement login UI (could be basic initially, leveraging Django Admin login via `/admin/` redirect or a dedicated frontend form posting to `/api/auth/`). Manage authentication state (e.g., using React Context or Zustand). Pass authentication credentials (cookies/tokens) with API requests (`frontend/src/lib/api/client.ts`).
    2.  **Re-enable Frontend Forms:** Remove the disabled states and placeholder content in `add/page.tsx` and `edit/page.tsx`.
    3.  **Fix TechniqueForm:** Address the "technical issues" mentioned in `edit/page.tsx`. This likely involves debugging the interactions between `TechniqueForm.tsx`, `useForm`, and the related select/multi-select components, especially the dependent category/subcategory filtering logic identified in the `useForm` hook's effect dependencies. Simplify the effect dependencies in `TechniqueForm.tsx` if possible.
    4.  **Connect Form to API:** Ensure `TechniqueForm.tsx` correctly uses `useCreateTechnique` and `useUpdateTechnique` hooks (`frontend/src/lib/api/hooks.ts`) on submit.
    5.  **UI Polish:** Ensure loading states and error messages are handled gracefully during form submission.
-   **Considerations:** Authentication is a significant feature. Start simple (e.g., admin session auth). The `TechniqueForm` debugging might be complex due to the interaction of custom hooks and dynamic data loading.
-   **Testing:** Add frontend tests for login/logout flows. Add tests for `TechniqueForm.tsx` interactions. Manually test creating and editing techniques thoroughly. Check backend API permissions are enforced. Run linters.
-   **Important Instructions:**
    -   Create a new Git feature branch for this task before you make any changes
    -   Apply refactorings incrementally with frequent verification to keep functions from getting too complex, and files from becomign too large.
    -   If any task changes require edits to the project documentation (see `docs`), ensure these changes are carried out as part of this task.
    -   Once you think you have finished all steps, double-check them all to make sure you haven't missed anything.
    -   Next, run code quality tools.
    -   To finalise this task, add a summary of the change to this file. And, then update the status of the todo list in `plan.md`.
    -   Then, commit changes to the relevant feature branch.