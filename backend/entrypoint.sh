#!/bin/bash
set -e

# Determine which settings module we're using
DEFAULT_SETTINGS="config.settings.docker"
SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-$DEFAULT_SETTINGS}
echo "Using settings module: $SETTINGS_MODULE"

# Check if we're using PostgreSQL (default) or SQLite
if [[ "$SETTINGS_MODULE" == *"sqlite"* ]]; then
    echo "Using SQLite database"
    
    # Ensure the db_data directory exists
    mkdir -p /app/db_data
else
    # Wait for PostgreSQL database
    echo "Checking PostgreSQL database connection..."
    max_retries=30
    retry_count=0

    while [ $retry_count -lt $max_retries ]; do
        if PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "\q" 2>/dev/null; then
            echo "✅ PostgreSQL is up - executing command"
            break
        fi
        
        retry_count=$((retry_count+1))
        echo "⏳ Waiting for PostgreSQL... (attempt $retry_count of $max_retries)"
        sleep 2
        
        if [ $retry_count -eq $max_retries ]; then
            echo "❌ Failed to connect to PostgreSQL after $max_retries attempts!"
            echo "⚠️  Continuing startup anyway, but application may fail!"
        fi
    done
fi

# Collect static files (no input in case it asks)
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Run migrations 
echo "Running migrations..."
python manage.py migrate --noinput

# Import techniques from JSON if file exists and database is empty
JSON_FILE="data/techniques.json"
if [ -f "$JSON_FILE" ]; then
    echo "Checking for existing techniques..."
    TECHNIQUE_COUNT=$(python -c "from api.models import Technique; print(Technique.objects.count())" 2>/dev/null || echo "0")
    
    if [ "$TECHNIQUE_COUNT" = "0" ]; then
        echo "No techniques found in database, importing from $JSON_FILE..."
        # Use the standard JSON import command
        python manage.py import_techniques --file="$JSON_FILE" || {
            echo "⚠️  Warning: Could not import techniques from JSON."
            echo "Please check the file format and the import script logs."
        }
    else
        echo "✅ Database already contains $TECHNIQUE_COUNT techniques, skipping import."
    fi
else
    echo "⚠️  No $JSON_FILE found, skipping technique import."
fi

# Set worker count based on environment variables or available cores
WORKERS=${GUNICORN_WORKERS:-2}
echo "Starting Gunicorn with $WORKERS workers..."

# Start server with Gunicorn
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers $WORKERS \
    --timeout 180 \
    --forwarded-allow-ips="*" \
    --access-logfile - \
    --error-logfile -