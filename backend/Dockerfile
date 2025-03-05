FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY pyproject.toml poetry.lock ./
RUN pip install poetry && \
    poetry config virtualenvs.create false && \
    poetry install --only main --no-interaction --no-ansi && \
    pip install gunicorn && \
    pip install whitenoise

# Copy project files
COPY . .

# Create directories for scripts and static files
RUN mkdir -p /app/scripts /app/static /app/staticfiles

# Create the start script
RUN echo '#!/bin/bash\n\
    set -e\n\
    \n\
    # Wait for database\n\
    until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "\q" 2>/dev/null; do\n\
    echo "Waiting for PostgreSQL..."\n\
    sleep 1\n\
    done\n\
    \n\
    echo "PostgreSQL is up - executing command"\n\
    \n\
    # Run migrations\n\
    python manage.py migrate --noinput\n\
    \n\
    # Collect static files\n\
    python manage.py collectstatic --noinput\n\
    \n\
    # Import techniques from CSV\n\
    python manage.py import_techniques --file=data/techniques.csv || echo "Warning: Could not import techniques from CSV"\n\
    \n\
    # Start server with Gunicorn\n\
    gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2' > /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

CMD ["/app/entrypoint.sh"]