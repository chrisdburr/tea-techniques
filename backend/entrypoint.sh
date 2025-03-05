#!/bin/bash
set -e

# Wait for database
until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "\q" 2>/dev/null; do
    echo "Waiting for PostgreSQL..."
    sleep 1
done

echo "PostgreSQL is up - executing command"

# Run migrations
python manage.py migrate --noinput

# Collect static files
python manage.py collectstatic --noinput

# Import techniques from CSV
python manage.py import_techniques --file=data/techniques.csv || echo "Warning: Could not import techniques from CSV"

# Start server with Gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2