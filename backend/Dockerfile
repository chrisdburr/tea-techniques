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
    poetry install --only main --no-interaction --no-ansi

# Copy project files
COPY . .

# Create a directory for scripts
RUN mkdir -p /app/scripts

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
    # Generate and load fixtures\n\
    python manage.py loaddata api/fixtures/assurance_goals.json\n\
    python manage.py loaddata api/fixtures/categories.json\n\
    python manage.py loaddata api/fixtures/sub_categories.json\n\
    cd scripts && python generate_techniques.py && cd ..\n\
    python manage.py loaddata api/fixtures/techniques.json || echo "Warning: Could not load techniques fixture"\n\
    \n\
    # Start server\n\
    python manage.py runserver 0.0.0.0:8000' > /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]