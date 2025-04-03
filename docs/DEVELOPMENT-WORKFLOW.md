# Development Workflow

> [!NOTE] Overview
> This guide covers the recommended development workflow for the TEA Techniques project, including environment setup, tools, and best practices.

## Development Environment

### Prerequisites

-   Docker and Docker Compose ([Docker Desktop](https://www.docker.com/products/docker-desktop/) is recommended). All other dependencies (Python, Node.js, pnpm, PostgreSQL) are managed within the Docker containers.

### Editor Setup

#### VSCode (Recommended)

Recommended extensions:

-   ESLint
-   Prettier
-   Python
-   Django
-   Tailwind CSS IntelliSense
-   Docker

Workspace settings:

```json
{
	"editor.formatOnSave": true,
	"editor.codeActionsOnSave": {
		"source.fixAll.eslint": true
	},
	"python.linting.enabled": true,
	"python.linting.pylintEnabled": true,
	"python.formatting.provider": "black"
}
```

### Environment Variables

A single `.env` file in the project root is used to configure the Docker Compose environment. Create it by copying the example:

```bash
cp .env.example .env
```

Review the `.env` file. The default values are generally suitable for development. Key variables include:

```
# Backend settings
SECRET_KEY=your-secret-key
DJANGO_SETTINGS_MODULE=config.settings.development

# Database settings (for PostgreSQL)
DB_NAME=techniques
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432 # Port exposed by the PostgreSQL container

# Frontend settings (These are primarily used as build args in docker-compose.development.yml)
# NEXT_PUBLIC_API_URL=/api # Default if not overridden by compose file
# NEXT_PUBLIC_SWAGGER_URL=/swagger/ # Default if not overridden by compose file
# BACKEND_URL=http://localhost:8000 # Used if running frontend locally, not relevant for Docker setup
```

> [!IMPORTANT]
> The `docker-compose.development.yml` file overrides `NEXT_PUBLIC_API_URL` using a build argument to ensure the frontend container can reach the backend container via the Docker network (`http://backend:8000/api`).

## Project Structure

Key directories to be aware of:

```
tea-techniques/
├── backend/              # Django backend
│   ├── api/              # Main Django app
│   ├── config/           # Django settings
│   ├── data/             # Data files
│   └── manage.py         # Django management script
├── frontend/             # Next.js frontend
│   ├── src/
│   │   ├── app/          # Next.js pages
│   │   ├── components/   # React components
│   │   └── lib/          # Utilities
├── docs/                 # Documentation
└── docker-compose.development.yml # Docker Compose file for development
```

## Docker Development Setup

This is the standard way to set up the development environment using Docker Compose.

1.  **Environment Variables:** Ensure you have created the root `.env` file:
    ```bash
    cp .env.example .env
    ```
    -   Review the `.env` file. The default values are generally suitable for development.
2.  **Build and Start Services:** Use the development-specific compose file:
    ```bash
    docker-compose -f docker-compose.development.yml up -d --build
    ```
    -   This command builds the necessary Docker images (or uses cached ones) and starts the `db`, `backend`, and `frontend` services in detached mode.
3.  **Initialize the Database:** This step is crucial after the first time you start the containers:
    ```bash
    # Run migrations and import initial data inside the running backend container
    docker-compose -f docker-compose.development.yml exec backend python manage.py reset_and_import_techniques
    ```
    -   This command sets up the database schema (applies migrations) and populates the database with the initial set of techniques within the `backend` container. Run this again if you need to reset your development database.
4.  **Access the Application:**
    -   Frontend: http://localhost:3000
    -   Backend API: http://localhost:8000/api/
    -   Django Admin: http://localhost:8000/admin/ (Login: `admin`/`admin`)
5.  **Stopping the Services:**
    ```bash
    # Stop and remove containers, networks, etc.
    docker-compose -f docker-compose.development.yml down
    ```
6.  **Viewing Logs:**

    ```bash
    # View logs for all services
    docker-compose -f docker-compose.development.yml logs

    # View logs for a specific service (e.g., backend) and follow in real-time
    docker-compose -f docker-compose.development.yml logs -f backend
    ```

## Development Workflow

### 1. Feature Branch Workflow

Always create a feature branch for your work:

```bash
git checkout -b feature/your-feature-name
```

### 2. TDD Approach (Test-Driven Development)

For new features:

1. Write tests first
2. Implement the feature
3. Verify tests pass
4. Refactor as needed

### 3. Running Tests

Tests should be run inside the respective containers to ensure the correct environment.

#### Backend Tests

```bash
# Run all backend tests
docker-compose -f docker-compose.development.yml exec backend pytest

# Run specific backend tests
docker-compose -f docker-compose.development.yml exec backend pytest api/tests/test_file.py::TestClass::test_method

# Run backend tests with coverage
docker-compose -f docker-compose.development.yml exec backend pytest --cov=api
```

#### Frontend Tests

```bash
# Run all frontend tests
docker-compose -f docker-compose.development.yml exec frontend pnpm test

# Run frontend tests in watch mode
docker-compose -f docker-compose.development.yml exec frontend pnpm test:watch
```

### 4. Code Style and Linting

Run linters and formatters inside the containers.

#### Backend

```bash
# Format with Black
docker-compose -f docker-compose.development.yml exec backend black .

# Sort imports with isort
docker-compose -f docker-compose.development.yml exec backend isort .

# Lint with Pylint (adjust path as needed)
docker-compose -f docker-compose.development.yml exec backend pylint api
```

#### Frontend

```bash
# Run ESLint
docker-compose -f docker-compose.development.yml exec frontend pnpm lint
```

### 5. API Development

For backend API development:

1. Define models in `backend/api/models.py`
2. Create serializers in `backend/api/serializers.py`
3. Set up views in `backend/api/views/api_views.py`
4. Configure routes in `backend/api/urls.py`
5. Write tests in `backend/api/tests/`

### 6. Frontend Development

For frontend development:

1. Create or modify components in `frontend/src/components/`
2. Update pages in `frontend/src/app/`
3. Add API hooks in `frontend/src/lib/api/hooks.ts`
4. Add types in `frontend/src/lib/types.ts`
5. Write tests in `frontend/tests/`

### 7. Data Management

Technique data is managed via the JSON file in `backend/data/techniques.json`.

1.  **Edit** the `backend/data/techniques.json` file.
2.  **Re-import** the data into the running development database:

    ```bash
    # Reset the DB and import the updated JSON
    docker-compose -f docker-compose.development.yml exec backend python manage.py reset_and_import_techniques

    # OR, if you only want to add/update without resetting:
    # docker-compose -f docker-compose.development.yml exec backend python manage.py import_techniques
    ```

## Common Development Tasks

### Adding a New Model (Backend)

1.  Define the model in `backend/api/models.py`.
2.  Create migrations inside the container:
    ```bash
    docker-compose -f docker-compose.development.yml exec backend python manage.py makemigrations
    ```
3.  Apply migrations inside the container:
    ```bash
    docker-compose -f docker-compose.development.yml exec backend python manage.py migrate
    ```
4.  Create a serializer in `backend/api/serializers.py`.
5.  Add a ViewSet in `backend/api/views/api_views.py`.
6.  Register routes in `backend/api/urls.py`.

### Adding a New API Endpoint (Backend)

1.  Create a view function or ViewSet in `backend/api/views/api_views.py`.
2.  Register the URL in `backend/api/urls.py`.
3.  Update Swagger documentation if needed (often automatic with DRF Spectacular or similar).

### Adding a New Frontend Page

1. Create a new directory in `frontend/src/app/`
2. Add a `page.tsx` file with your page component
3. Update navigation if needed

### Adding a New Component

1. Create a new file in the appropriate subdirectory of `frontend/src/components/`
2. Implement the component using TypeScript and React
3. Add tests in `frontend/tests/`

## Debugging Tips

### Backend Debugging

1.  **Use `docker-compose logs`:** Check the output of `docker-compose -f docker-compose.development.yml logs -f backend`.
2.  **Set breakpoints:** Add `import pdb; pdb.set_trace()` in your Django code. Then attach to the running container:
    ```bash
    docker attach <backend_container_id_or_name>
    ```
    Interact with pdb when the breakpoint is hit. Detach with `Ctrl+P`, `Ctrl+Q`.
3.  **Django Debug Toolbar:** Access it through the frontend when making API requests (ensure it's enabled in development settings).

### Frontend Debugging

1.  **Browser DevTools:** Use your browser's developer tools (Network tab for API calls, Console tab for logs and errors).
2.  **React Developer Tools:** Install the browser extension for inspecting components and state.
3.  **React Query Devtools:** Use these to inspect query caching and state.
4.  **Container Logs:** Check frontend container logs: `docker-compose -f docker-compose.development.yml logs -f frontend`.

## Performance Considerations

### Backend Performance

1. Use `select_related()` and `prefetch_related()` to optimize queries
2. Add database indexes for frequently queried fields
3. Use Django's caching framework for expensive operations

### Frontend Performance

1. Use React.memo() for expensive components
2. Leverage React Query's caching system
3. Use pagination for large datasets
4. Optimize images and assets

## Deployment

See the [Deployment Guide](DEPLOYMENT.md) for detailed deployment instructions.

## Troubleshooting

### Common Issues

#### Backend

-   **Migration errors**: Run `makemigrations` and `migrate` inside the container as shown above. Check container logs for details.
-   **Database connection errors**: Ensure the `db` container is running (`docker-compose ps`). Check `.env` variables match the `db` service in `docker-compose.development.yml`. Verify the backend waits for the DB (using `depends_on`).
-   **Import errors**: Rebuild the backend image if dependencies changed: `docker-compose -f docker-compose.development.yml build backend`.

#### Frontend

-   **Build errors**: Check container logs (`docker-compose logs frontend`). Ensure dependencies are installed correctly during the build.
-   **API connection issues**: Verify `NEXT_PUBLIC_API_URL` in `docker-compose.development.yml` (`build.args`) is `http://backend:8000/api`. Ensure the `backend` container is running and healthy (`docker-compose ps`). Check backend logs for errors.

## Related Links

-   [Contributing Guide](CONTRIBUTING.md)
-   [Testing Guide](TESTING.md)
-   [Model Architecture](MODEL-ARCHITECTURE.md)
-   [Frontend Guide](FRONTEND-GUIDE.md)
