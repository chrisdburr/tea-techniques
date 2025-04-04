# API Guide

> [!NOTE] Overview
> The TEA Techniques application provides a RESTful API for managing and retrieving techniques for evidencing claims about responsible AI. The API is built using Django REST Framework.

## Base URL

When [deployed locally](DEPLOYMENT.md), the API is available at: `http://localhost:8000/api`

## Authentication

> [!IMPORTANT]
> The API uses session-based authentication for admin access. Authentication is required for create, update, and delete operations.
>
> To authenticate:
>
> 1. Log in through the Django admin interface at `/admin/`
> 2. Use the custom authentication endpoints at `/api/auth/login` 
> 3. Session cookie will be automatically applied to subsequent API requests

## Core Endpoints

| Endpoint                              | Description                               | Methods                 | Auth Required |
| ------------------------------------- | ----------------------------------------- | ----------------------- | ------------ |
| `/api`                                | API root with links to all endpoints      | GET                     | No           |
| `/api/techniques`                     | List, create, and filter techniques       | GET, POST               | POST only    |
| `/api/techniques/{id}`                | Retrieve, update, delete technique        | GET, PUT, PATCH, DELETE | All except GET |
| `/api/assurance-goals`                | List and manage assurance goals           | GET, POST               | POST only    |
| `/api/categories`                     | List and manage categories                | GET, POST               | POST only    |
| `/api/subcategories`                  | List and manage subcategories             | GET, POST               | POST only    |
| `/api/tags`                           | List and manage tags                      | GET, POST               | POST only    |
| `/api/categories-by-goal/{id}`        | Get categories for a specific goal        | GET                     | No           |
| `/api/subcategories-by-category/{id}` | Get subcategories for a specific category | GET                     | No           |
| `/api/attribute-types`                | List and manage attribute types           | GET, POST               | POST only    |
| `/api/attribute-values`               | List and manage attribute values          | GET, POST               | POST only    |
| `/api/resource-types`                 | List and manage resource types            | GET, POST               | POST only    |
| `/api/health`                         | Health check for API status               | GET                     | No           |

## Authentication Endpoints

| Endpoint          | Description                        | Methods | Auth Required |
| ----------------- | ---------------------------------- | ------- | ------------ |
| `/api/auth/csrf`  | Get CSRF token for authentication  | GET     | No           |
| `/api/auth/login` | Log in with username and password  | POST    | No           |
| `/api/auth/logout`| Log out current user               | POST    | Yes          |
| `/api/auth/user`  | Get current user information       | GET     | Yes          |
| `/api/auth/status`| Check authentication status        | GET     | No           |

## Documentation

> [!TIP]
> Interactive API documentation is available at:
>
> - Swagger UI: `/swagger` (no trailing slash)
> - ReDoc: `/redoc` (no trailing slash)

## Pagination

The API uses page-based pagination for list endpoints:

```json
{
  "count": 100,
  "next": "http://localhost:8000/api/techniques?page=2",
  "previous": null,
  "results": [...]
}
```

Control pagination with query parameters:

- `?page=2` - Page number
- `?page_size=50` - Results per page (default: 10)

## Filtering

The API supports filtering through query parameters:

```
/api/techniques?model_dependency=Model-Agnostic&assurance_goals=1
```

Available filters for techniques:

- `name` - Filter by name
- `model_dependency` - Filter by model dependency ("Model-Agnostic" or "Model-Specific")
- `assurance_goals` - Filter by assurance goal ID
- `categories` - Filter by category ID
- `subcategories` - Filter by subcategory ID
- `tags` - Filter by tag ID
- `complexity_min` - Filter by minimum complexity rating
- `complexity_max` - Filter by maximum complexity rating
- `computational_cost_min` - Filter by minimum computational cost rating
- `computational_cost_max` - Filter by maximum computational cost rating

## Searching

Search across multiple fields using the search parameter:

```
/api/techniques?search=fairness
```

This will search the name and description fields for the given term.

## Ordering

Control result ordering with the ordering parameter:

```
/api/techniques?ordering=name
/api/techniques?ordering=-name  # Descending order
```

## Error Handling

The API returns standard HTTP status codes:

- `200 OK` - Request succeeded
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request (details provided)
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Authenticated but insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service unavailable (e.g., database connection error)

Error responses include descriptive messages:

```json
{
  "detail": "Error message",
  "errors": {
    "field_name": ["Error details"]
  }
}
```

## Examples

### List Techniques

Request:

```
GET /api/techniques
```

Response:

```json
{
  "count": 50,
  "next": "http://localhost:8000/api/techniques?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Fairness Metrics",
      "description": "Statistical measures to assess fairness...",
      "model_dependency": "Model-Agnostic",
      ...
    },
    ...
  ]
}
```

### Get Technique Details

Request:

```
GET /api/techniques/1
```

Response:

```json
{
  "id": 1,
  "name": "Technique Name",
  "description": "Some description of the technique...",
  "model_dependency": "Model-Agnostic",
  "complexity_rating": 3,
  "computational_cost_rating": 2,
  "assurance_goals": [
    {
      "id": 1,
      "name": "Fairness",
      "description": "..."
    }
  ],
  "categories": [...],
  "subcategories": [...],
  "attribute_values": [...],
  "resources": [...],
  "example_use_cases": [...],
  "limitations": [...]
}
```

### Create a Technique

Request:

```
POST /api/techniques
Content-Type: application/json

{
  "name": "New Technique",
  "description": "Description...",
  "model_dependency": "Model-Agnostic",
  "assurance_goal_ids": [1, 2],
  "category_ids": [3],
  "subcategory_ids": [4, 5],
  "tag_ids": [],
  ...
}
```

Response:

```json
{
  "id": 51,
  "name": "New Technique",
  ...
}
```

## Debugging

> [!WARNING]
> For troubleshooting API issues:
>
> - Use the `/api/debug` endpoint to check API status and configuration (only available in development mode)
> - Check API health with `/api/health` (available in all environments)
> - Check server logs for detailed error messages
> - Verify correct Content-Type headers (application/json) for POST/PUT requests

## Client Integration

The frontend application uses custom hooks to interact with the API. These hooks are located in `/frontend/src/lib/api/hooks.ts` and provide a convenient interface for common operations.

Key hooks include:

- `useTechniques` - List and filter techniques
- `useTechniqueDetail` - Get technique details
- `useCreateTechnique` - Create a new technique
- `useUpdateTechnique` - Update an existing technique
- `useDeleteTechnique` - Delete a technique
- `useAssuranceGoals` - List assurance goals
- `useCategories` - List categories
- `useSubCategories` - List subcategories for a category
- `useTags` - List all tags
- `useAttributeTypes` - List attribute types
- `useAttributeValues` - List attribute values
- `useResourceTypes` - List resource types

> [!IMPORTANT]
> The frontend uses a consistent URL handling approach with NO trailing slashes to align with the backend configuration.

## URL Configuration

The API is configured with:
- `APPEND_SLASH = False` in Django settings
- `trailing_slash = False` in the DefaultRouter configuration

This means all API endpoints should be accessed without trailing slashes (e.g., `/api/techniques` not `/api/techniques/`).

## Security

In production, the API uses `IsAuthenticatedOrReadOnly` as the default permission class, which means:
- Read operations (GET, HEAD, OPTIONS) are allowed for all users
- Write operations (POST, PUT, PATCH, DELETE) require authentication

The debug endpoint (`/api/debug`) is completely disabled in production environments.

## Rate Limiting

The API does not currently implement rate limiting, but may do so in the future for production deployments.
