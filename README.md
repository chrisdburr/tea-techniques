# TEA Techniques

A platform for exploring techniques for evidencing claims about responsible design, development, and deployment of data-driven technologies. To be used in conjunction with the Trustworthy and Ethical Assurance (TEA) platform.

## Development Setup

### Quick Start (Recommended)

For local development, you can use SQLite which doesn't require Docker:

1. **Clone the repository**
   ```bash
   git clone https://github.com/chrisdburr/tea-techniques.git
   cd tea-techniques
   ```

2. **Setup environment variable**

  ```bash
  cp .env.example .env
  ```

  - Review and adjust the values (e.g. change user and password)

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
   - Admin: http://localhost:8000/admin/ (username: admin, password: admin)

### Using Docker (for production-like environment)

If you want to use the full Docker setup with PostgreSQL:

1. **Setup environment variable**

  ```bash
  cp .env.example .env
  ```

  - Review and adjust the values (e.g. change user and password)

2. **Start the database**

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
  - `backend/scripts`: Utility scripts

- **Frontend**: Next.js with TypeScript and Tailwind CSS
  - `frontend/src/app`: Next.js pages and routes
  - `frontend/src/components`: Reusable React components
  - `frontend/src/lib`: Utilities, types, and API clients

## Data Management

This project uses a CSV-based approach for managing technique data:

- The primary source of truth is the `techniques.csv` file in the `backend/data` directory
- All assurance goals, categories, and subcategories are derived from this CSV
- When running locally with SQLite, use `reset_and_import.py` to reload the database
- When deploying with Docker, the CSV is automatically imported on container startup

## Development Tips

1. **Local Development Mode**
   
   The setup script creates a SQLite database with sample data, making it easy to start development without Docker.

2. **Authentication**
   
   The development setup creates an admin user you can use to access the Django admin interface:
   - Username: `admin`
   - Password: `admin`

3. **API Documentation**
   
   Access the API documentation at http://localhost:8000/swagger/ when the backend is running.

4. **Database Migrations**
   
   When changing models, create and apply migrations:
   ```bash
   cd backend
   USE_SQLITE=True poetry run python manage.py makemigrations
   USE_SQLITE=True poetry run python manage.py migrate
   ```

## Testing

Run frontend tests:
```bash
cd frontend
npm test
```

Run backend tests:
```bash
cd backend
USE_SQLITE=True poetry run pytest
```

Run integration tests:
```bash
# Install dependencies if needed
pip install requests rich

# Run integration tests
python scripts/test_integration.py
```

## Key Features

- **Structured Documentation**: Each technique includes comprehensive information about its purpose, implementation details, and practical use cases.
- **Categorized Organization**: Techniques are organized by assurance goals, categories, and subcategories to help you find exactly what you need.
- **API Access**: Access all data through a comprehensive REST API with documentation via Swagger.
- **Model Agnostic & Specific**: Browse techniques that work across different model types or that are designed for specific model architectures.

## License

[Add license information]