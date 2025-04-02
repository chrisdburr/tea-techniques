FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    postgresql-client \
    curl \
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

# Copy entrypoint script and set permissions
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Set default settings module for Docker
ENV DJANGO_SETTINGS_MODULE=config.settings.docker

# Add health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=5 \
    CMD curl -f http://localhost:8000/api/health/ || exit 1

EXPOSE 8000

CMD ["/app/entrypoint.sh"]