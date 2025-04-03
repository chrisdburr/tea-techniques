#!/bin/bash
# deploy-tailscale.sh - Deployment script for Tailscale server 

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
TAILSCALE_ENV_FILE=".env.tailscale"
NGINX_TEMPLATE_FILE="nginx/tea-techniques.conf.template"
NGINX_OUTPUT_FILE="nginx/tea-techniques.conf"
DOCKER_COMPOSE_CMD="docker compose -f docker-compose.tailscale.yml --env-file ${TAILSCALE_ENV_FILE}"

# --- Pre-flight Checks ---
echo "🚀 Starting Tailscale Deployment for Tea Techniques..."
echo "=================================================="

# 1. Check if .env.tailscale exists
if [ ! -f "$TAILSCALE_ENV_FILE" ]; then
  echo "❌ Error: Environment file '$TAILSCALE_ENV_FILE' not found."
  if [ -f "${TAILSCALE_ENV_FILE}.example" ]; then
    echo "ℹ️ An example file exists at '${TAILSCALE_ENV_FILE}.example'. Please copy and configure it."
  fi
  exit 1
else
  echo "✅ Found environment file: $TAILSCALE_ENV_FILE"
  # Load environment variables from .env.tailscale for use *within this script* (e.g., for envsubst)
  set -a
  source "$TAILSCALE_ENV_FILE"
  set +a
fi

# 2. Check if Nginx template exists
if [ ! -f "$NGINX_TEMPLATE_FILE" ]; then
  echo "❌ Error: Nginx template file '$NGINX_TEMPLATE_FILE' not found."
  exit 1
else
   echo "✅ Found Nginx template: $NGINX_TEMPLATE_FILE"
fi

# 3. Check for required tools
if ! command -v docker &> /dev/null || ! command -v docker compose &> /dev/null; then
    echo "❌ Error: 'docker' and 'docker compose' (v2) are required but not found."
    exit 1
fi
if ! command -v envsubst &> /dev/null; then
    echo "❌ Error: 'envsubst' (usually part of gettext package) is required but not found."
    echo "ℹ️ On Debian/Ubuntu: sudo apt-get update && sudo apt-get install gettext-base"
    echo "ℹ️ On Arch Linux: sudo pacman -S gettext"
    echo "ℹ️ On macOS (Homebrew): brew install gettext && brew link --force gettext"
    exit 1
fi
echo "✅ Required tools found."

# --- Deployment Steps ---

# 4. Stop existing services defined in the compose file
echo ""
echo "🛑 Stopping existing containers (if any)..."
$DOCKER_COMPOSE_CMD down --remove-orphans || echo "ℹ️ No running containers to stop or failed to stop."

# 5. Clean up old volumes (optional, ensures completely fresh state)
read -p "❓ Do you want to remove existing database and log volumes? (y/N): " -n 1 -r
echo # Move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️ Removing volumes..."
    docker volume rm $(docker volume ls -q | grep tea-techniques_postgres_data) &>/dev/null || echo "ℹ️ No database volume to remove or removal failed."
    docker volume rm $(docker volume ls -q | grep tea-techniques_nginx_logs) &>/dev/null || echo "ℹ️ No nginx logs volume to remove or removal failed."
else
    echo "⏭️ Skipping volume removal."
fi

# 6. Generate Nginx Configuration from template
echo ""
echo "⚙️ Generating Nginx configuration file..."
mkdir -p "$(dirname "$NGINX_OUTPUT_FILE")" # Ensure directory exists
# Use envsubst to replace variables sourced from .env.tailscale
if envsubst < "$NGINX_TEMPLATE_FILE" > "$NGINX_OUTPUT_FILE"; then
  echo "   ✅ Generated '$NGINX_OUTPUT_FILE'"
else
  echo "❌ Error: Failed to generate Nginx config from template. Check variables in '$TAILSCALE_ENV_FILE'."
  exit 1
fi

# 7. Build/Pull images and start containers in detached mode
#    Crucially, we DO NOT specify '--profile dev' here, so only base services run
echo ""
echo "🏗️ Building/Pulling images and starting containers (production mode)..."
if $DOCKER_COMPOSE_CMD build --no-cache; then # Build with no cache for latest code
  echo "   ✅ Build successful."
else
  echo "❌ Error: Docker build failed. Check build logs."
  exit 1
fi

if $DOCKER_COMPOSE_CMD up -d; then # Start services without dev profile
  echo "   ✅ Containers started."
else
  echo "❌ Error: Failed to start containers. Check logs with '$DOCKER_COMPOSE_CMD logs'."
  exit 1
fi

# 8. Wait for services to become healthy
echo ""
echo "⏳ Waiting for services to become healthy (up to 60 seconds)..."
sleep 10 # Initial wait
attempts=0
max_attempts=10 # Wait for max 50 more seconds (10*5s)
while [ $attempts -lt $max_attempts ]; do
  if ! $DOCKER_COMPOSE_CMD ps | grep -v EXIT | grep -q unhealthy; then
    echo "✅ All services appear healthy."
    break
  fi
  attempts=$((attempts+1))
  echo "   Waiting... (attempt $attempts/$max_attempts)"
  sleep 5
done

if [ $attempts -eq $max_attempts ]; then
    echo "⚠️ Warning: Some services might still be unhealthy after waiting."
    echo "   Check detailed status with: $DOCKER_COMPOSE_CMD ps"
    echo "   Check logs with: $DOCKER_COMPOSE_CMD logs <service_name>"
    # Decide if you want to exit here or continue
    # exit 1
fi

# 9. Run Database Migrations and Data Import
echo ""
echo "💾 Setting up database (migrations, import)..."
echo "   Running Migrations..."
if $DOCKER_COMPOSE_CMD exec -T backend python manage.py migrate --noinput; then
  echo "   ✅ Migrations applied successfully."
else
  echo "❌ Error: Database migrations failed. Check backend logs."
  # exit 1 # Optional: exit on migration failure
fi

echo "   Importing Techniques (if database is empty)..."
# Check count first to avoid re-importing unnecessarily
TECHNIQUE_COUNT=$($DOCKER_COMPOSE_CMD exec -T backend python -c "from api.models import Technique; print(Technique.objects.count())" 2>/dev/null || echo "0")
echo "   Current technique count: $TECHNIQUE_COUNT"
if [ "$TECHNIQUE_COUNT" = "0" ]; then
  if $DOCKER_COMPOSE_CMD exec -T backend python manage.py import_techniques; then
    FINAL_COUNT=$($DOCKER_COMPOSE_CMD exec -T backend python -c "from api.models import Technique; print(Technique.objects.count())" 2>/dev/null || echo "Error")
    echo "   ✅ Techniques imported successfully. New count: $FINAL_COUNT"
  else
    echo "⚠️ Warning: Technique import failed or was skipped. Check backend logs."
  fi
else
    echo "   ⏭️ Skipping import as techniques already exist."
fi

echo "   Ensuring Admin User Exists..."
if $DOCKER_COMPOSE_CMD exec -T backend python manage.py shell -c "from django.contrib.auth.models import User; User.objects.create_superuser('admin', 'admin@example.com', '${ADMIN_PASSWORD:-admin}') if not User.objects.filter(username='admin').exists() else print('Admin already exists')"; then
  echo "   ✅ Admin user check complete."
else
  echo "⚠️ Warning: Could not ensure admin user exists."
fi

# 10. Setup Tailscale Funnel
echo ""
echo "🌐 Setting up Tailscale Funnel..."
if [ "$EUID" -eq 0 ] && command -v tailscale &> /dev/null; then
  echo "   Resetting existing funnel..."
  tailscale funnel reset || echo "   ℹ️ No existing funnel to reset or reset failed."
  sleep 2
  echo "   Starting funnel on port 80 in background..."
  if tailscale funnel --bg 80; then
    echo "   ✅ Tailscale funnel started."
    echo "   Funnel status:"
    tailscale funnel status
  else
    echo "❌ Error: Failed to start Tailscale funnel."
  fi
else
  echo "⚠️ WARNING: Not running as root or 'tailscale' command not found."
  echo "   Skipping automated Tailscale funnel setup."
  echo "   To enable external access, run manually as root:"
  echo "     tailscale funnel reset && sleep 2 && tailscale funnel --bg 80"
fi

# --- Completion ---
echo ""
echo "✅ Deployment Complete!"
echo "========================================"

if [ -n "$TAILSCALE_DOMAIN" ]; then
  echo "   Your application should be accessible at: https://${TAILSCALE_DOMAIN}"
  echo "   API Docs (Swagger): https://${TAILSCALE_DOMAIN}/swagger/"
else
  echo "   Your application is running, but TAILSCALE_DOMAIN was not found in $TAILSCALE_ENV_FILE."
  echo "   Access may be limited to your local network or Tailnet."
fi
echo ""