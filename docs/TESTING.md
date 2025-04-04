# TEA Techniques Testing Guide

> [!NOTE]
> This guide explains the testing setup for both frontend and backend components, as well as cross-environment integration testing.
>
> For information on the development workflow surrounding testing, please see the [Development Workflow](DEVELOPMENT-WORKFLOW.md) documentation.

## Frontend Testing

The frontend uses Jest and React Testing Library for component and API testing.

### Setup

> [!TIP] 
> The testing environment is configured with:
> - Jest for test running and assertions
> - React Testing Library for component testing
> - MSW (Mock Service Worker) for API mocking

### Running Tests

To run the frontend tests:

```bash
cd frontend
pnpm run test
```

To run tests in watch mode during development:

```bash
cd frontend
pnpm run test:watch
```

## Backend Testing

The backend uses pytest and Django's testing tools for model and API testing.

### Setup

> [!TIP]
> The testing environment is configured with:
> - pytest and pytest-django for test running
> - Factory Boy for test data generation
> - pytest-cov for test coverage
> - Django REST framework's test utilities for API testing

### Running Tests

To run the backend tests:

```bash
cd backend
poetry run pytest
```

For test coverage report:

```bash
cd backend
poetry run pytest --cov=api
```

### Docker Testing

To run tests in the Docker development environment:

```bash
docker-compose -f docker-compose.development.yml exec backend pytest
```

For specific test files or classes:

```bash
docker-compose -f docker-compose.development.yml exec backend pytest api/tests/test_api.py::TechniqueAPITestCase
```

### Test Categories

The backend tests are organized into several categories:

1. **Model Tests**: Verify model constraints, validators, and relationships
2. **API Tests**: Verify API endpoints, permissions, and data formatting
3. **Authentication Tests**: Verify proper access control for authenticated/unauthenticated users
4. **Error Handling Tests**: Verify proper error responses for invalid requests
5. **Environment Validation Tests**: Verify that required environment variables are validated correctly

## Related Documentation

- [Development Workflow](DEVELOPMENT-WORKFLOW.md) - How testing fits into the development process
- [Contributing Guide](CONTRIBUTING.md) - Guidelines for test-driven development
- [Frontend Guide](FRONTEND-GUIDE.md) - Frontend architecture being tested
- [Model Architecture](MODEL-ARCHITECTURE.md) - Backend models being tested