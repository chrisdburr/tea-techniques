#!/bin/bash
set -e

# Wait for database
echo "Checking database connection..."
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

# Collect static files (no input in case it asks)
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Run migrations 
echo "Running migrations..."
python manage.py migrate --noinput

# Import techniques from CSV if file exists
if [ -f "data/techniques.csv" ]; then
    echo "Importing techniques from CSV..."
    python manage.py import_techniques --file=data/techniques.csv || {
        echo "⚠️  Warning: Could not import techniques from CSV"
    }
else
    echo "⚠️  No techniques.csv found, skipping import"
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