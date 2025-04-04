# TEA Techniques - Prioritized Tasks

IMPORTANT: For each task listed below, make sure to create a **new Git feature branch before starting work**.

If the task involves significant changes to the codebase, run linting and testing to ensure everything is working as expected. Otherwise, run the tests once the final task is complete.

Once finished, add a summary of the changes made in a commit message. Also update this file with the task status and any relevant notes once a task is started/completed.

## Critical Priority Tasks

### 1. ✅ Fix API Security Vulnerabilities

**Task:** Override insecure default API permissions in production settings

-   **Description:** The API is currently public by default with `AllowAny` permission
-   **Status:** Completed
-   **Changes:**
    1. Modified `backend/config/settings/production.py` to override the default permission classes with `IsAuthenticatedOrReadOnly`
    2. Added custom permission handlers to all ViewSets to require authentication for create/update/delete operations
    3. Secured debug endpoint to only be available in development environment
-   **Branch:** `fix-api-security`

### 2. ✅ Fix Database Migration Tracking

**Task:** Fix critical database migration tracking issue

-   **Description:** Initial migration is incorrectly ignored in Git, breaking database functionality
-   **Status:** Completed
-   **Changes:**
    1. Edited `.gitignore` to remove the line `backend/api/migrations/0001_initial.py`
    2. Verified the initial migration file exists in the repository
    3. Added comprehensive migration handling documentation to `docs/DEVELOPMENT-WORKFLOW.md`
-   **Branch:** `fix-db-migrations`

### 3. ✅ Fix N+1 Query Performance Issues in API

**Task:** Resolve critical N+1 query bottleneck in Techniques API

-   **Description:** The primary technique listing endpoint suffers from excessive database queries
-   **Status:** Completed
-   **Changes:**
    1. Added `get_queryset()` method to `TechniquesViewSet` in `backend/api/views/api_views.py` with optimized prefetch_related:
        ```python
        def get_queryset(self):
            """Get queryset with optimized prefetching for related entities."""
            return Technique.objects.all().prefetch_related(
                'assurance_goals',
                'categories',
                'subcategories',
                'tags',
                'attribute_values',
                'resources',
                'example_use_cases',
                'limitations'
            )
        ```
    2. Added database query tests in `test_api.py` to verify performance optimization
-   **Branch:** `fix-query-performance`

### 4. ✅ Secure Debug Endpoint

**Task:** Restrict access to the debug endpoint

-   **Description:** The debug endpoint exposes internal configuration information
-   **Status:** Completed
-   **Changes:**
    1. Modified `debug_endpoint` view in `backend/api/views/api_views.py` to completely restrict access in production environments
    2. Simplified the security model to only check `settings.DEBUG` rather than using admin permissions
    3. Updated tests to verify that the endpoint returns 403 Forbidden in all production scenarios
-   **Branch:** `main`

## High Priority Tasks

### 5. ✅ Add Missing Production Logging Configuration

**Task:** Implement robust logging for production environment

-   **Status:** Completed
-   **Changes:**
    1. Added `LOGGING` configuration to `backend/config/settings/production.py` with console and file handlers
    2. Created logs directory with .gitkeep file to ensure it's tracked by Git
    3. Set up appropriate log formatters and handlers for Django and API modules
-   **Branch:** `add-production-logging`

### 6. ✅ Implement Authentication Tests

**Task:** Add comprehensive authentication tests for API

-   **Status:** Completed
-   **Changes:**
    1. Added a new test class `AuthenticationTestCase` in `backend/api/tests/test_api.py` with tests for:
        - Anonymous user access (list/retrieve endpoints)
        - Unauthenticated write operations (create/update/delete) - verified they fail with 401/403
        - Authenticated write operations - verified they succeed
        - Real-world authentication flow with login/logout
        - Authentication status endpoint
    2. Fixed URL patterns to match the API router configuration with `trailing_slash=False`
-   **Branch:** `main`

### 7. Fix Field Type for TechniqueResource.publication_date

**Task:** Change `publication_date` field type from CharField to DateField

-   **Steps:**
    1. Update the model in `backend/api/models.py`:
        ```python
        publication_date = models.DateField(blank=True, null=True)
        ```
    2. Create a data migration to handle the conversion
    3. Update the import script to parse date strings properly

### 8. Refactor Complex Import Script Logic

**Task:** Simplify data import logic

-   **Steps:**
    1. Standardize the JSON data format for consistency
    2. Refactor `_process_technique` method to:
        - Compare existing relationships before clearing
        - Simplify category/subcategory handling
        - Implement logic for the unused `--force` argument
        - Use the logger instead of stdout for internal logging

## Medium Priority Tasks

### 9. Fix Environment Variable Handling for Production Security

**Task:** Improve handling of critical environment variables

-   **Steps:**
    1. Add validation for required environment variables in `production.py`:
        ```python
        # Check for required environment variables in production
        if not DEBUG:
            required_env_vars = ['SECRET_KEY', 'ALLOWED_HOSTS']
            missing_vars = [var for var in required_env_vars if not os.getenv(var)]
            if missing_vars:
                raise Exception(f"Missing required environment variables: {', '.join(missing_vars)}")
        ```
    2. Update deployment documentation to emphasize these requirements

### 10. Add Validators for Rating Fields

**Task:** Implement validators for rating fields to enforce ranges

-   **Steps:**

    1. Update the model fields in `backend/api/models.py`:

        ```python
        from django.core.validators import MinValueValidator, MaxValueValidator

        complexity_rating = models.PositiveSmallIntegerField(
            null=True,
            blank=True,
            validators=[MinValueValidator(1), MaxValueValidator(5)]
        )
        computational_cost_rating = models.PositiveSmallIntegerField(
            null=True,
            blank=True,
            validators=[MinValueValidator(1), MaxValueValidator(5)]
        )
        ```

### 11. Re-enable MSW API Mocking in Frontend Tests

**Task:** Fix and re-enable Mock Service Worker for frontend tests

-   **Steps:**
    1. Update `frontend/jest.setup.ts` to properly use MSW for API mocking
    2. Set up the handlers in `frontend/src/mocks/handlers.ts`
    3. Remove manual API mocking from individual tests

### 12. Consolidate API Base URL Configuration

**Task:** Simplify and standardize API URL configuration across frontend

-   **Steps:**
    1. Consolidate logic in `frontend/src/lib/config.ts`
    2. Use consistent environment variables:
        - NEXT_PUBLIC_API_URL for browser access
        - INTERNAL_API_URL for server-side container access
    3. Remove complex conditional logic based on `window` or `DOCKER_ENV`

## Lower Priority Tasks

### 13. Fix Frontend Development Experience in Docker

**Task:** Improve the development workflow for frontend

-   **Steps:**
    1. Update `docker-compose.development.yml` and `frontend/Dockerfile` to use development mode
    2. Use `pnpm run dev` for hot reloading instead of production build

### 14. Configure Global React Query Defaults

**Task:** Set up global defaults for React Query options

-   **Steps:**
    1. Update `QueryProvider` to configure global defaults for common options:
        ```typescript
        // Configure global defaults in the QueryClient
        const queryClient = new QueryClient({
        	defaultOptions: {
        		queries: {
        			refetchOnWindowFocus: false,
        			retry: 1,
        			staleTime: 5 * 60 * 1000, // 5 minutes
        		},
        	},
        });
        ```
    2. Remove redundant configurations from individual hooks

### 15. Fix Trailing Slash Handling in API Hooks

**Task:** Simplify API URL handling to avoid dual attempts

-   **Steps:**
    1. Ensure the backend consistently enforces or removes trailing slashes
    2. Update frontend API client to use consistent URL format
    3. Remove the complex try/catch fallback logic in hooks.ts

### 16. Clean Up Code Issues

**Task:** Resolve minor code quality issues

-   **Steps:**
    1. Remove unused imports in `backend/api/views/api_views.py`
    2. Remove debug console logs in `frontend/src/lib/config.ts`
    3. Remove or implement the dead code in `useTechniqueRelationships` hook
    4. Simplify overly defensive code in `TechniqueSerializer.get_applicable_models`
    5. Consider removing explicit `db_table` definitions unless needed
    6. Plan to remove the deprecated `category_tags` field

### 17. Update Frontend Global Layout

**Task:** Improve global layout structure

-   **Steps:**
    1. Add common structural elements to `frontend/src/app/layout.tsx`:
        - Header component
        - Main content area
        - Footer component

### 18. Update GitIgnore with Standard Ignores

**Task:** Add missing standard ignores to .gitignore

-   **Steps:**
    1. Add the following to `.gitignore`:
        ```
        frontend/.next/
        backend/.coverage
        ```
    2. Consider generating a more comprehensive .gitignore from templates

### 19. Update Documentation to Match Implementation

**Task:** Ensure documentation is synchronized with current code

-   **Steps:**
    1. Review and update the documents in the `docs/` directory
    2. Ensure API documentation reflects the current implementation
    3. Document process for updating documentation with code changes

### 20. Update Tests to Match Current Database Configuration

**Task:** Fix API tests to work with PostgreSQL Docker setup

-   **Description:** The existing tests are failing because they expect a different URL structure and database configuration than what is currently used. The project has moved from SQLite to PostgreSQL with Docker.
-   **Steps:**
    1. Update test settings to better align with current database approach
    2. Fix URL handling in tests to match current URL configuration (no trailing slashes)
    3. Add Docker-aware test configuration that can run against PostgreSQL
    4. Ensure API test URLs are consistent with `APPEND_SLASH = False` and `TRAILING_SLASH = False` settings
    5. Consider adding environment-specific test runners for different deployment scenarios
