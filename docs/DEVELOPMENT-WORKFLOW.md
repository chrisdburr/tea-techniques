# Development Workflow

> [!NOTE] Overview
> This guide covers the recommended development workflow for the TEA Techniques project, including environment setup, tools, and best practices.

## Development Environment

### Prerequisites

- Python 3.12+
- Node.js 20+
- pnpm (or npm)
- SQLite
- Docker (optional, for containerised development)

### Editor Setup

#### VSCode (Recommended)

Recommended extensions:

- ESLint
- Prettier
- Python
- Django
- Tailwind CSS IntelliSense
- Docker

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

Create a `.env` file in the project root (copy from `.env.example`):

```
# Database
DB_NAME=techniques
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432

# API URL for frontend
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

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
└── docker-compose.yml    # Docker configuration
```

## Local Development Setup

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies using Poetry:

   ```bash
   poetry install
   ```

3. Initialize the database:

   ```bash
   USE_SQLITE=True python manage.py reset_and_import_techniques
   ```

4. Run the development server:

   ```bash
   USE_SQLITE=True poetry run python manage.py runserver
   ```

5. The API will be available at http://localhost:8000/api/

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   pnpm install
   # or
   npm install
   ```

3. Run the development server:

   ```bash
   pnpm run dev:turbo
   # or
   npm run dev --turbopack
   ```

4. The frontend will be available at http://localhost:3000

### Docker Setup (Alternative)

For a production-like environment:

```bash
docker compose up -d
```

This will start the backend, frontend, and PostgreSQL database containers.

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

#### Backend Tests

```bash
cd backend
poetry run pytest
```

For specific tests:

```bash
poetry run pytest api/tests/test_file.py::TestClass::test_method
```

With coverage report:

```bash
poetry run pytest --cov=api
```

#### Frontend Tests

```bash
cd frontend
npm run test
```

Watch mode for development:

```bash
npm run test:watch
```

### 4. Code Style and Linting

#### Backend

```bash
cd backend
poetry run black .
poetry run isort .
poetry run pylint api
```

#### Frontend

```bash
cd frontend
npm run lint
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

For updating technique data:

1. Edit JSON file in `backend/data/`
2. Import data using management commands:
   ```bash
   USE_SQLITE=True python manage.py import_techniques
   ```

## Common Development Tasks

### Adding a New Model

1. Define the model in `backend/api/models.py`
2. Create migrations: `python manage.py makemigrations`
3. Apply migrations: `python manage.py migrate`
4. Create a serializer in `backend/api/serializers.py`
5. Add ViewSet in `backend/api/views/api_views.py`
6. Register routes in `backend/api/urls.py`

### Adding a New API Endpoint

1. Create a view function or ViewSet in `backend/api/views/api_views.py`
2. Register the URL in `backend/api/urls.py`
3. Update Swagger documentation if needed

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

1. Use `import pdb; pdb.set_trace()` to set breakpoints
2. Use the Django Debug Toolbar for analyzing queries
3. Check logs in `backend/logs/`

### Frontend Debugging

1. Use the React Developer Tools browser extension
2. Use `console.log()` for basic debugging
3. Use the Network tab to debug API calls
4. Use the React Query Devtools for understanding query state

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

- **Migration errors**: Try `python manage.py makemigrations` followed by `python manage.py migrate`
- **Import errors**: Check that all required packages are installed in your Poetry environment
- **Database errors**: Check connection settings in `.env` or `settings.py`

#### Frontend

- **Build errors**: Check for TypeScript errors or missing dependencies
- **API connection issues**: Verify API URL in environment variables
- **Component errors**: Check React component props and types

## Related Links

- [Contributing Guide](CONTRIBUTING.md)
- [Testing Guide](TESTING.md)
- [Model Architecture](MODEL-ARCHITECTURE.md)
- [Frontend Guide](FRONTEND-GUIDE.md)
