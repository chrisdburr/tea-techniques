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
USE_SQLITE=True poetry run pytest
```

For test coverage report:

```bash
cd backend
USE_SQLITE=True poetry run pytest --cov=api
```