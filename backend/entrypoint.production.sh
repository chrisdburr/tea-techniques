#!/bin/bash

set -e

echo "Starting TEA Techniques Backend (Production)"

# Wait for database to be ready
echo "Waiting for database..."
while ! pg_isready -h "${DATABASE_HOST:-db}" -p "${DATABASE_PORT:-5432}" -U "${DATABASE_USER:-postgres}" > /dev/null 2>&1; do
    echo "Database not ready, waiting..."
    sleep 2
done
echo "Database is ready!"

# Run database migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

# Create superuser if specified
if [ "$DJANGO_SUPERUSER_USERNAME" ] && [ "$DJANGO_SUPERUSER_PASSWORD" ] && [ "$DJANGO_SUPERUSER_EMAIL" ]; then
    echo "Creating superuser..."
    python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='$DJANGO_SUPERUSER_USERNAME').exists():
    User.objects.create_superuser('$DJANGO_SUPERUSER_USERNAME', '$DJANGO_SUPERUSER_EMAIL', '$DJANGO_SUPERUSER_PASSWORD')
    print('Superuser created successfully')
else:
    print('Superuser already exists')
"
fi

# Import techniques data if database is empty or if explicitly requested
TECHNIQUE_COUNT=$(python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
django.setup()
from api.models import Technique
print(Technique.objects.count())
" 2>/dev/null || echo "0")

if [ "$TECHNIQUE_COUNT" = "0" ] || [ "$IMPORT_TECHNIQUES" = "true" ]; then
    echo "Importing techniques data..."
    if [ -f "data/techniques.json" ]; then
        python manage.py import_techniques --file="data/techniques.json" --force
        echo "✅ Techniques imported successfully!"
    else
        echo "⚠️  Warning: No techniques.json file found!"
    fi
else
    echo "✅ Database already contains $TECHNIQUE_COUNT techniques"
fi

# Start Gunicorn
echo "Starting Gunicorn server..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers "${GUNICORN_WORKERS:-3}" \
    --worker-class "${GUNICORN_WORKER_CLASS:-sync}" \
    --worker-connections "${GUNICORN_WORKER_CONNECTIONS:-1000}" \
    --max-requests "${GUNICORN_MAX_REQUESTS:-1000}" \
    --max-requests-jitter "${GUNICORN_MAX_REQUESTS_JITTER:-100}" \
    --timeout "${GUNICORN_TIMEOUT:-30}" \
    --keep-alive "${GUNICORN_KEEPALIVE:-5}" \
    --log-level "${LOG_LEVEL:-info}" \
    --access-logfile - \
    --error-logfile - \
    --capture-output
