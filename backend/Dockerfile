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
    poetry install --only main --no-interaction --no-ansi

# Copy project files
COPY . .

# Create start script
RUN echo '#!/bin/sh\n\
python manage.py migrate --noinput\n\
python manage.py load_initial_data\n\
python manage.py runserver 0.0.0.0:8000' > /app/start.sh && \
    chmod +x /app/start.sh

CMD ["/app/start.sh"]