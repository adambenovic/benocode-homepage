.PHONY: help dev prod down logs migrate seed shell-be shell-fe test-be test-fe clean setup

# Default target
help:
	@echo "BenoCode Homepage - Available commands:"
	@echo ""
	@echo "  Setup"
	@echo "    make setup       Copy example env files (run once on first clone)"
	@echo ""
	@echo "  Development"
	@echo "    make dev         Start development stack (hot-reload)"
	@echo "    make down        Stop all containers"
	@echo "    make logs        Follow logs from all services"
	@echo "    make logs-be     Follow backend logs"
	@echo "    make logs-fe     Follow frontend logs"
	@echo "    make migrate     Run DB migrations (dev)"
	@echo "    make seed        Seed the database"
	@echo "    make shell-be    Open shell in backend container"
	@echo "    make shell-fe    Open shell in frontend container"
	@echo ""
	@echo "  Testing"
	@echo "    make test-be     Run backend unit tests"
	@echo "    make test-fe     Run frontend unit tests"
	@echo ""
	@echo "  Production"
	@echo "    make prod        Build and start production stack"
	@echo "    make prod-down   Stop production stack"
	@echo "    make prod-logs   Follow production logs"
	@echo ""
	@echo "  Maintenance"
	@echo "    make clean       Remove containers, volumes, and built images"

# Copy example env files on first setup
setup:
	@[ -f .env ] || (cp .env.example .env && echo "Created .env from .env.example - please edit it")
	@[ -f backend/.env ] || (cp backend/.env.example backend/.env && echo "Created backend/.env - please edit it")
	@[ -f frontend/.env.local ] || (cp frontend/.env.example frontend/.env.local && echo "Created frontend/.env.local - please edit it")
	@echo "Setup complete. Edit the .env files then run: make dev"

# Development
dev:
	docker compose up -d
	@echo "Development stack started."
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:3001"

down:
	docker compose down

logs:
	docker compose logs -f

logs-be:
	docker compose logs -f backend

logs-fe:
	docker compose logs -f frontend

migrate:
	docker compose exec backend npx prisma migrate dev

seed:
	docker compose exec backend npm run prisma:seed

shell-be:
	docker compose exec backend sh

shell-fe:
	docker compose exec frontend sh

# Testing
test-be:
	docker compose exec backend npm test

test-fe:
	docker compose exec frontend npm test

# Production
prod:
	docker compose -f docker-compose.prod.yml up -d --build
	@echo "Production stack started."

prod-down:
	docker compose -f docker-compose.prod.yml down

prod-logs:
	docker compose -f docker-compose.prod.yml logs -f

# Maintenance
clean:
	docker compose down -v --rmi local
	docker compose -f docker-compose.prod.yml down -v --rmi local 2>/dev/null || true
