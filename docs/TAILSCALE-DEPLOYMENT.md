# Tailscale Deployment Guide

This document outlines the Tailscale deployment process for the TEA Techniques application, along with known issues and recommendations for improvements.

## Current Deployment Architecture

The current setup uses Tailscale Funnel to expose the application to the internet:

1. **Docker Compose Stack**:
   - Frontend container (Next.js)
   - Backend container (Django)
   - PostgreSQL database container (in local mode, SQLite is used instead)

2. **Nginx Configuration**:
   - Serves as a reverse proxy
   - Routes requests to the appropriate containers
   - Handles CORS and headers

3. **Tailscale Funnel**:
   - Exposes the Nginx server to the internet
   - Provides a secure public URL

## Deployment Process

To deploy the application with Tailscale:

1. Ensure Tailscale is installed and logged in on your server
2. Make sure Nginx is installed
3. Clone the repository
4. Run the deployment script:

```bash
./deploy-tailscale.sh
```

This script:
- Stops any existing containers
- Cleans up volumes for a fresh start
- Sets environment variables for proper routing
- Builds and starts the containers
- Initializes the database with sample data
- Updates Nginx configuration
- Sets up Tailscale funnel

## Known Issues and Solutions

### Database Schema Compatibility

The application uses SQLite in the Tailscale deployment but can experience issues with missing columns:

**Problem**: The `applicable_models` column may be missing, causing API errors with 500 responses.

**Current solution**: We added a custom management command `add_missing_columns.py` that:
1. Checks if the `applicable_models` column exists in the SQLite database
2. Adds it using a direct SQLite ALTER TABLE statement if missing
3. Verifies the column was added successfully

This command is run during the `tailscale_setup` process to ensure the database has the correct schema.

### Host Header Handling

**Problem**: Nginx proxy passes the original host header to Django, which can cause URL resolution issues.

**Solution**: The Nginx configuration explicitly sets the Host header to `localhost:8000` for all backend requests:

```nginx
proxy_set_header Host localhost:8000;
```

This ensures Django receives the expected host it's configured to use.

## Recommendations for Improvement

### 1. Container-based Database

**Current**: SQLite is used for Tailscale deployment, which requires special handling for schema changes.

**Recommended**: Use PostgreSQL consistently across all environments:

```yaml
# docker-compose.yml modification
services:
  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_USER=user
      - POSTGRES_DB=techniques
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d techniques"]
      interval: 5s
      timeout: 5s
      retries: 5
```

### 2. Migration Management

**Current**: Special commands are needed to handle schema discrepancies.

**Recommended**: Implement a more robust migration strategy:

- Use Django's built-in `makemigrations` and `migrate` commands consistently
- Add migration testing to CI/CD pipeline
- Create a dedicated setup script that properly handles both SQLite and PostgreSQL

### 3. Environment Configuration

**Current**: Environment variables are set directly in the deploy script.

**Recommended**: Use a more structured approach:

- Create separate `.env.production`, `.env.development`, and `.env.tailscale` files
- Use a tool like python-dotenv to manage these configurations
- Document all required environment variables

### 4. Automated Health Checks

**Current**: Manual verification of deployment.

**Recommended**: Add automated health checks:

- Implement a `/health` endpoint in the backend
- Configure Docker health checks for all services
- Set up external monitoring using a service like UptimeRobot

### 5. TLS/SSL Implementation

**Current**: Relies on Tailscale for secure connections.

**Recommended**: Add proper TLS/SSL for all environments:

- Add Let's Encrypt integration for Nginx
- Configure proper certificate renewal
- Ensure all traffic uses HTTPS

## Long-term Architecture Goals

For a production-ready deployment, consider:

1. **Kubernetes Deployment**:
   - Convert Docker Compose configuration to Kubernetes manifests
   - Use Helm charts for deployment
   - Implement proper resource limits and requests

2. **CI/CD Pipeline**:
   - Set up automated testing and deployment
   - Implement blue/green deployment strategy
   - Add automated database migrations

3. **Database Evolution**:
   - Implement a connection pooler like PgBouncer
   - Set up database backups and point-in-time recovery
   - Consider read replicas for scaling

4. **Monitoring and Logging**:
   - Add Prometheus metrics 
   - Implement centralized logging with ELK stack
   - Set up alerts for critical issues

By implementing these recommendations, the Tailscale deployment will become more robust, maintainable, and scalable for production use.