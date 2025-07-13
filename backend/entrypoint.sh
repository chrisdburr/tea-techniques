#!/bin/bash
set -e

# Run database initialization if this is the first startup
if [ ! -f "/app/.db-initialized" ]; then
    echo "🚀 First startup detected, initializing database..."
    /app/init-db.sh
    touch /app/.db-initialized
    echo "✅ Database initialization complete"
else
    echo "📊 Database already initialized, skipping init"
fi

# Collect static files (no input in case it asks)
echo "📁 Collecting static files..."
uv run python manage.py collectstatic --noinput

# If arguments are passed, execute them (for development override)
if [ $# -gt 0 ]; then
    echo "Executing command: $@"
    exec "$@"
fi

# Set worker count based on environment variables or available cores
WORKERS=${GUNICORN_WORKERS:-2}
echo "Starting Gunicorn with $WORKERS workers..."

# Start server with Gunicorn (production default)
exec uv run gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers $WORKERS \
    --timeout 180 \
    --forwarded-allow-ips="*" \
    --access-logfile - \
    --error-logfile -
