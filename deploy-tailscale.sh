#!/bin/bash
# deploy-tailscale.sh - Deployment script for Tailscale server

set -e  # Exit on any error

# Check if .env.tailscale exists, if not, copy from example
if [ ! -f .env.tailscale ]; then
  if [ -f .env.tailscale.example ]; then
    echo "No .env.tailscale found, creating from example..."
    cp .env.tailscale.example .env.tailscale
    echo "Please edit .env.tailscale with your tailscale domain and other settings."
    exit 1
  else
    echo "Error: .env.tailscale not found and no example file available."
    exit 1
  fi
fi

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

# Create the nginx directory if it doesn't exist
mkdir -p nginx

# Generate the nginx configuration file from template
echo "Generating Nginx configuration..."
envsubst < nginx/tea-techniques.conf.template > nginx/tea-techniques.conf

# Start the containers with environment variables passed through
echo "Starting containers..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

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

# Set up Tailscale funnel if running as root and funnel is available
if [ "$EUID" -eq 0 ] && command -v tailscale &> /dev/null; then
  echo "Setting up Tailscale funnel in background mode..."
  tailscale funnel reset
  sleep 2
  tailscale funnel --bg 80
  echo "Funnel status:"
  tailscale funnel status
else
  echo "WARNING: Not running as root or Tailscale command not found. Skipping Tailscale funnel setup."
  echo "To set up Tailscale funnel manually, run the following as root:"
  echo "  tailscale funnel reset"
  echo "  tailscale funnel --bg 80"
fi

echo ""
echo "Deployment complete!"
echo "========================================"

if [ -n "$TAILSCALE_DOMAIN" ]; then
  echo "Your app should be accessible at: https://${TAILSCALE_DOMAIN}"
else
  echo "Your app is running, but TAILSCALE_DOMAIN is not set in your .env.tailscale file."
  echo "Please update your .env.tailscale file with your domain."
fi

echo ""
echo "Frontend container logs (press Ctrl+C to exit):"
docker-compose logs --tail=20 -f frontend