# TEA Techniques - Quality Assurance Commands
# Run quality checks, tests, and development tasks

.PHONY: help install quality-check test clean setup-dev

# Default target
help: ## Show this help message
	@echo "TEA Techniques - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Examples:"
	@echo "  make setup-dev     # Set up development environment"
	@echo "  make quality-check # Run all quality checks"
	@echo "  make test          # Run all tests"
	@echo "  make deploy-check  # Pre-deployment verification"

## Development Setup
setup-dev: ## Set up development environment (install dependencies, hooks)
	@echo "🔧 Setting up development environment..."
	@echo "Installing pre-commit hooks..."
	pre-commit install
	@echo "Installing backend dependencies..."
	cd backend && poetry install --with dev
	@echo "Installing frontend dependencies..."
	cd frontend && pnpm install
	@echo "✅ Development environment ready!"

install: setup-dev ## Alias for setup-dev

## Quality Checks
quality-check: backend-quality frontend-quality ## Run all quality checks
	@echo "✅ All quality checks passed!"

backend-quality: ## Run backend quality checks (type, lint, format, security)
	@echo "🔍 Running backend quality checks..."
	cd backend && poetry run mypy api/
	cd backend && poetry run pylint api/
	cd backend && poetry run black --check api/
	cd backend && poetry run isort --check-only api/
	cd backend && poetry run bandit -r api/ -x "*/tests/*,*/migrations/*"
	@echo "✅ Backend quality checks passed!"

frontend-quality: ## Run frontend quality checks (type, lint, format)
	@echo "🔍 Running frontend quality checks..."
	cd frontend && pnpm type-check
	cd frontend && pnpm lint
	cd frontend && pnpm prettier --check .
	@echo "✅ Frontend quality checks passed!"

## Testing
test: backend-test frontend-test ## Run all tests
	@echo "✅ All tests passed!"

backend-test: ## Run backend tests with coverage
	@echo "🧪 Running backend tests..."
	cd backend && poetry run pytest --cov=api --cov-report=term-missing --cov-fail-under=90
	@echo "✅ Backend tests passed!"

frontend-test: ## Run frontend tests with coverage
	@echo "🧪 Running frontend tests..."
	cd frontend && pnpm test:coverage
	@echo "✅ Frontend tests passed!"

backend-test-fast: ## Run backend tests without coverage (faster)
	@echo "🧪 Running backend tests (fast)..."
	cd backend && poetry run pytest -x

frontend-test-fast: ## Run frontend tests without coverage (faster)
	@echo "🧪 Running frontend tests (fast)..."
	cd frontend && pnpm test

## Code Formatting
format: backend-format frontend-format ## Format all code
	@echo "✅ Code formatting complete!"

backend-format: ## Format backend code (black, isort)
	@echo "🎨 Formatting backend code..."
	cd backend && poetry run black api/
	cd backend && poetry run isort api/

frontend-format: ## Format frontend code (prettier)
	@echo "🎨 Formatting frontend code..."
	cd frontend && pnpm prettier --write .

## Security
security-check: ## Run security scans
	@echo "🔒 Running security checks..."
	cd backend && poetry run bandit -r api/ -x "*/tests/*,*/migrations/*"
	cd frontend && pnpm audit --audit-level moderate
	@echo "✅ Security checks passed!"

## Performance
performance-check: ## Run performance tests and benchmarks
	@echo "⚡ Running performance checks..."
	cd backend && poetry run pytest -m performance
	cd frontend && pnpm test:performance
	@echo "✅ Performance checks passed!"

## Database
db-reset: ## Reset database and import test data
	@echo "🗄️ Resetting database..."
	docker-compose -f docker-compose.development.yml exec backend python manage.py reset_and_import_techniques
	@echo "✅ Database reset complete!"

db-migrate: ## Run database migrations
	@echo "🗄️ Running database migrations..."
	docker-compose -f docker-compose.development.yml exec backend python manage.py migrate
	@echo "✅ Database migrations complete!"

## Development
dev-start: ## Start development servers
	@echo "🚀 Starting development environment..."
	docker-compose -f docker-compose.development.yml up -d --build
	@echo "✅ Development servers started!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:8000"
	@echo "API Docs: http://localhost:8000/swagger/"

dev-stop: ## Stop development servers
	@echo "🛑 Stopping development environment..."
	docker-compose -f docker-compose.development.yml down

dev-logs: ## Show development server logs
	docker-compose -f docker-compose.development.yml logs -f

## Deployment Preparation
deploy-check: quality-check test security-check ## Pre-deployment verification
	@echo "🚀 Running deployment readiness checks..."
	@echo "Checking for uncommitted changes..."
	@if [ -n "$$(git status --porcelain)" ]; then echo "❌ Uncommitted changes found!"; exit 1; fi
	@echo "Checking current branch..."
	@if [ "$$(git branch --show-current)" != "main" ]; then echo "❌ Not on main branch!"; exit 1; fi
	@echo "Verifying production build..."
	cd frontend && pnpm build
	@echo "✅ Deployment readiness verified!"

## Cleanup
clean: ## Clean up build artifacts and caches
	@echo "🧹 Cleaning up..."
	rm -rf backend/coverage_html/
	rm -rf backend/.coverage
	rm -rf backend/coverage.xml
	rm -rf frontend/coverage/
	rm -rf frontend/.next/
	rm -rf frontend/dist/
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "node_modules" -path "./frontend/*" -exec rm -rf {} + 2>/dev/null || true
	@echo "✅ Cleanup complete!"

## Documentation
docs-serve: ## Serve documentation locally
	@echo "📚 Starting documentation server..."
	@echo "Quality Standards: file://$(PWD)/QUALITY_STANDARDS.md"
	@echo "Testing Plan: file://$(PWD)/TESTING_CI_PLAN.md"
	@echo "API Documentation: http://localhost:8000/swagger/"

## Continuous Integration
ci-setup: ## Set up CI environment
	@echo "⚙️ Setting up CI environment..."
	pip install pre-commit
	pre-commit install-hooks

ci-quality: ## Run CI quality checks (faster, no interactive features)
	@echo "🔍 Running CI quality checks..."
	cd backend && python -m mypy api/
	cd backend && python -m pylint api/
	cd backend && python -m black --check api/
	cd backend && python -m isort --check-only api/
	cd frontend && npm run type-check
	cd frontend && npm run lint

ci-test: ## Run CI tests (with XML reporting)
	@echo "🧪 Running CI tests..."
	cd backend && python -m pytest --cov=api --cov-report=xml --cov-fail-under=90
	cd frontend && npm run test:ci

## Git Hooks
hooks-install: ## Install git hooks
	pre-commit install
	@echo "✅ Git hooks installed!"

hooks-run: ## Run git hooks on all files
	pre-commit run --all-files

hooks-update: ## Update git hooks
	pre-commit autoupdate

## Help for Docker Commands
docker-help: ## Show Docker-specific commands
	@echo "🐳 Docker Development Commands:"
	@echo ""
	@echo "  make dev-start     # Start all services"
	@echo "  make dev-stop      # Stop all services"  
	@echo "  make dev-logs      # View service logs"
	@echo "  make db-reset      # Reset database with test data"
	@echo "  make db-migrate    # Run database migrations"
	@echo ""
	@echo "Direct Docker commands:"
	@echo "  docker-compose -f docker-compose.development.yml exec backend bash"
	@echo "  docker-compose -f docker-compose.development.yml exec frontend bash"

## Project Status
status: ## Show project status and health
	@echo "📊 TEA Techniques Project Status:"
	@echo ""
	@echo "Git Status:"
	@git status --short
	@echo ""
	@echo "Last 5 commits:"
	@git log --oneline -5
	@echo ""
	@echo "Development Environment:"
	@if docker-compose -f docker-compose.development.yml ps | grep -q "Up"; then echo "  ✅ Docker services running"; else echo "  ❌ Docker services not running"; fi
	@if [ -f backend/poetry.lock ]; then echo "  ✅ Backend dependencies installed"; else echo "  ❌ Backend dependencies not installed"; fi
	@if [ -f frontend/pnpm-lock.yaml ]; then echo "  ✅ Frontend dependencies installed"; else echo "  ❌ Frontend dependencies not installed"; fi
	@if [ -f .git/hooks/pre-commit ]; then echo "  ✅ Pre-commit hooks installed"; else echo "  ❌ Pre-commit hooks not installed"; fi