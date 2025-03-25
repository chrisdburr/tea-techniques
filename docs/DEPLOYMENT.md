# Deployment Guide

> [!NOTE] Overview
> This document outlines deployment options for the TEA Techniques application.
>
> For Tailscale-specific deployment, see the [Tailscale Deployment Guide](TAILSCALE-DEPLOYMENT.md).

## Local Development

> [!TIP]
> To run the application locally:
>
> ```bash
> # Backend
> cd backend
> poetry install
> USE_SQLITE=True python manage.py runserver
>
> # Frontend
> cd frontend
> pnpm install
> pnpm run dev --turbopack
> ```

## Docker Deployment (Local)

> [!TIP]
> For a production-like environment using Docker:
>
> ```bash
> # Build and run with Docker Compose
> docker-compose up --build
> ```

## Cloud Deployment (AWS, Azure, etc.)

> [!IMPORTANT]
> For cloud deployments, the key considerations are:
>
> 1. **API URLs**: Set the appropriate `NEXT_PUBLIC_API_URL` environment variable during build or runtime
>
> 2. **Reverse Proxy**: Configure a reverse proxy (like Nginx, AWS Application Load Balancer, etc.) to route requests properly:
>
>    - Frontend: `/` → Frontend service
>    - Backend: `/api/*` → Backend service
>    - Admin: `/admin/*` → Backend service
>    - Static: `/static/*` → Backend service
>    - Swagger: `/swagger/*` → Backend service
>
> 3. **Environment Variables**: Create appropriate `.env` files or use cloud provider's environment variable features

## Troubleshooting

### API Connection Issues

> [!WARNING]
> If the frontend can load but API calls fail:
>
> 1. Check browser console for errors
> 2. Verify the `NEXT_PUBLIC_API_URL` environment variable is correctly set
> 3. Ensure your reverse proxy is correctly routing `/api/*` paths to the backend service
> 4. Check CORS settings in the backend's `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`

## Related Documentation

- [Tailscale Deployment Guide](TAILSCALE-DEPLOYMENT.md) - Guide for Tailscale-specific deployment
- [Development Workflow](DEVELOPMENT-WORKFLOW.md) - Local development setup
- [API Guide](API-GUIDE.md) - API endpoints that need to be configured for routing
- [Model Architecture](MODEL-ARCHITECTURE.md) - Database considerations for deployment
