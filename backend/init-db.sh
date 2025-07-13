#!/bin/bash
set -e

echo "🔄 Initializing database..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
while ! uv run python -c "
import os
import django
from django.db import connections
from django.db.utils import OperationalError

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.docker')
django.setup()

try:
    db_conn = connections['default']
    db_conn.cursor()
    print('✅ PostgreSQL is ready!')
except OperationalError:
    print('⏳ PostgreSQL not ready yet...')
    exit(1)
"; do
    sleep 2
done

# Run migrations
echo "🔄 Running migrations..."
uv run python manage.py migrate --noinput

# Import techniques if database is empty
echo "🔄 Checking for existing techniques..."
TECHNIQUE_COUNT=$(uv run python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.docker')
django.setup()
from api.models import Technique
print(Technique.objects.count())
" 2>/dev/null || echo "0")

if [ "$TECHNIQUE_COUNT" = "0" ]; then
    echo "📦 No techniques found, importing from JSON..."
    if [ -f "data/techniques.json" ]; then
        uv run python manage.py import_techniques --file="data/techniques.json" --force
        echo "✅ Techniques imported successfully!"
    else
        echo "⚠️  Warning: No techniques.json file found!"
    fi
else
    echo "✅ Database already contains $TECHNIQUE_COUNT techniques"
fi

echo "🎉 Database initialization complete!"
