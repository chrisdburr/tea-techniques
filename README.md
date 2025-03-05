# TEA Techniques

![An illustration showing different techniques for assurance](https://alan-turing-institute.github.io/turing-commons/assets/images/illustrations/trust-yellow.png)

A platform for exploring techniques for evidencing claims about responsible design, development, and deployment of data-driven technologies. To be used in conjunction with the Trustworthy and Ethical Assurance (TEA) platform.

## Key Features

- **Structured Documentation**: Each technique includes comprehensive information about its purpose, implementation details, and practical use cases.
- **Categorized Organization**: Techniques are organized by assurance goals, categories, and subcategories to help you find exactly what you need.
- **API Access**: Access all data through a comprehensive REST API with documentation via Swagger.
- **Model Agnostic & Specific**: Browse techniques that work across different model types or that are designed for specific model architectures.

## Development Setup

> [!WARNING]
> These instructions have only been tested on MacOS and Linux. If you are using Windows, you may need to adjust some commands.

### Quick Start (Recommended)

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

> [!WARNING]
> You may want to review and adjust the values in the `.env` file (e.g. change user and password)

3. **Set up the backend**
   ```bash
   cd backend
   poetry install
   poetry run python scripts/reset_and_import.py
   ```

4. **Run the backend with SQLite**
   ```bash
   USE_SQLITE=True poetry run python manage.py runserver
   ```

5. **In a new terminal, set up and run the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev --turbopack
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:8000/api/
   - Django Admin: http://localhost:8000/admin/

### Using Docker

If you want to use the full Docker setup with PostgreSQL:

1. **Setup environment variable**

  ```bash
  cp .env.example .env
  ```

> [!WARNING]
> You may want to review and adjust the values in the `.env` file (e.g. change user and password)

2. **Start the application**

   ```bash
   docker compose up -d
   ```

3. **Access the application**

  - Frontend: http://localhost:3000
  - API: http://localhost:8000/api/

## Project Structure

- **Backend**: Django with Django REST Framework
  - `backend/api`: Main Django app
  - `backend/config`: Django project settings
  - `backend/scripts`: Utility scripts (e.g. reset DB, import CSV)
  - `backend/data`: CSV file with technique data

- **Frontend**: Next.js with TypeScript and Tailwind CSS
  - `frontend/src/app`: Next.js pages and routes
  - `frontend/src/components`: Reusable React components
  - `frontend/src/lib`: Utilities, types, and API clients

## Development Tips

1. **API Documentation**
   
   You can access the API documentation at http://localhost:8000/swagger/ when the backend is running.

2. **Additional Documentation**

   You can find additional documentation about the project's data management and testing in the following files:

   - [Data Management Guide](docs/DATA-MANAGEMENT.md)
   - [Testing Guide](docs/TESTING.md)
