## Implementation Plan: TEA Techniques Repository Refactoring

**Goal:** Address the issues identified in the code review report to improve maintainability, robustness, performance, and adherence to best practices for the TEA Techniques application.

---

### Stage 1: Foundational Stabilization & Critical Fixes (High Priority)

_(Rationale: These tasks address core architectural flaws, potential data corruption, and broken functionality that significantly impact the application's stability and usability.)_

**Task 1.1: Stabilize Database Strategy**

-   **Issue:** Inconsistent handling of SQLite vs. PostgreSQL using environment variables and direct settings modification, leading to schema hacks (`add_missing_columns.py`, workarounds in `TechniquesViewSet`).
-   **Priority:** High
-   **Branch:** `fix/stabilize-database`
-   **Steps:**
    1.  **Decision:** Formally decide on the primary database strategy. **Recommendation:** Use PostgreSQL for all environments (including Docker development) and keep SQLite _only_ for optional, isolated local development/testing _if absolutely necessary_, managed via separate settings.
    2.  **Refactor Settings:** Modify `backend/config/settings.py`.
        -   Remove the `USE_SQLITE` environment variable checks for determining the database engine.
        -   Configure the default `DATABASES` setting to use PostgreSQL, reading credentials from `.env`.
        -   _Optional:_ Create separate settings files (e.g., `settings_local_sqlite.py`) if pure SQLite local dev is still desired, selectable via `DJANGO_SETTINGS_MODULE`.
    3.  **Update Docker:** Modify `docker-compose.yml` to include a PostgreSQL service (`db`) and remove the `USE_SQLITE=True` environment variable from the `backend` service. Ensure the `backend` service depends on `db`. Update `.env.docker` accordingly.
    4.  **Remove Hacks:**
        -   Delete the management command `backend/api/management/commands/add_missing_columns.py`.
        -   Remove the fallback logic in `backend/api/views/api_views.py` (`TechniquesViewSet.list` and `TechniquesViewSet.retrieve`) that tries simpler queries on error. Ensure the standard DRF methods work reliably with the chosen database.
        -   Remove SQLite-specific logic from `backend/api/management/commands/reset_database.py` and `tailscale_setup.py`. Adapt them for PostgreSQL (or remove `tailscale_setup` if switching DB strategy makes it obsolete).
    5.  **Migrations:** Ensure all migrations are compatible with PostgreSQL. Generate new migrations if needed (`python manage.py makemigrations`).
    6.  **Update Documentation:** Update `README.md`, `DEVELOPMENT-WORKFLOW.md`, and `DEPLOYMENT.md` to reflect the standardized database setup.
-   **Considerations:** This is a fundamental change. Requires thorough testing of database connectivity, migrations, and all API endpoints in both local and Docker environments. Ensure `.env.example` is updated.
-   **Testing:** Run all backend tests (`poetry run pytest`). Manually test API endpoints via Swagger UI or frontend after database setup. Test Docker Compose build and run.

**Task 1.2: Fix Core Add/Edit Technique Functionality**

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

---

### Stage 2: Frontend Refactoring & UX Improvements (Medium Priority)

_(Rationale: Addresses core UX issues like page reloads on filtering and simplifies complex custom logic for better maintainability.)_

**Task 2.1: Refactor Frontend Filtering & Navigation**

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

**Task 2.2: Evaluate and Refactor Form Management**

-   **Issue:** Custom `useForm` hook (`frontend/src/lib/hooks/useForm.ts`) adds complexity and might be replaceable by standard libraries. Validation seems minimal.
-   **Priority:** Medium
-   **Branch:** `refactor/frontend-form-hook`
-   **Steps:**
    1.  **Evaluate Alternatives:** Research `react-hook-form` or `Formik` as potential replacements for `useForm`. Assess their suitability for the dynamic fields in `TechniqueForm.tsx` (Use Cases, Resources, Limitations).
    2.  **Decision:** Choose whether to refactor `useForm` for clarity/robustness or replace it.
    3.  **(If Replacing):**
        -   Install the chosen library (e.g., `pnpm add react-hook-form`).
        -   Refactor `TechniqueForm.tsx` to use the library's APIs for state, validation, and submission handling. Remove usage of the custom `useForm` hook.
        -   Integrate validation rules (potentially using a schema library like Zod).
    4.  **(If Refactoring `useForm`):**
        -   Improve validation logic within the hook or allow passing more complex validation schemas.
        -   Simplify state update logic where possible.
        -   Add comprehensive unit tests for the `useForm` hook itself.
-   **Considerations:** Replacing the hook is a significant refactor impacting `TechniqueForm.tsx`. Ensure the chosen library handles dynamic array fields well.
-   **Testing:** Add thorough unit tests for `useForm` (if refactoring) or integration tests for `TechniqueForm.tsx` validating state updates, validation, and submission (if replacing). Run linters.

---

### Stage 3: Backend Refactoring & Data Quality (Medium Priority)

_(Rationale: Cleans up backend data structures, removes redundant logic, and improves code quality.)_

**Task 3.1: Refactor Data Import and `category_tags`**

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

**Task 3.2: Add Backend Type Hinting**

-   **Issue:** Backend Python code lacks type hints.
-   **Priority:** Medium
-   **Branch:** `refactor/backend-type-hints`
-   **Steps:**
    1.  **Configure Type Checker:** Add `mypy` to `dev` dependencies in `backend/pyproject.toml`. Configure `mypy.ini` or `pyproject.toml [tool.mypy]` section.
    2.  **Add Hints Incrementally:** Start adding type hints to key files:
        -   `backend/api/models.py`
        -   `backend/api/serializers.py`
        -   `backend/api/views/api_views.py`
        -   `backend/api/utils.py`
        -   Management commands (`commands/`).
    3.  **Run Mypy:** Regularly run `poetry run mypy .` within the `backend` directory to check types and fix errors.
-   **Considerations:** Can be done incrementally. Focus on function signatures and complex areas first. Requires familiarity with Python typing and potentially `django-stubs`.
-   **Testing:** Run `mypy`. Ensure backend tests still pass.

---

### Stage 4: Testing & Robustness Enhancement (Medium Priority)

_(Rationale: Improve confidence in the application by increasing test coverage and refining error handling.)_

**Task 4.1: Enhance Frontend Test Coverage**

-   **Issue:** Frontend test suite lacks coverage for complex custom hooks (`useFilterParams`, `useForm`) and potentially critical component interactions.
-   **Priority:** Medium
-   **Branch:** `test/frontend-coverage`
-   **Steps:**
    1.  **Test `useFilterParams`:** Write unit/integration tests specifically for `useFilterParams.ts`. Mock `next/navigation` hooks (`useSearchParams`, `useRouter`). Test state updates, URL parameter generation, and interaction with `applyFilters`, `resetFilters`, `changePage`.
    2.  **Test `useForm` (if not replaced):** Write unit tests for `useForm.ts`. Test state initialization, `handleChange`, `handleBlur`, `setFieldValue`, validation logic, and `resetForm`.
    3.  **Test `TechniqueForm`:** Write integration tests for `TechniqueForm.tsx`. Simulate user input, dynamic field additions/removals (Use Cases, Resources), validation errors, and successful/failed submissions (mocking API hooks).
    4.  **Test Error Handling:** Add tests for components that display errors (e.g., API errors in `TechniquesList`, form errors in `TechniqueForm`), ensuring they render correctly based on mocked error states.
    5.  **Review Coverage:** Use Jest's coverage reporting (`npm run test -- --coverage`) to identify other critical untested areas.
-   **Considerations:** Testing hooks involving routing can be tricky. Ensure mocks for `next/navigation` are accurate.
-   **Testing:** Run all frontend tests (`pnpm run test`). Aim for increased coverage metrics.

**Task 4.2: Refine Error Handling Logic**

-   **Issue:** Error handling is centralized but includes workarounds (`TechniquesViewSet` fallback) and potentially brittle parsing (`useApiError`).
-   **Priority:** Medium
-   **Branch:** `refactor/error-handling`
-   **Steps:**
    1.  **Backend:** Remove the fallback logic in `TechniquesViewSet` (assuming Task 1.1 fixed the root cause). Ensure the `custom_exception_handler` (`backend/api/utils.py`) consistently returns a standardized error format for common DRF errors (Validation, Auth, NotFound).
    2.  **Frontend:** Refine `useApiError` (`frontend/src/lib/hooks/useApiError.ts`). Simplify the error parsing logic if the backend now returns a more consistent format. Ensure it gracefully handles unexpected error structures or network failures. Add specific logging for unparseable errors.
    3.  **Review API Calls:** Ensure all API call sites (primarily within `frontend/src/lib/api/hooks.ts`) use `try...catch` and call `handleError` appropriately.
-   **Considerations:** Depends on standardizing backend error responses first.
-   **Testing:** Add specific tests for error scenarios in both backend (API tests expecting 4xx/5xx) and frontend (mocking API errors in hook tests).

---

### Stage 5: Documentation & Configuration (Low Priority)

_(Rationale: Improve developer experience and clarity around configuration.)_

**Task 5.1: Enhance Code Documentation**

-   **Issue:** Need for more inline comments in complex areas and consistent docstrings.
-   **Priority:** Low
-   **Branch:** `docs/code-documentation`
-   **Steps:**
    1.  **Backend:** Add docstrings to views, serializers, models, utility functions, and management commands following standard Python conventions (e.g., Google style or reStructuredText). Add inline comments explaining non-obvious logic.
    2.  **Frontend:** Add JSDoc comments to custom hooks (`useFilterParams`, `useForm`, API hooks) explaining their purpose, parameters, and return values. Add inline comments for complex component logic or effects.
-   **Considerations:** Can be done gradually. Focus on areas identified as complex during earlier refactoring.
-   **Testing:** Primarily involves code review. Ensure linters pass.

**Task 5.2: Improve Configuration Management Clarity**

-   **Issue:** Database switching logic is mixed into `settings.py`. Docker build ARGs/ENVs are duplicated.
-   **Priority:** Low
-   **Branch:** `refactor/config-management`
-   **Steps:**
    1.  **(If Task 1.1 not fully done):** Implement separate Django settings files (e.g., `settings/base.py`, `settings/dev_pg.py`, `settings/dev_sqlite.py`, `settings/prod.py`) using a tool like `django-environ` or basic conditional imports based on `DJANGO_SETTINGS_MODULE`.
    2.  **Docker Frontend:** Simplify `frontend/Dockerfile`. Use `ARG` for build-time vars and `ENV` only for runtime vars needed _inside_ the container. Remove redundancy.
    3.  **Document Env Vars:** Ensure `.env.example` lists _all_ required environment variables for both backend and frontend, with clear explanations.
-   **Considerations:** Settings file refactoring requires updating `manage.py`, `wsgi.py`, `asgi.py`, and potentially test configurations.
-   **Testing:** Verify application runs correctly with different settings modules (if applicable). Test Docker builds and runtime behaviour.

---

### Stage 6: Deployment & CI/CD (Low/Medium Priority - Post-Refactoring)

_(Rationale: Improve the reliability and automation of deployments.)_

**Task 6.1: Refine Deployment Scripts**

-   **Issue:** Deployment scripts (`deploy-tailscale.sh`, `update-nginx.sh`) are manual, perform direct host modifications, and contain workarounds.
-   **Priority:** Low/Medium (depending on deployment frequency)
-   **Branch:** `refactor/deployment-scripts`
-   **Steps:**
    1.  **Replace Host Modification:** Abstract Nginx configuration updates. Instead of `cp` and `systemctl restart`, consider:
        -   Using Docker volumes to mount the Nginx config into a running Nginx container. Updates would involve restarting the Nginx container.
        -   Generating Nginx config dynamically based on environment variables within the deployment script or container entrypoint.
        -   Exploring Infrastructure as Code tools (Ansible, Terraform) for managing server configuration.
    2.  **Remove Workarounds:** Ensure the scripts align with the stabilized database strategy (Task 1.1) and remove any SQLite-specific commands if PostgreSQL is standardized.
    3.  **Parameterize:** Avoid hardcoded values; use environment variables passed to the scripts or read from `.env` files.
-   **Considerations:** Depends heavily on the chosen deployment target and tooling. IaC is a significant undertaking.
-   **Testing:** Requires testing the deployment process in a staging environment that mimics production (or Tailscale setup).

---

**Conclusion:**

This plan prioritizes stabilizing the core architecture (database) and fixing critical functionality (CRUD operations, frontend navigation) before moving onto code quality, testing, and documentation improvements. Each stage should result in a more stable and maintainable application. Remember to run tests frequently and commit changes incrementally within each feature branch.
