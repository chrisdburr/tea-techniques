# TEA Techniques

![An illustration showing different techniques for assurance](https://alan-turing-institute.github.io/turing-commons/assets/images/illustrations/trust-yellow.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://www.python.org/downloads/)
[![Django](https://img.shields.io/badge/Django-5.1-green)](https://www.djangoproject.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.2-black)](https://nextjs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

An interactive database for exploring techniques for evidencing claims about responsible AI design, development, and deployment. This repository has been designed to work in conjunction with the [Trustworthy and Ethical Assurance (TEA) platform](https://assuranceplatform.azurewebsites.net/) as a core plugin to enable practitioners to identify and implement appropriate assurance methods.

## 🚀 Key Features

-   **📚 Structured Documentation**: Each technique includes comprehensive information about its purpose, implementation details, and practical use cases.
-   **🗂️ Categorized Organization**: Techniques are organized by assurance goals, categories, and subcategories to help you find exactly what you need.
-   **🔌 API Access**: Access all data through a comprehensive REST API with documentation via Swagger.
-   **🧩 Model Agnostic & Specific**: Browse techniques that work across different model types or that are designed for specific model architectures.

## 🛠️ Development Setup

> [!WARNING]
> These instructions assume you are using Docker and Docker Compose. They have been tested on MacOS and Linux. If you are using Windows, you may need to adjust some commands.

<details>
<summary>🐳 Docker Development Setup</summary>

This is the standard way to set up the development environment using Docker Compose, which manages the necessary services (PostgreSQL, Backend, Frontend).

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
    -   Review the `.env` file. For development, the default database credentials used by Docker Compose should work fine, but you can customize them if needed.
4.  **Build and Start Services:**
    ```bash
    # Use the development compose file
    docker-compose -f docker-compose.development.yml up -d --build
    ```
    -   This command builds the images (if they don't exist or need updating) and starts the `db`, `backend`, and `frontend` services in detached mode.
5.  **Initialize the Database:**
    ```bash
    # Run migrations and import initial data inside the backend container
    docker-compose -f docker-compose.development.yml exec backend python manage.py reset_and_import_techniques
    ```
    -   This step is crucial! It sets up the database schema and populates it with the necessary techniques data. You only need to run this once after the initial setup, or if you need to reset the development database.
6.  **Access the Application:**
    -   Frontend: http://localhost:3000
    -   Backend API: http://localhost:8000/api/
    -   Django Admin: http://localhost:8000/admin/ (Login with user: `admin`, password: `admin`)
7.  **Stopping the Services:**
    ```bash
    docker-compose -f docker-compose.development.yml down
    ```
8.  **Viewing Logs:**

    ```bash
    # View logs for all services
    docker-compose -f docker-compose.development.yml logs

    # View logs for a specific service (e.g., backend)
    docker-compose -f docker-compose.development.yml logs backend

    # Follow logs in real-time
    docker-compose -f docker-compose.development.yml logs -f backend
    ```

</details>

## 📦 Project Structure

-   **Backend**: Django with Django REST Framework

    -   `backend/api`: Main Django app
    -   `backend/config`: Django project settings
    -   `backend/scripts`: Utility scripts (e.g. reset DB, import CSV)
    -   `backend/data`: CSV file with technique data

-   **Frontend**: Next.js with TypeScript and Tailwind CSS
    -   `frontend/src/app`: Next.js pages and routes
    -   `frontend/src/components`: Reusable React components
    -   `frontend/src/lib`: Utilities, types, and API clients

## 💡 Development Tips

1. **API Documentation**

    You can access the API documentation at http://localhost:8000/swagger/ when the backend is running.

2. **Documentation**

    Comprehensive documentation is available to help you understand and contribute to the project:

    ### Core Guides

    - [Data Management Guide](docs/DATA-MANAGEMENT.md) - How to manage and import technique data
    - [Testing Guide](docs/TESTING.md) - Information on testing both frontend and backend
    - [Deployment Guide](docs/DEPLOYMENT.md) - How to deploy the application
    - [Tailscale Deployment Guide](docs/TAILSCALE-DEPLOYMENT.md) - Specialized deployment with Tailscale

    ### User Documentation

    - [User Guide](docs/USER-GUIDE.md) - End-user help for using the application
    - [Glossary](docs/GLOSSARY.md) - Terminology used in the application

    ### Developer Documentation

    - [API Guide](docs/API-GUIDE.md) - API endpoints and usage
    - [Model Architecture](docs/MODEL-ARCHITECTURE.md) - Data model details
    - [Frontend Guide](docs/FRONTEND-GUIDE.md) - Frontend architecture and components
    - [Development Workflow](docs/DEVELOPMENT-WORKFLOW.md) - Recommended development practices
    - [Contributing Guide](docs/CONTRIBUTING.md) - How to contribute to the project
    - [Future Roadmap](docs/FUTURE-ROADMAP.md) - Planned improvements

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
