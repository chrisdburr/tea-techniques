## Task 6.1: Refine Deployment Scripts

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
-   **Important Instructions:**
    -   Create a new Git feature branch for this task before you make any changes
    -   Apply refactorings incrementally with frequent verification to keep functions from getting too complex, and files from becomign too large.
    -   If any task changes require edits to the project documentation (see `docs`), ensure these changes are carried out as part of this task.
    -   Once you think you have finished all steps, double-check them all to make sure you haven't missed anything.
    -   Next, run code quality tools.
    -   To finalise this task, add a summary of the change to this file. And, then update the status of the todo list in `plan.md`.
    -   Then, commit changes to the relevant feature branch.