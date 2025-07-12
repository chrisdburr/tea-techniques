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

## 🛠️ Development Setup

This project supports two development approaches:
1. **Docker-based development** (recommended for full-stack development)
2. **Local development** (faster for backend-only development)

### Option 1: Docker Development

> [!WARNING]
> These instructions assume you are using Docker and Docker Compose. They have been tested on MacOS and Linux. If you are using Windows, you may need to adjust some commands.

1.  **Prerequisites:** Ensure you have Docker and Docker Compose installed ([Docker Desktop](https://www.docker.com/products/docker-desktop/) is recommended).
2.  **Clone the repository:**
    ```bash
    git clone https://github.com/chrisdburr/tea-techniques.git
    cd tea-techniques
    ```
3.  **Setup Environment Variables:**
    ```bash
    cp .env.example .env
    ```
    - Review the `.env` file. For development, the default database credentials used by Docker Compose should work fine, but you can customize them if needed.
4.  **Build and Start Services:**
    ```bash
    # Use the development compose file
    docker-compose -f docker-compose.development.yml up -d --build
    ```
5.  **Access the Application:**
    - Frontend: http://localhost:3000
    - Backend API: http://localhost:8000/api/
    - Django Admin: http://localhost:8000/admin/ (Login with user: `admin`, password: `admin`)
6.  **Stopping the Services:**
    ```bash
    docker-compose -f docker-compose.development.yml down
    ```
7.  **Viewing Logs:**

    ```bash
    # View logs for all services
    docker-compose -f docker-compose.development.yml logs

    # View logs for a specific service (e.g., backend)
    docker-compose -f docker-compose.development.yml logs backend

    # Follow logs in real-time
    docker-compose -f docker-compose.development.yml logs -f backend
    ```

### Option 2: Local Development (Backend)

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
   
   The API will be available at http://localhost:8000/api/

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

The frontend will be available at http://localhost:3000

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
