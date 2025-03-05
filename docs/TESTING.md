# TEA Techniques Testing Guide

This guide explains the testing setup for both frontend and backend components, as well as cross-environment integration testing.

## Frontend Testing

The frontend uses Jest and React Testing Library for component and API testing.

### Setup

The testing environment is configured with:
- Jest for test running and assertions
- React Testing Library for component testing
- MSW (Mock Service Worker) for API mocking

### Running Tests

To run the frontend tests:

```bash
cd frontend
npm run test
```

To run tests in watch mode during development:

```bash
cd frontend
npm run test:watch
```

## Backend Testing

The backend uses pytest and Django's testing tools for model and API testing.

### Setup

The testing environment is configured with:
- pytest and pytest-django for test running
- Factory Boy for test data generation
- pytest-cov for test coverage

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

## Integration Testing

A custom integration testing script is provided to test the interaction between frontend and backend by making direct API calls.

### Running Integration Tests

Make sure both the backend and frontend are running, then:

```bash
# Install dependencies if needed
pip install requests rich

# Run integration tests
python scripts/test_integration.py
```

By default, the script tests against `http://localhost:8000`. You can specify a different base URL:

```bash
python scripts/test_integration.py --base-url=http://your-api-url
```

## Test Types

1. **Unit Tests**
   - Frontend: Components, hooks, utility functions
   - Backend: Models, serializers, utility functions

2. **Integration Tests**
   - Frontend: Component interactions
   - Backend: API endpoints
   - Cross-environment: API interactions between frontend and backend

3. **Mock Tests**
   - Frontend: MSW for API mocking
   - Backend: Factory Boy for database mocking

## Continuous Integration

For a CI pipeline, run tests in this order:
1. Frontend unit tests
2. Backend unit tests
3. Cross-environment integration tests

## Adding New Tests

### Frontend

Add files with `.test.ts` or `.test.tsx` extension alongside the component or function being tested.

### Backend

Add files in the `api/tests/` directory with `test_*.py` naming convention.