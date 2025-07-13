# TEA Techniques

![An illustration showing different techniques for assurance](https://alan-turing-institute.github.io/turing-commons/assets/images/illustrations/trust-yellow.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

An interactive database for exploring techniques for evidencing claims about responsible AI design, development, and deployment. This repository has been designed to work in conjunction with the [Trustworthy and Ethical Assurance (TEA) platform](https://assuranceplatform.azurewebsites.net/) as a core plugin to enable practitioners to identify and implement appropriate assurance methods.

## 🔧 Technology Stack

- **Backend**: Django 5.x with Django REST Framework
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Database**: PostgreSQL (production) / SQLite (development)
- **Package Management**: [uv](https://docs.astral.sh/uv/) for Python, pnpm for Node.js
- **Development**: Docker Compose for full-stack development
- **Testing**: pytest (backend), Vitest (frontend), Playwright (E2E)
- **Code Quality**: Ruff (linting/formatting), mypy (type checking)

## 🚀 Quick Start

Choose one of two deployment options:

### Option 1: Pull Pre-built Images (Recommended)

The fastest way to get started is using our pre-built Docker images from GitHub Container Registry.

1. **Prerequisites:** [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

2. **Download the deployment file:**

   ```bash
   curl -O https://raw.githubusercontent.com/chrisdburr/tea-techniques/main/docker-compose.ghcr.yml
   ```

3. **Start the application:**

   ```bash
   docker-compose -f docker-compose.ghcr.yml up -d
   ```

4. **Access the application:**
   - **Frontend:** <http://localhost:3000>
   - **Backend API:** <http://localhost:8000/api/>
   - **API Documentation:** <http://localhost:8000/swagger/>

The application includes a pre-populated database with techniques data and is ready to use immediately.

### Option 2: Build from Source

For development or customization, build the application from source:

1. **Clone and setup:**

   ```bash
   git clone https://github.com/chrisdburr/tea-techniques.git
   cd tea-techniques
   ```

2. **Start with automatic setup:**

   ```bash
   docker-compose -f docker-compose.development.yml up -d --build
   ```

This automatically:

- ✅ Builds all services from source
- ✅ Sets up the database with migrations
- ✅ Imports techniques data
- ✅ Starts all services

3. **Access the application:**
   - **Frontend:** <http://localhost:3000>  
   - **Backend API:** <http://localhost:8000/api/>
   - **Django Admin:** <http://localhost:8000/admin/> (admin/admin)

### 📋 Management Commands

```bash
# Stop services
docker-compose -f docker-compose.ghcr.yml down        # For pre-built images
docker-compose -f docker-compose.development.yml down  # For source build

# View logs
docker-compose -f docker-compose.ghcr.yml logs -f backend

# Update to latest images (Option 1)
docker-compose -f docker-compose.ghcr.yml pull && docker-compose -f docker-compose.ghcr.yml up -d
```

---

## 👨‍💻 Development

### Local Development (Backend)

For faster backend development, you can run the Django backend locally using [uv](https://docs.astral.sh/uv/), a modern Python package manager.

1. **Prerequisites:**
   - Python 3.12+
   - [uv](https://docs.astral.sh/uv/getting-started/installation/) installed
   - PostgreSQL (optional, SQLite is used by default for local development)

2. **Clone and setup:**

   ```bash
   git clone https://github.com/chrisdburr/tea-techniques.git
   cd tea-techniques/backend
   ```

3. **Install dependencies:**

   ```bash
   # Install all dependencies including dev tools
   uv sync
   ```

4. **Setup environment:**

   ```bash
   # Create environment file
   cp .env.example .env

   # Edit .env if needed (defaults work for local SQLite development)
   ```

5. **Initialize database:**

   ```bash
   # Run migrations
   uv run python manage.py migrate

   # Import sample data
   uv run python manage.py reset_and_import_techniques

   # Create superuser (optional)
   uv run python manage.py createsuperuser
   ```

6. **Run development server:**

   ```bash
   uv run python manage.py runserver
   ```

   The API will be available at <http://localhost:8000/api/>

7. **Run tests:**

   ```bash
   # Run all tests with coverage
   uv run pytest --cov=api

   # Run specific test file
   uv run pytest api/tests/test_models.py

   # Run linting
   uv run ruff check api/

   # Run type checking
   uv run mypy api/
   ```

### Frontend Development

For frontend development, use pnpm:

```bash
cd frontend
pnpm install
pnpm dev
```

The frontend will be available at <http://localhost:3000>

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
