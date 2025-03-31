## Task 5.2: Improve Configuration Management Clarity

-   **Issue:** Database switching logic is mixed into `settings.py`. Docker build ARGs/ENVs are duplicated.
-   **Priority:** Low
-   **Branch:** `refactor/config-management`
-   **Steps:**
    1.  **(If Task 1.1 not fully done):** Implement separate Django settings files (e.g., `settings/base.py`, `settings/dev_pg.py`, `settings/dev_sqlite.py`, `settings/prod.py`) using a tool like `django-environ` or basic conditional imports based on `DJANGO_SETTINGS_MODULE`.
    2.  **Docker Frontend:** Simplify `frontend/Dockerfile`. Use `ARG` for build-time vars and `ENV` only for runtime vars needed _inside_ the container. Remove redundancy.
    3.  **Document Env Vars:** Ensure `.env.example` lists _all_ required environment variables for both backend and frontend, with clear explanations.
-   **Considerations:** Settings file refactoring requires updating `manage.py`, `wsgi.py`, `asgi.py`, and potentially test configurations.
-   **Testing:** Verify application runs correctly with different settings modules (if applicable). Test Docker builds and runtime behaviour.
-   **Important Instructions:**
    -   Create a new Git feature branch for this task before you make any changes
    -   Apply refactorings incrementally with frequent verification to keep functions from getting too complex, and files from becomign too large.
    -   If any task changes require edits to the project documentation (see `docs`), ensure these changes are carried out as part of this task.
    -   Once you think you have finished all steps, double-check them all to make sure you haven't missed anything.
    -   Next, run code quality tools.
    -   To finalise this task, add a summary of the change to this file. And, then update the status of the todo list in `plan.md`.
    -   Then, commit changes to the relevant feature branch.