#!/bin/bash
# deploy-tailscale.sh - Deployment script for Tailscale server

# Load environment variables from .env.tailscale
set -a
source .env.tailscale
set +a

# Stop any running containers
docker-compose down

# Rebuild the containers with Tailscale-specific environment variables
docker-compose build \
  --build-arg NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
  --build-arg NEXT_PUBLIC_SWAGGER_URL=$NEXT_PUBLIC_SWAGGER_URL \
  frontend

# Start the containers
docker-compose up -d

echo "Deployment complete! Your app should be available at $NEXT_PUBLIC_API_URL"