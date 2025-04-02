#!/bin/bash
# update-nginx.sh - Update Nginx configuration without restarting the server

set -e  # Exit on any error

# Make the script executable
chmod +x $0

# Load environment variables
if [ -f .env.tailscale ]; then
  set -a
  source .env.tailscale
  set +a
else
  echo "WARNING: .env.tailscale file not found. Using default values."
fi

echo "Updating Nginx configuration for Tea Techniques..."
echo "=================================================="

# Check if nginx directory exists, if not create it
if [ ! -d nginx ]; then
  echo "Creating nginx directory..."
  mkdir -p nginx
fi

# Check if template exists
if [ ! -f nginx/tea-techniques.conf.template ]; then
  echo "ERROR: Nginx configuration template not found at nginx/tea-techniques.conf.template"
  exit 1
fi

# Generate the new configuration file
echo "1. Generating new Nginx configuration from template..."
if [ -f nginx/tea-techniques.conf ]; then
  # Backup existing configuration
  cp nginx/tea-techniques.conf nginx/tea-techniques.conf.bak
  echo "   Backed up existing configuration to nginx/tea-techniques.conf.bak"
fi

# Use envsubst to replace environment variables in the template
envsubst < nginx/tea-techniques.conf.template > nginx/tea-techniques.conf
echo "   Generated new configuration at nginx/tea-techniques.conf"

# Reload Nginx configuration by restarting the container
echo "2. Restarting Nginx container to apply changes..."
if docker-compose ps | grep -q nginx; then
  docker-compose restart nginx
  echo "   ✅ Nginx container restarted successfully"
else
  echo "   ❌ Nginx container is not running"
  echo "   Please start the container with: docker-compose up -d nginx"
  exit 1
fi

# Verify Nginx is running
echo "3. Verifying Nginx is running..."
if docker-compose ps | grep -q "nginx.*Up"; then
  echo "   ✅ Nginx container is running"
else
  echo "   ❌ Nginx container failed to start"
  echo "   Please check container logs with: docker-compose logs nginx"
  exit 1
fi

# Show Nginx status and logs
echo "4. Checking Nginx container logs (last 5 lines)..."
docker-compose logs --tail=5 nginx

echo ""
echo "Configuration updated successfully!"
echo "===================================="
echo "Your application should now correctly handle API requests."
echo ""
if [ -n "$TAILSCALE_DOMAIN" ]; then
  echo "To test the API directly, try:"
  echo "curl -v https://${TAILSCALE_DOMAIN}/api/"
  echo ""
  echo "To test the frontend with API integration:"
  echo "Visit https://${TAILSCALE_DOMAIN}/techniques/"
else
  echo "To test the API locally, try:"
  echo "curl -v http://localhost/api/"
  echo ""
  echo "To test the frontend with API integration:"
  echo "Visit http://localhost/techniques/"
fi
echo ""
echo "For debugging, check the Nginx logs:"
echo "docker-compose logs nginx"