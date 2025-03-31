# Tailscale Deployment Guide

This document outlines the Tailscale deployment process for the TEA Techniques application, along with known issues and recommendations for improvements.

For standard deployment options, please refer to the [Deployment Guide](DEPLOYMENT.md).

## Current Deployment Architecture

The current setup uses Tailscale Funnel to expose the application to the internet:

1. **Docker Compose Stack**:
   - Frontend container (Next.js)
   - Backend container (Django)
   - PostgreSQL database container

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

### Database Configuration

The application now uses PostgreSQL consistently across all environments:

**Solution**: The deployment has been standardized to use PostgreSQL:
1. The database configuration is set in the Django settings
2. The `tailscale_setup` command configures PostgreSQL properly
3. Standard Django migrations are used to maintain schema consistency

This ensures consistent behavior across all deployment environments.

### Host Header Handling

**Problem**: Nginx proxy passes the original host header to Django, which can cause URL resolution issues.

**Solution**: The Nginx configuration explicitly sets the Host header to `localhost:8000` for all backend requests:

```nginx
proxy_set_header Host localhost:8000;
```

This ensures Django receives the expected host it's configured to use.

## Recommendations for Improvement

### 1. Database Management

**Current**: PostgreSQL is used across all environments, providing consistency.

**Recommended**: Further improvements for database management:

```yaml
# Current docker-compose.yml configuration
services:
  db:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=techniques
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
```

### 2. Migration Management

**Current**: Standard Django migrations are used consistently.

**Recommended**: Further enhance the migration strategy:

- Add migration testing to CI/CD pipeline
- Implement database versioning and rollback capability
- Create migration documentation for complex schema changes

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

## Related Documentation

- [Deployment Guide](DEPLOYMENT.md) - Standard deployment options
- [Development Workflow](DEVELOPMENT-WORKFLOW.md) - Local development setup
- [Model Architecture](MODEL-ARCHITECTURE.md) - Database considerations
- [Future Roadmap](FUTURE-ROADMAP.md) - Long-term architecture goals