# API URL and Testing Configuration

## URL Standards

### No Trailing Slashes

This project is configured to use URLs **without trailing slashes** in the API:

- The Django REST Framework setting `TRAILING_SLASH = False` is set in the configuration
- The Django setting `APPEND_SLASH = False` is also set
- The router is configured with `DefaultRouter(trailing_slash=False)`

This means that the following URL format should be used throughout the application:

```
/api/techniques          # Correct 
/api/techniques/         # Incorrect
/api/techniques/123      # Correct
/api/techniques/123/     # Incorrect
```

### API Base Path

All API endpoints are prefixed with `/api`. For example:

```
/api/techniques
/api/categories
/api/auth/login
```

## Testing with Different Database Backends

### SQLite In-Memory Testing

For fast local development testing, the SQLite in-memory database is used by default:

```bash
python manage.py test
```

### PostgreSQL Testing

For comprehensive testing that matches the production environment:

1. Using the Docker test configuration:
```bash
docker-compose -f docker-compose.test.yml up
```

2. Manually configuring PostgreSQL testing:
```bash
USE_POSTGRES_FOR_TESTS=True python manage.py test
```

See `DOCKER_TESTING.md` for detailed instructions on Docker-based testing.