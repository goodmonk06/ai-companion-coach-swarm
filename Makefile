.PHONY: help install dev build start test lint format clean db-up db-down db-reset db-seed docker-build docker-up docker-down

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm install

dev: ## Start development server
	npm run dev

build: ## Build the application
	npm run build

start: ## Start production server
	npm start

test: ## Run tests
	npm test

test-coverage: ## Run tests with coverage
	npm run test:coverage

lint: ## Lint code
	npm run lint

format: ## Format code
	npm run format

clean: ## Clean build artifacts
	rm -rf dist node_modules coverage

# Database commands
db-up: ## Start PostgreSQL with Docker
	docker-compose -f docker-compose.dev.yml up -d

db-down: ## Stop PostgreSQL
	docker-compose -f docker-compose.dev.yml down

db-reset: ## Reset database (WARNING: destroys all data)
	npm run db:push -- --force-reset

db-migrate: ## Run database migrations
	npm run db:migrate

db-seed: ## Seed database with initial data
	npm run db:seed

db-studio: ## Open Prisma Studio
	npm run db:studio

# Docker commands
docker-build: ## Build Docker images
	docker-compose build

docker-up: ## Start all services with Docker
	docker-compose up -d

docker-down: ## Stop all Docker services
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

# Setup commands
setup: install db-up db-migrate db-seed ## Complete setup (install, db, migrate, seed)
	@echo "✅ Setup complete! Run 'make dev' to start the server."

# Quick start
quick-start: db-up ## Quick start for development
	@echo "⏳ Waiting for database..."
	@sleep 3
	npm run db:push
	npm run db:seed
	npm run dev
