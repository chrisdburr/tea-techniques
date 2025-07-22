# TEA Techniques Deployment Guide

## Overview

This guide covers the deployment process for the TEA Techniques application, which supports multiple deployment modes:

- **Static Mode**: Deploy as a static site to GitHub Pages (read-only)
- **Dynamic Mode**: Full-stack deployment with Django backend and Next.js frontend
- **Mock Mode**: Development/testing mode with mock API responses

## Prerequisites

### Required Tools
- Git
- Node.js 18+ and pnpm 10.6.5+
- Python 3.12+ (for dynamic mode)
- Docker and Docker Compose (optional, for containerized deployment)
- GitHub CLI (`gh`) for workflow management

### Access Requirements
- GitHub repository write access
- GitHub Pages enabled (for static deployment)
- Container registry access (for dynamic deployment)

## Deployment Modes

### 1. Static Mode (GitHub Pages)

Static mode is ideal for:
- Public documentation sites
- Read-only access to techniques
- Zero infrastructure cost
- Integration testing with mock APIs

#### Quick Deploy

```bash
# Deploy to GitHub Pages (main branch)
gh workflow run deploy-github-pages.yml

# Deploy with specific mode
gh workflow run deploy-github-pages.yml -f deploy_mode=static
```

#### Manual Deploy

```bash
# Build static site
cd frontend
pnpm install
pnpm sync-data
pnpm generate-api
pnpm build:static

# The output will be in frontend/out/
```

#### Configuration

Set these environment variables for static builds:
```bash
NEXT_PUBLIC_DATA_SOURCE=static
NEXT_PUBLIC_BASE_PATH=/tea-techniques  # For GitHub Pages
NEXT_PUBLIC_ASSET_PREFIX=/tea-techniques
```

### 2. Dynamic Mode (Full Stack)

Dynamic mode provides:
- Full CRUD operations
- User authentication
- Real-time API
- Database persistence

#### Quick Deploy

```bash
# Deploy to staging
gh workflow run deploy-dynamic.yml -f environment=staging

# Deploy to production
gh workflow run deploy-dynamic.yml -f environment=production
```

#### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.production.yml up -d

# With custom environment
docker-compose -f docker-compose.production.yml \
  --env-file .env.production \
  up -d
```

#### Configuration

Required environment variables:
```bash
# Backend
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@host:5432/dbname
ALLOWED_HOSTS=your-domain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com

# Frontend
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_DATA_SOURCE=api
```

### 3. Mock Mode (Development/Testing)

Mock mode is useful for:
- Local development without backend
- Integration partner testing
- UI/UX demonstrations

```bash
cd frontend
NEXT_PUBLIC_DATA_SOURCE=mock pnpm dev
```

## CI/CD Workflows

### Unified Deployment (`deploy.yml`)

Orchestrates deployment based on context:

```bash
# Manual trigger with options
gh workflow run deploy.yml \
  -f deployment_mode=static \
  -f deployment_target=github-pages \
  -f environment=staging
```

Automatic triggers:
- Push to `main` → Static deployment to staging
- Tag `v*` → Static deployment to production

### Mode-Specific Testing (`mode-testing.yml`)

Tests all deployment modes in parallel:

```bash
# Run comprehensive mode tests
gh workflow run mode-testing.yml
```

Tests include:
- Unit tests for each mode
- Integration tests
- Build validation
- Feature flag verification

### API Mock Validation (`api-mock-validation.yml`)

Ensures mock APIs remain valid:

```bash
# Validate API mocks
gh workflow run api-mock-validation.yml
```

Checks:
- JSON structure validity
- Schema compliance
- Backward compatibility
- Integration contracts

### GitHub Pages Deployment (`deploy-github-pages.yml`)

Dedicated workflow for GitHub Pages:

```bash
# Deploy static site
gh workflow run deploy-github-pages.yml

# Deploy mock site for testing
gh workflow run deploy-github-pages.yml -f deploy_mode=mock
```

Features:
- Automatic .nojekyll file creation
- Custom domain support
- Lighthouse performance testing
- Deployment validation

### Performance Monitoring (`performance-monitor.yml`)

Tracks performance across deployments:

```bash
# Run performance tests
gh workflow run performance-monitor.yml

# Test specific URL
gh workflow run performance-monitor.yml \
  -f deployment_url=https://staging.example.com
```

Metrics tracked:
- Lighthouse scores
- Bundle sizes
- Load times
- Performance regressions

## Mode Transitions

### Switching Between Modes

Use the mode transition workflow for zero-downtime switches:

```bash
# Switch from static to dynamic
gh workflow run mode-transition.yml \
  -f from_mode=static \
  -f to_mode=dynamic \
  -f environment=staging \
  -f dry_run=false

# Dry run first (recommended)
gh workflow run mode-transition.yml \
  -f from_mode=static \
  -f to_mode=dynamic \
  -f environment=staging \
  -f dry_run=true
```

### Rollback Procedures

If a deployment fails:

1. **Automatic Rollback**: The workflow creates a rollback plan
2. **Manual Rollback**: Use the mode transition workflow in reverse
3. **Emergency Rollback**: Revert to previous GitHub Pages deployment

```bash
# Rollback example
gh workflow run mode-transition.yml \
  -f from_mode=dynamic \
  -f to_mode=static \
  -f environment=production \
  -f dry_run=false
```

## Integration Support

### Mock API Endpoints

When deployed in static/mock mode, these endpoints are available:

- `/api/techniques.json` - List all techniques
- `/api/techniques/index.json` - Alternative list endpoint
- `/api/techniques/{slug}.json` - Individual technique details

### Webhook Notifications

Configure webhooks in repository settings for deployment events:

```json
{
  "event": "deployment_complete",
  "mode": "static",
  "environment": "production",
  "url": "https://example.github.io/tea-techniques",
  "api_base": "https://example.github.io/tea-techniques/api"
}
```

### Integration Testing

Partners can test against mock APIs:

```javascript
// Example integration test
const response = await fetch('https://example.github.io/tea-techniques/api/techniques.json');
const data = await response.json();
console.log(`Found ${data.techniques.length} techniques`);
```

## Monitoring and Validation

### Health Checks

- **Static Mode**: Check `/deployment.json` for deployment metadata
- **Dynamic Mode**: Use `/api/health/` endpoint
- **All Modes**: Verify homepage loads successfully

### Performance Monitoring

Monitor these metrics:
- Page load time < 2s
- Lighthouse score > 90
- Bundle size < 500KB (static mode)
- API response time < 200ms (dynamic mode)

### Validation Scripts

Run validation locally:

```bash
# Validate API mocks
cd frontend
node scripts/validateApiMocks.js

# Check compatibility
node scripts/compatibilityCheck.js

# Validate build
pnpm validate:build
pnpm validate:post-build
```

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear caches and rebuild
cd frontend
rm -rf .next out node_modules
pnpm install
pnpm build:static
```

#### API Mock Issues

```bash
# Regenerate API mocks
pnpm sync-data
pnpm generate-api
pnpm validate-api
```

#### GitHub Pages 404 Errors

1. Check `.nojekyll` file exists
2. Verify `NEXT_PUBLIC_BASE_PATH` is set correctly
3. Ensure GitHub Pages is enabled in repository settings

### Debug Commands

```bash
# Check current deployment
curl https://example.github.io/tea-techniques/deployment.json

# Verify API mocks
curl https://example.github.io/tea-techniques/api/techniques.json

# Test specific technique
curl https://example.github.io/tea-techniques/api/techniques/shapley-additive-explanations.json
```

## Security Considerations

### Static Deployments
- No sensitive data in static files
- API mocks contain only public information
- CORS headers not required

### Dynamic Deployments
- Use environment variables for secrets
- Enable HTTPS
- Configure CORS properly
- Regular security updates

### CI/CD Security
- Use GitHub Secrets for sensitive values
- Limit workflow permissions
- Enable branch protection
- Review deployment logs regularly

## Best Practices

1. **Always Test First**
   - Run mode tests before deployment
   - Validate API mocks
   - Check compatibility

2. **Use Staging Environment**
   - Deploy to staging first
   - Run integration tests
   - Monitor for issues

3. **Document Changes**
   - Update deployment metadata
   - Tag releases properly
   - Maintain changelog

4. **Monitor Performance**
   - Track metrics over time
   - Set up alerts for regressions
   - Optimize based on data

## Quick Reference

### Essential Commands

```bash
# Local development
pnpm dev                    # Start development server
pnpm build:static          # Build static site
pnpm build:dynamic         # Build dynamic site
pnpm test                  # Run tests

# Deployment
gh workflow run deploy.yml  # Unified deployment
gh workflow run deploy-github-pages.yml  # GitHub Pages
gh workflow run deploy-dynamic.yml       # Dynamic deployment

# Validation
pnpm validate-api          # Validate API mocks
pnpm validate:build        # Pre-build validation
pnpm validate:post-build   # Post-build validation

# Mode switching
gh workflow run mode-transition.yml  # Switch deployment modes
```

### Environment Variables

| Variable | Static | Dynamic | Description |
|----------|---------|----------|-------------|
| `NEXT_PUBLIC_DATA_SOURCE` | `static` | `api` | Data source mode |
| `NEXT_PUBLIC_BASE_PATH` | `/tea-techniques` | `/` | URL base path |
| `NEXT_PUBLIC_API_URL` | N/A | Required | Backend API URL |
| `DATABASE_URL` | N/A | Required | PostgreSQL connection |

### Workflow Files

| Workflow | Purpose | Trigger |
|----------|---------|---------|
| `deploy.yml` | Unified deployment | Manual/Push/Tag |
| `deploy-github-pages.yml` | GitHub Pages deployment | Push to main |
| `deploy-dynamic.yml` | Dynamic deployment | Manual/Push |
| `mode-testing.yml` | Test all modes | PR/Push |
| `api-mock-validation.yml` | Validate mocks | PR/Push |
| `mode-transition.yml` | Switch modes | Manual |
| `performance-monitor.yml` | Track performance | Schedule/Manual |

## Support

For deployment issues:
1. Check workflow logs in GitHub Actions
2. Review this guide and troubleshooting section
3. Consult the [CI/CD Pipeline documentation](./CI-CD-PIPELINE.md)
4. Open an issue with deployment logs and configuration
