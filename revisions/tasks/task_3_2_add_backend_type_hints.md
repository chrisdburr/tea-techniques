## Task 3.2: Add Backend Type Hinting

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
-   **Important Instructions:**
    -   Create a new Git feature branch for this task before you make any changes
    -   Apply refactorings incrementally with frequent verification to keep functions from getting too complex, and files from becomign too large.
    -   If any task changes require edits to the project documentation (see `docs`), ensure these changes are carried out as part of this task.
    -   Once you think you have finished all steps, double-check them all to make sure you haven't missed anything.
    -   Next, run code quality tools.
    -   To finalise this task, add a summary of the change to this file. And, then update the status of the todo list in `plan.md`.
    -   Then, commit changes to the relevant feature branch.