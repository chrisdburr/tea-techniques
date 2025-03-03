# TEA Techniques

A platform for exploring techniques for evidencing claims about responsible design, development, and deployment of data-driven technologies. To be used in conjunction with the Trustworthy and Ethical Assurance (TEA) platform.

## Development Setup

### Quick Start (Recommended)

For local development, you can use SQLite which doesn't require Docker:

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/tea-techniques.git
   cd tea-techniques
   ```

2. **Set up the backend**
   ```bash
   cd backend
   poetry install
   poetry run python scripts/setup_dev.py
   ```

3. **Run the backend with SQLite**
   ```bash
   USE_SQLITE=True poetry run python manage.py runserver
   ```

4. **In a new terminal, set up and run the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev --turbopack
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:8000/api/
   - Admin: http://localhost:8000/admin/ (username: admin, password: admin)

### Using Docker (for production-like environment)

If you want to use the full Docker setup with PostgreSQL:

1. **Setup environment variable**

  ```bash
  mv .env.example .env
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