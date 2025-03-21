# TEA Techniques

![An illustration showing different techniques for assurance](https://alan-turing-institute.github.io/turing-commons/assets/images/illustrations/trust-yellow.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://www.python.org/downloads/)
[![Django](https://img.shields.io/badge/Django-5.1-green)](https://www.djangoproject.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.2-black)](https://nextjs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

An interactive database for exploring techniques for evidencing claims about responsible AI design, development, and deployment. This repository has been designed to work in conjunction with the [Trustworthy and Ethical Assurance (TEA) platform](https://assuranceplatform.azurewebsites.net/) as a core plugin to enable practitioners to identify and implement appropriate assurance methods.

## 🚀 Key Features

- **📚 Structured Documentation**: Each technique includes comprehensive information about its purpose, implementation details, and practical use cases.
- **🗂️ Categorized Organization**: Techniques are organized by assurance goals, categories, and subcategories to help you find exactly what you need.
- **🔌 API Access**: Access all data through a comprehensive REST API with documentation via Swagger.
- **🧩 Model Agnostic & Specific**: Browse techniques that work across different model types or that are designed for specific model architectures.

## 🛠️ Development Setup

> [!WARNING]
> These instructions have only been tested on MacOS and Linux. If you are using Windows, you may need to adjust some commands.

<details>
<summary>🪧 Prerequisites </summary>

This project uses Poetry for Python dependency management. If you don't have Poetry installed:

```bash
# On Linux, macOS, Windows (WSL)
curl -sSL https://install.python-poetry.org | python3 -

# On Windows (PowerShell)
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -
```
</details>

<details>
<summary>📦 SQLite Setup (Quick Start for Development)</summary>

For local development, we use SQLite as the database backend. This setup is quick and easy to get started but is not suitable for production use:

1. **Clone the repository**
   ```bash
   git clone https://github.com/chrisdburr/tea-techniques.git
   cd tea-techniques
   ```

2. **Setup environment variable**

  ```bash
  cp .env.example .env
  ```

  - You may want to review and adjust the values in the `.env` file (e.g. change user and password)

3. **Set up the backend**
   ```bash
   cd backend
   poetry install
   USE_SQLITE=True python manage.py reset_and_import_techniques
   ```

4. **Run the backend with SQLite**
   ```bash
   USE_SQLITE=True poetry run python manage.py runserver
   ```

5. **In a new terminal, set up and run the frontend**
   ```bash
   cd frontend
   pnpm install
   pnpm run dev --turbopack
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:8000/api/
   - Django Admin: http://localhost:8000/admin/

</details>

<details>
<summary>🐳 Docker Setup (Production-like Environment)</summary>

If you want to use the full Docker setup with PostgreSQL:

1. **Setup environment variable**

  ```bash
  cp .env.example .env
  ```

  - You may want to review and adjust the values in the `.env` file (e.g. change user and password)

2. **Start the application**

   ```bash
   docker compose up -d
   ```

3. **Access the application**

  - Frontend: http://localhost:3000
  - API: http://localhost:8000/api/

</details>

## 📦 Project Structure

- **Backend**: Django with Django REST Framework
  - `backend/api`: Main Django app
  - `backend/config`: Django project settings
  - `backend/scripts`: Utility scripts (e.g. reset DB, import CSV)
  - `backend/data`: CSV file with technique data

- **Frontend**: Next.js with TypeScript and Tailwind CSS
  - `frontend/src/app`: Next.js pages and routes
  - `frontend/src/components`: Reusable React components
  - `frontend/src/lib`: Utilities, types, and API clients

## 💡 Development Tips

1. **API Documentation**
   
   You can access the API documentation at http://localhost:8000/swagger/ when the backend is running.

2. **Additional Documentation**

   You can find additional documentation about the project's data management and testing in the following files:

   - [Data Management Guide](docs/DATA-MANAGEMENT.md)
   - [Testing Guide](docs/TESTING.md)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
