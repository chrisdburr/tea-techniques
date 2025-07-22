# Integration Testing Guide

## Overview

This guide explains how external services can integrate with TEA Techniques' mock API endpoints for testing purposes. The static API provides a stable, versioned interface that mirrors the production API exactly.

## Quick Start

### Base URL

When TEA Techniques is deployed to GitHub Pages:

```
https://[username].github.io/tea-techniques/api/
```

### Example Integration

```javascript
// JavaScript/TypeScript
async function fetchTechniques() {
  const response = await fetch(
    'https://username.github.io/tea-techniques/api/techniques.json'
  );
  const data = await response.json();
  return data.results;
}

// Python
import requests

def fetch_techniques():
    response = requests.get(
        'https://username.github.io/tea-techniques/api/techniques.json'
    )
    return response.json()['results']
```

## Available Endpoints

### 1. List All Techniques

**Endpoint:** `/api/techniques.json`

**Response:**

```json
{
  "count": 50,
  "next": null,
  "previous": null,
  "results": [
    {
      "slug": "shapley-additive-explanations",
      "name": "Shapley Additive Explanations",
      "acronym": "SHAP",
      "description": "A unified approach to explaining model predictions...",
      "goals": ["explainability", "transparency"],
      "categories": ["technical", "model-agnostic"],
      "limitations": ["..."],
      "examples": ["..."],
      "resources": ["..."]
    }
  ]
}
```

### 2. Get Technique by Slug

**Endpoint:** `/api/techniques/[slug].json`

**Example:** `/api/techniques/shapley-additive-explanations.json`

**Response:**

```json
{
  "slug": "shapley-additive-explanations",
  "name": "Shapley Additive Explanations",
  "acronym": "SHAP",
  "description": "...",
  "implementation_details": "...",
  "strengths": ["..."],
  "limitations": ["..."],
  "examples": ["..."],
  "resources": ["..."],
  "related_techniques": ["lime", "anchors"]
}
```

### 3. List Categories

**Endpoint:** `/api/categories.json`

**Response:**

```json
{
  "results": [
    {
      "id": 1,
      "name": "Technical",
      "slug": "technical",
      "description": "Technical implementation techniques"
    }
  ]
}
```

### 4. Search Index

**Endpoint:** `/api/search/index.json`

**Response:**

```json
{
  "techniques": {
    "shapley-additive-explanations": {
      "name": "Shapley Additive Explanations",
      "acronym": "SHAP",
      "searchableText": "shapley additive explanations shap explainability...",
      "categories": ["technical"],
      "goals": ["explainability"]
    }
  },
  "searchConfig": {
    "fields": ["name", "acronym", "description"],
    "weights": {
      "name": 2.0,
      "acronym": 1.5,
      "description": 1.0
    }
  }
}
```

## Integration Patterns

### 1. Basic Fetching

```javascript
class TEATechniquesClient {
  constructor(baseUrl = "https://username.github.io/tea-techniques/api") {
    this.baseUrl = baseUrl;
  }

  async getTechniques() {
    const response = await fetch(`${this.baseUrl}/techniques.json`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async getTechnique(slug) {
    const response = await fetch(`${this.baseUrl}/techniques/${slug}.json`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
}
```

### 2. With Error Handling

```javascript
async function safeFetchTechnique(slug) {
  try {
    const response = await fetch(
      `https://username.github.io/tea-techniques/api/techniques/${slug}.json`,
    );

    if (response.status === 404) {
      return { error: "Technique not found", slug };
    }

    if (!response.ok) {
      return { error: `HTTP ${response.status}`, slug };
    }

    return await response.json();
  } catch (error) {
    return { error: error.message, slug };
  }
}
```

### 3. Client-Side Search

```javascript
async function searchTechniques(query) {
  // Fetch search index
  const indexResponse = await fetch(
    "https://username.github.io/tea-techniques/api/search/index.json",
  );
  const searchData = await indexResponse.json();

  // Perform client-side search
  const results = Object.entries(searchData.techniques)
    .filter(([slug, technique]) => {
      const searchText = technique.searchableText.toLowerCase();
      return searchText.includes(query.toLowerCase());
    })
    .map(([slug, technique]) => ({
      slug,
      ...technique,
    }));

  return results;
}
```

## Testing Strategies

### 1. Unit Tests

```javascript
// Jest example
describe("TEA Techniques Integration", () => {
  it("should fetch techniques list", async () => {
    const response = await fetch(
      "https://username.github.io/tea-techniques/api/techniques.json",
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toBeInstanceOf(Array);
    expect(data.results.length).toBeGreaterThan(0);
    expect(data.results[0]).toHaveProperty("slug");
    expect(data.results[0]).toHaveProperty("name");
  });
});
```

### 2. Integration Tests

```python
# Python pytest example
import pytest
import requests

class TestTEAIntegration:
    BASE_URL = "https://username.github.io/tea-techniques/api"

    def test_techniques_endpoint(self):
        response = requests.get(f"{self.BASE_URL}/techniques.json")
        assert response.status_code == 200

        data = response.json()
        assert "results" in data
        assert len(data["results"]) > 0

    def test_specific_technique(self):
        # First get a technique slug from the list
        list_response = requests.get(f"{self.BASE_URL}/techniques.json")
        techniques = list_response.json()["results"]
        first_slug = techniques[0]["slug"]

        # Then fetch that specific technique
        detail_response = requests.get(
            f"{self.BASE_URL}/techniques/{first_slug}.json"
        )
        assert detail_response.status_code == 200

        technique = detail_response.json()
        assert technique["slug"] == first_slug
```

### 3. Contract Testing

```javascript
// Using Pact or similar
const techniqueContract = {
  slug: expect.stringMatching(/^[a-z0-9-]+$/),
  name: expect.any(String),
  acronym: expect.any(String),
  description: expect.any(String),
  goals: expect.arrayContaining([expect.any(String)]),
  categories: expect.arrayContaining([expect.any(String)]),
};

test("technique response matches contract", async () => {
  const response = await fetch(
    "https://username.github.io/tea-techniques/api/techniques/shap.json",
  );
  const technique = await response.json();

  expect(technique).toMatchObject(techniqueContract);
});
```

## CORS Configuration

The static API is served with permissive CORS headers, allowing integration from any origin:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
```

## Rate Limiting

Since this is a static deployment:

- No rate limiting on the API itself
- GitHub Pages has generous bandwidth limits
- CDN caching reduces origin requests

## Versioning

The API follows semantic versioning principles:

- Mock data is versioned with the frontend releases
- Breaking changes are documented in release notes
- Old versions can be accessed via git tags

## Monitoring Integration

### Health Check

```javascript
async function checkTEAIntegration() {
  try {
    const response = await fetch(
      "https://username.github.io/tea-techniques/api/techniques.json",
      { method: "HEAD" },
    );
    return response.ok;
  } catch (error) {
    return false;
  }
}
```

### Performance Monitoring

```javascript
async function measureAPIPerformance() {
  const start = performance.now();

  await fetch("https://username.github.io/tea-techniques/api/techniques.json");

  const duration = performance.now() - start;
  console.log(`API response time: ${duration}ms`);

  return duration;
}
```

## Troubleshooting

### Common Issues

1. **404 Not Found**

   - Check the exact URL path
   - Ensure slug is correctly formatted (lowercase, hyphenated)
   - Verify the deployment is complete

2. **CORS Errors**

   - Should not occur with static deployment
   - Check if browser extensions are interfering
   - Verify you're using HTTPS

3. **Slow Response Times**
   - First request may be slower (cold cache)
   - Subsequent requests should be fast (CDN cached)
   - Consider implementing local caching

### Debug Headers

Check response headers for debugging:

```
X-GitHub-Request-Id: [request-id]
X-Served-By: [cdn-node]
Cache-Control: max-age=600
```

## Support

For issues or questions:

1. Check the [API documentation](./API-MOCKING.md)
2. Review the [main documentation](../README.md)
3. Open an issue on GitHub
