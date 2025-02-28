# backend/Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY pyproject.toml poetry.lock ./
RUN pip install poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-dev --no-interaction --no-ansi

# Copy project files
COPY . .

# Run migrations and load initial data
CMD ["sh", "-c", "python manage.py migrate && python manage.py loaddata api/fixtures/*.json && python manage.py runserver 0.0.0.0:8000"]