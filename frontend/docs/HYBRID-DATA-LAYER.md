# Hybrid Data Layer Architecture

## Overview

The TEA Techniques frontend implements a hybrid data layer that supports three distinct data source modes:

1. **API Mode** (default) - Connects to the Django REST API
2. **Static Mode** - Uses pre-generated JSON files served from `/public/api`
3. **Mock Mode** - Uses static files with simulated delays for testing

This architecture enables deployment to static hosting platforms like GitHub Pages while maintaining the ability to seamlessly switch back to dynamic API mode when needed.

## Architecture Components

### 1. Service Abstraction Layer (`src/lib/services/`)

The data service layer provides a unified interface for data fetching that abstracts away the underlying data source:

- **`dataService.ts`** - Defines the `IDataService` interface and configuration types
- **`apiDataService.ts`** - Implementation for fetching from Django REST API
- **`staticDataService.ts`** - Implementation for fetching from static JSON files
- **`dataServiceFactory.ts`** - Factory that creates the appropriate service based on configuration

### 2. Static Data Generation (`scripts/`)

Scripts that generate and maintain the static JSON files:

- **`generateStaticApi.js`** - Converts source data to API-compatible JSON format
- **`validateStaticData.js`** - Validates generated JSON against expected schemas
- **`syncTechniqueData.js`** - Synchronizes static data with source changes

### 3. Configuration System (`src/lib/config/`)

Environment-based configuration for controlling data sources and features:

- **`dataConfig.ts`** - Central configuration helper with feature flags
- **`.env.sample`** - Example environment configuration

### 4. Generated Static Files (`public/api/`)

Pre-generated JSON files that mirror the API structure:

```
public/api/
├── techniques.json          # Paginated list of all techniques
├── techniques/             # Individual technique files
│   └── [slug].json
├── assurance-goals.json    # List of assurance goals
├── tags.json              # List of all tags
├── resource-types.json    # List of resource types
├── search-index.json      # Pre-computed search index
├── filter-index.json      # Pre-computed filter aggregations
└── .sync-manifest.json    # Sync tracking metadata
```

## Configuration

### Environment Variables

Configure the data source and features via environment variables:

```bash
# Data source mode: "api" | "static" | "mock"
NEXT_PUBLIC_DATA_SOURCE=static

# Path to static JSON files (relative to public directory)
NEXT_PUBLIC_STATIC_DATA_PATH=/api

# Feature flags (automatically disabled in static mode)
NEXT_PUBLIC_ENABLE_AUTH=false
NEXT_PUBLIC_ENABLE_EDITING=false
NEXT_PUBLIC_ENABLE_SUBMISSION=false

# Show data source indicator in UI
NEXT_PUBLIC_SHOW_DATA_SOURCE_INDICATOR=true
```

### Build Scripts

New npm scripts for different build modes:

```bash
# Generate static API files from source data
pnpm generate-api

# Sync static data (checks for changes and regenerates if needed)
pnpm sync-data

# Check if static data is up to date
pnpm sync-data:check

# Validate static data against schemas
pnpm validate-api

# Build for static deployment (GitHub Pages)
pnpm build:static

# Build for hybrid deployment (with API support)
pnpm build:hybrid
```

## Usage

### 1. Switching Data Sources

The data source is controlled by the `NEXT_PUBLIC_DATA_SOURCE` environment variable:

```bash
# Development with API
NEXT_PUBLIC_DATA_SOURCE=api pnpm dev

# Development with static data
NEXT_PUBLIC_DATA_SOURCE=static pnpm dev

# Development with mock data (includes delays)
NEXT_PUBLIC_DATA_SOURCE=mock pnpm dev
```

### 2. Using the Data Service

Components should use the data service through React Query hooks, which automatically use the configured data source:

```typescript
import { useTechniques } from "@/lib/api/hooks";

// This will fetch from the appropriate source based on configuration
const { data, isLoading, error } = useTechniques();
```

### 3. Feature Detection

Use the configuration helpers to conditionally render features:

```typescript
import { getFeatureFlags } from "@/lib/config/dataConfig";

const features = getFeatureFlags();

if (features.enableAuth) {
  // Show authentication UI
}

if (features.enableEditing) {
  // Show edit buttons
}
```

### 4. Data Source Indicator

When enabled, a small badge shows the current data source mode:

```typescript
import { DataSourceIndicator } from "@/components/common/DataSourceIndicator";

// Add to your layout
<DataSourceIndicator />;
```

## Static Data Generation

### Initial Generation

Generate all static API files from the source data:

```bash
pnpm generate-api
```

This creates:

- Main API responses (techniques, goals, tags, etc.)
- Individual technique JSON files
- Search and filter indices
- Sync manifest for tracking changes

### Synchronization

Keep static data in sync with source changes:

```bash
# Check and regenerate if needed
pnpm sync-data

# Check only (useful for CI)
pnpm sync-data:check
```

The sync tool:

- Compares source file hash with last sync
- Only regenerates if source has changed
- Updates sync manifest with metadata
- Validates generated files

### Validation

Ensure generated data matches expected schemas:

```bash
pnpm validate-api
```

Validation checks:

- Required fields presence
- Field type correctness
- Relationship integrity
- Cross-references validity

## Search and Filter Indices

### Search Index

The search index enables fast client-side searching:

```json
{
  "techniques": [{
    "slug": "shapley-additive-explanations",
    "name": "SHapley Additive exPlanations",
    "searchableText": "shapley additive explanations shap...",
    "tokens": ["shapley", "additive", "explanations", ...]
  }],
  "invertedIndex": {
    "shapley": ["shapley-additive-explanations", ...],
    "machine": ["local-interpretable-model-agnostic-explanations", ...]
  }
}
```

### Filter Index

Pre-computed aggregations for efficient filtering:

```json
{
  "tags": {
    "1": {
      "id": 1,
      "name": "applicable-models/agnostic",
      "techniqueCount": 45
    }
  },
  "assuranceGoals": {
    "1": {
      "id": 1,
      "name": "Explainability",
      "techniqueCount": 62
    }
  },
  "complexityDistribution": [
    { "rating": 1, "count": 12 },
    { "rating": 2, "count": 28 }
  ]
}
```

## Deployment

### Static Deployment (GitHub Pages)

1. Build with static mode:

   ```bash
   pnpm build:static
   ```

2. The build process:

   - Syncs data automatically
   - Sets `NEXT_PUBLIC_DATA_SOURCE=static`
   - Exports static HTML
   - Includes all JSON files in `/api`

3. Deploy the `out/` directory to GitHub Pages

### Hybrid Deployment

1. Build normally:

   ```bash
   pnpm build:hybrid
   ```

2. Deploy with appropriate environment variables
3. Can switch between modes via configuration

## Testing

### Unit Tests

Test data services with different sources:

```typescript
import { StaticDataService } from "@/lib/services/staticDataService";
import { ApiDataService } from "@/lib/services/apiDataService";

// Test each implementation
describe("StaticDataService", () => {
  // Tests for static mode
});

describe("ApiDataService", () => {
  // Tests for API mode
});
```

### Integration Tests

Test the full flow with different configurations:

```typescript
// Set data source for test
process.env.NEXT_PUBLIC_DATA_SOURCE = "static";

// Test should work regardless of data source
test("displays techniques list", async () => {
  // ...
});
```

## Best Practices

1. **Always use the data service abstraction** - Never fetch directly from URLs
2. **Check feature flags** - Disable dynamic features in static mode
3. **Keep data in sync** - Run `sync-data` before deployments
4. **Validate changes** - Run `validate-api` after modifications
5. **Test both modes** - Ensure features work with all data sources

## Migration Guide

### From Dynamic to Static

1. Generate static data: `pnpm generate-api`
2. Update environment: `NEXT_PUBLIC_DATA_SOURCE=static`
3. Build for static: `pnpm build:static`
4. Deploy to static hosting

### From Static to Dynamic

1. Ensure backend is running
2. Update environment: `NEXT_PUBLIC_DATA_SOURCE=api`
3. Build normally: `pnpm build`
4. Deploy with API access

## Troubleshooting

### Common Issues

1. **"Static data out of sync"**

   - Run `pnpm sync-data` to regenerate

2. **"Feature not working in static mode"**

   - Check if feature requires API (auth, editing)
   - Feature flags automatically disable these

3. **"Search not finding results"**

   - Ensure search index is generated
   - Check query has 3+ character tokens

4. **"Build fails with static mode"**
   - Ensure all static files exist
   - Run `pnpm validate-api` to check

## Future Enhancements

1. **Incremental Static Regeneration** - Update specific techniques without full rebuild
2. **Edge Caching** - Cache static data at CDN edge
3. **Offline Support** - PWA with service worker caching
4. **GraphQL Layer** - Optional GraphQL API over static data
