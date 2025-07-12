# TEA Techniques

An interactive database for exploring techniques for evidencing claims about responsible AI design, development, and deployment. This repository has been designed to work in conjunction with the [Trustworthy and Ethical Assurance (TEA) platform](https://assuranceplatform.azurewebsites.net/) as a core plugin to enable practitioners to identify and implement appropriate assurance methods.

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

3. **Set up the backend**
   ```bash
   cd backend
   uv sync
   USE_SQLITE=True uv run python manage.py reset_and_import_techniques
   ```

4. **Run the backend with SQLite**
   ```bash
   USE_SQLITE=True uv run python manage.py runserver
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

### Using Docker (for production-like environment)

If you want to use the full Docker setup with PostgreSQL:

1. **Setup environment variable**
   ```bash
   cp .env.example .env
   ```

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
  - `backend/data`: CSV file with technique data

- **Frontend**: Next.js with TypeScript and Tailwind CSS
  - `frontend/src/app`: Next.js pages and routes
  - `frontend/src/components`: Reusable React components
  - `frontend/src/lib`: Utilities, types, and API clients

## Development Tips

1. **API Documentation**
   Access the API documentation at http://localhost:8000/swagger/ when the backend is running.

2. **Database Migrations**
   When changing models, create and apply migrations:
   ```bash
   cd backend
   USE_SQLITE=True uv run python manage.py makemigrations
   USE_SQLITE=True uv run python manage.py migrate
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
uv run pytest
```

## Key Features

- **Structured Documentation**: Each technique includes comprehensive information about its purpose, implementation details, and practical use cases.
- **Categorized Organization**: Techniques are organized by assurance goals, categories, and subcategories to help you find exactly what you need.
- **API Access**: Access all data through a comprehensive REST API with documentation via Swagger.
- **Model Agnostic & Specific**: Browse techniques that work across different model types or that are designed for specific model architectures.

## License

This project is licensed under the MIT License - see the LICENSE file for details.