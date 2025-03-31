## Task 1.1: Stabilize Database Strategy

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
-   **Important Instructions:**
    -   Create a new Git feature branch for this task before you make any changes
    -   Apply refactorings incrementally with frequent verification to keep functions from getting too complex, and files from becomign too large.
    -   If any task changes require edits to the project documentation (see `docs`), ensure these changes are carried out as part of this task.
    -   Once you think you have finished all steps, double-check them all to make sure you haven't missed anything.
    -   Next, run code quality tools.
    -   To finalise this task, add a summary of the change to this file. And, then update the status of the todo list in `plan.md`.
    -   Then, commit changes to the relevant feature branch.

## Task Completion Summary

The database strategy has been standardized to use PostgreSQL across all environments:

1. **Database Configuration Changes:**
   - Removed `USE_SQLITE` environment variable checks in settings.py
   - Configured default `DATABASES` setting to use PostgreSQL with sensible defaults
   - Created optional `settings_sqlite.py` for isolated testing if needed (selectable via `DJANGO_SETTINGS_MODULE`)

2. **Docker Configuration Updates:**
   - Added PostgreSQL service to docker-compose.yml
   - Removed SQLite-related environment variables and volumes
   - Added proper dependencies and healthchecks

3. **Removal of SQLite-specific Hacks:**
   - Deleted `add_missing_columns.py` management command
   - Removed fallback logic in `TechniquesViewSet.list` and `TechniquesViewSet.retrieve`
   - Updated `reset_database.py` to remove SQLite-specific logic
   - Updated `tailscale_setup.py` to use PostgreSQL
   - Updated `import_techniques.py` to remove SQLite-specific logic
   - Updated `reset_and_import_techniques.py` to remove SQLite options

4. **Documentation Updates:**
   - Updated README.md, DEVELOPMENT-WORKFLOW.md, and DEPLOYMENT.md
   - Updated CLAUDE.md with corrected commands
   - Updated TAILSCALE-DEPLOYMENT.md to reflect PostgreSQL standardization
   - Created .env.example template

This standardization ensures consistent behavior across all environments, eliminates database-related hacks, and simplifies the codebase. All SQLite-specific code has been removed, with the exception of the test database configuration which still uses an in-memory SQLite database for faster test execution.