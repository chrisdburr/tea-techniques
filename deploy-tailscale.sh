#!/bin/bash
# deploy-tailscale.sh - Deployment script for Tailscale server

set -e  # Exit on any error

# Load environment variables from .env.tailscale
set -a
source .env.tailscale
set +a

echo "Deploying Tea Techniques for Tailscale..."
echo "========================================"

# Stop any running containers
echo "Stopping running containers..."
docker-compose down

# Remove any volume data to ensure a fresh start
echo "Removing volumes for a clean start..."
docker volume rm $(docker volume ls -q | grep tea-techniques) || true

# Make sure frontend uses relative URLs
echo "Setting up frontend with relative URLs..."
export NEXT_PUBLIC_API_URL="/api"
export NEXT_PUBLIC_SWAGGER_URL="/swagger/"

# Pass CORS settings to backend
echo "Setting up backend CORS and hosts..."
export ALLOWED_HOSTS="*,localhost,127.0.0.1,${TAILSCALE_DOMAIN},backend"
export CORS_ALLOWED_ORIGINS="http://localhost:3000,http://frontend:3000,https://${TAILSCALE_DOMAIN},http://${TAILSCALE_DOMAIN}"
export CSRF_TRUSTED_ORIGINS="https://${TAILSCALE_DOMAIN},http://${TAILSCALE_DOMAIN},http://localhost:8000"
export DEBUG="True"  # Temporarily enable DEBUG for better error messages
export USE_SQLITE="True"  # Use SQLite for deployment
echo "Added CORS, CSRF, and hosts settings for ${TAILSCALE_DOMAIN}"

# Rebuild the containers
echo "Building containers..."
docker-compose build \
  --build-arg NEXT_PUBLIC_API_URL="/api" \
  --build-arg NEXT_PUBLIC_SWAGGER_URL="/swagger/" \
  frontend

# Start the containers with environment variables passed through
echo "Starting containers..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 5

# Check if containers are running
echo "Checking container status..."
docker-compose ps

# Initialize the database with our special tailscale setup command
echo "Setting up database for Tailscale deployment..."
echo "This may take a minute..."
docker-compose exec -T backend python manage.py tailscale_setup

# Double check that techniques were imported successfully
echo "Verifying database initialization..."
docker-compose exec -T backend python manage.py shell -c "from api.models import Technique; print(f'Number of techniques: {Technique.objects.count()}')"

# Update Nginx configuration
if [ "$EUID" -eq 0 ]; then  # Only run if we're root
  echo "Updating Nginx configuration..."
  cp tea-techniques.conf /etc/nginx/conf.d/tea-techniques.conf
  
  # Test Nginx configuration before restarting
  nginx -t
  if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid, restarting Nginx..."
    systemctl restart nginx
  else
    echo "ERROR: Nginx configuration is invalid. Please check the configuration."
    exit 1
  fi
  
  # Set up Tailscale funnel
  echo "Setting up Tailscale funnel in background mode..."
  tailscale funnel reset
  sleep 2
  tailscale funnel --bg 80
  echo "Funnel status:"
  tailscale funnel status
else
  echo "WARNING: Not running as root. Skipping Nginx update and Tailscale funnel setup."
  echo "Please run 'sudo ./update-nginx.sh' to update Nginx configuration."
fi

echo ""
echo "Deployment complete!"
echo "========================================"
echo "Your app should be accessible at: https://${TAILSCALE_DOMAIN}"
echo ""
echo "Frontend container logs (press Ctrl+C to exit):"
docker-compose logs --tail=20 -f frontend
