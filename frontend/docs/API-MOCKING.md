# API Mocking System Documentation

## Overview

The TEA Techniques frontend implements a comprehensive API mocking system that enables:

1. **Static deployment** to GitHub Pages with full read-only functionality
2. **Integration testing** for external services without requiring the backend
3. **Local development** without backend dependencies
4. **Performance testing** with simulated network delays

## Architecture

### Data Service Abstraction

The system uses a service abstraction layer (`IDataService`) that allows seamless switching between:

- **API Mode**: Real Django REST API backend
- **Static Mode**: Pre-generated JSON files served from `/public/api/`
- **Mock Mode**: Static data with simulated delays and behaviors

### Static API Structure

```
frontend/public/api/
├── techniques.json          # List endpoint
├── techniques/
│   ├── [slug].json         # Individual technique endpoints
│   └── ...
├── categories.json         # Categories endpoint
└── search/
    └── index.json          # Search index for client-side filtering
```

## Configuration

### Environment Variables

```bash
# Data source mode (api | static | mock)
NEXT_PUBLIC_DATA_SOURCE=static

# Base path for GitHub Pages deployment
NEXT_PUBLIC_BASE_PATH=/tea-techniques

# Path to static API files
NEXT_PUBLIC_STATIC_DATA_PATH=/tea-techniques/api
```

### Build Scripts

```bash
# Development with different modes
pnpm dev:static    # Static mode development
pnpm dev:api       # API mode development
pnpm dev:mock      # Mock mode with delays

# Building for different targets
pnpm build:static       # GitHub Pages deployment
pnpm build:dynamic      # Standard deployment with API
pnpm build:mock         # Testing build with mocks
```

## Mock Endpoints

### Available Endpoints

1. **List Techniques**

   - URL: `/api/techniques.json`
   - Returns: Array of technique objects
   - Supports: Pagination metadata

2. **Get Technique by Slug**

   - URL: `/api/techniques/[slug].json`
   - Example: `/api/techniques/shapley-additive-explanations.json`
   - Returns: Single technique object

3. **List Categories**

   - URL: `/api/categories.json`
   - Returns: Array of category objects

4. **Search Index**
   - URL: `/api/search/index.json`
   - Returns: Optimized search data structure

### Response Format

All mock endpoints return data matching the exact schema of the real API:

```typescript
// Technique List Response
{
  "count": 50,
  "next": null,
  "previous": null,
  "results": [
    {
      "slug": "shapley-additive-explanations",
      "name": "Shapley Additive Explanations",
      "acronym": "SHAP",
      "description": "...",
      // ... full technique object
    }
  ]
}
```

## Integration Testing

### External Service Integration

External services can integrate with the static API endpoints for testing:

```javascript
// Example: Fetching techniques from external service
const response = await fetch("https://[github-pages-url]/api/techniques.json");
const data = await response.json();

// Process techniques
data.results.forEach((technique) => {
  console.log(`${technique.name} (${technique.acronym})`);
});
```

### Testing Different Modes

```javascript
// Test configuration for different environments
const config = {
  development: {
    apiUrl: "http://localhost:3000/api",
    dataSource: "mock",
  },
  staging: {
    apiUrl: "https://username.github.io/tea-techniques/api",
    dataSource: "static",
  },
  production: {
    apiUrl: "https://api.tea-platform.org",
    dataSource: "api",
  },
};
```

## Local Development

### Setting Up Mock Mode

1. Generate static API files:

   ```bash
   pnpm generate-api
   ```

2. Start development server in mock mode:

   ```bash
   pnpm dev:mock
   ```

3. Access mock endpoints:
   - List: `http://localhost:3000/api/techniques.json`
   - Detail: `http://localhost:3000/api/techniques/shap.json`

### Simulated Behaviors

In mock mode, the system simulates:

- Network delays (300-800ms)
- Loading states
- Error scenarios (configurable)
- Pagination behavior

## Data Synchronization

### Keeping Mock Data Updated

1. **Sync from source**:

   ```bash
   pnpm sync-data
   ```

2. **Validate data integrity**:

   ```bash
   pnpm validate-api
   ```

3. **Check for differences**:
   ```bash
   pnpm sync-data:check
   ```

### Automated Updates

The CI/CD pipeline automatically:

- Syncs data on build
- Validates schema compliance
- Generates optimized search indices
- Creates slug-based JSON files

## Performance Considerations

### Optimizations

1. **Pre-computed search indices** for instant client-side filtering
2. **Minified JSON** files for reduced payload size
3. **CDN-friendly** structure with proper cache headers
4. **Bundle splitting** to load only required data

### Limitations

- No write operations (create, update, delete)
- No real-time updates
- Limited to pre-generated data
- No user-specific content

## Debugging

### Developer Toolbar

In development mode, the enhanced developer toolbar shows:

- Current data source mode
- API endpoint being used
- Feature flags status
- Build information

### Common Issues

1. **404 errors on API routes**

   - Ensure `pnpm generate-api` has been run
   - Check `NEXT_PUBLIC_STATIC_DATA_PATH` configuration

2. **Mode not switching**

   - Clear Next.js cache: `rm -rf .next`
   - Restart development server with correct script

3. **Data out of sync**
   - Run `pnpm sync-data`
   - Rebuild static API: `pnpm generate-api`

## Future Enhancements

1. **GraphQL mock layer** for more complex queries
2. **WebSocket simulation** for real-time features
3. **Offline-first PWA** capabilities
4. **Service Worker** integration for advanced caching

## API Schema Reference

See `frontend/public/api/schema/` for detailed JSON schemas of all endpoints.
