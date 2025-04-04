# Running Tests with Docker and PostgreSQL

This guide explains how to run tests against either SQLite (in-memory) or PostgreSQL (via Docker).

## Test Configuration

The project supports two testing database configurations:

1. **SQLite in-memory (Default)**: Fast tests for quick development
2. **PostgreSQL in Docker**: Closer to production environment, catches PostgreSQL-specific issues

## Running Tests with SQLite (Default)

For quick development and testing, use the standard Django test command:

```bash
cd backend
python manage.py test api
```

Or if you prefer Pytest:

```bash
cd backend
pytest api/tests
```

These commands use an in-memory SQLite database for faster testing.

## Running Tests with PostgreSQL (Docker)

For more accurate testing that matches the production environment, use the Docker test configuration:

```bash
# From project root directory
docker-compose -f docker-compose.test.yml up --build
```

This will:
1. Start a PostgreSQL container specifically for testing
2. Run Django tests against that PostgreSQL database
3. Close the containers after tests complete

You can also run specific test files or methods:

```bash
# Run a specific test file
docker-compose -f docker-compose.test.yml run --rm backend-test python manage.py test api.tests.test_api

# Run a specific test class
docker-compose -f docker-compose.test.yml run --rm backend-test python manage.py test api.tests.test_api.TechniqueAPITestCase

# Run a specific test method
docker-compose -f docker-compose.test.yml run --rm backend-test python manage.py test api.tests.test_api.TechniqueAPITestCase.test_get_technique_list
```

## PostgreSQL-Specific Tests

Some tests are specifically designed to verify PostgreSQL functionality, such as full-text search capabilities. These tests are marked to be skipped when running against SQLite.

To run these PostgreSQL-specific tests:

```bash
docker-compose -f docker-compose.test.yml run --rm backend-test python manage.py test api.tests.test_api.PostgreSQLTestCase
```

## Environment Variables

The test configuration can be controlled via environment variables:

- `USE_POSTGRES_FOR_TESTS=True`: Use PostgreSQL instead of SQLite (in Docker this is set automatically)
- `DJANGO_SETTINGS_MODULE=config.settings.test`: Use test settings

## CI/CD Testing

For CI/CD pipelines, you can run tests against both SQLite and PostgreSQL to ensure compatibility across environments.