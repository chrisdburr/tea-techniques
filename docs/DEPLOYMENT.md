# Deployment Guide

This document outlines deployment options for the TEA Techniques application.

## Local Development

```bash
# Backend
cd backend
poetry install
USE_SQLITE=True python manage.py runserver

# Frontend
cd frontend
pnpm install
pnpm run dev --turbopack
```

## Docker Deployment (Local)

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## Tailscale Deployment (Arch Linux Server)

1. Pull the latest changes from GitHub
   ```bash
   git pull
   ```

2. Make the deployment script executable
   ```bash
   chmod +x deploy-tailscale.sh
   ```

3. Check and modify `.env.tailscale` if needed to update your domain

4. Run the deployment script
   ```bash
   ./deploy-tailscale.sh
   ```

5. Set up Nginx (if not already configured)
   ```bash
   # Copy the Nginx configuration
   sudo cp nginx-tailscale.conf /etc/nginx/sites-available/tea-techniques
   
   # Create a symbolic link to enable the site
   sudo ln -s /etc/nginx/sites-available/tea-techniques /etc/nginx/sites-enabled/
   
   # Test the configuration
   sudo nginx -t
   
   # Restart Nginx
   sudo systemctl restart nginx
   ```

## Cloud Deployment (AWS, Azure, etc.)

For cloud deployments, the key considerations are:

1. **API URLs**: Set the appropriate `NEXT_PUBLIC_API_URL` environment variable during build or runtime

2. **Reverse Proxy**: Configure a reverse proxy (like Nginx, AWS Application Load Balancer, etc.) to route requests properly:
   - Frontend: `/` → Frontend service
   - Backend: `/api/*` → Backend service
   - Admin: `/admin/*` → Backend service
   - Static: `/static/*` → Backend service
   - Swagger: `/swagger/*` → Backend service

3. **Environment Variables**: Create appropriate `.env` files or use cloud provider's environment variable features

## Troubleshooting

### API Connection Issues

If the frontend can load but API calls fail:

1. Check browser console for errors
2. Verify the `NEXT_PUBLIC_API_URL` environment variable is correctly set
3. Ensure your reverse proxy is correctly routing `/api/*` paths to the backend service
4. Check CORS settings in the backend's `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`