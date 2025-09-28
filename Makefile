SHELL := /bin/bash
COMPOSE ?= docker compose

BASE_COMPOSE := $(COMPOSE) -f docker-compose.yml
DEV_COMPOSE := $(BASE_COMPOSE) -f docker-compose.dev.yml
PROD_COMPOSE := $(BASE_COMPOSE) -f docker-compose.prod.yml --profile production
COMPOSE_CMD ?= $(BASE_COMPOSE)

.PHONY: help up up-dev up-prod build-frontend migrate collectstatic ps logs logs-backend logs-frontend logs-db restart restart-backend restart-frontend stop down down-v validate load-test createsuperuser shell-backend shell-frontend e2e

help: ## Show available targets
	@echo "Available targets:" && \
	awk 'BEGIN {FS = ":.*##"}; /^[a-zA-Z0-9_-]+:.*##/ {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST) | sort

# Default shortcut
up: up-dev ## Start dev stack (React + Django)

up-dev: ## Start dev stack (React + Django) with build and migrations
	$(DEV_COMPOSE) up -d --build
	$(MAKE) migrate COMPOSE_CMD="$(DEV_COMPOSE)"
	@echo "\nDev URLs:" && \
	echo "  Frontend: http://localhost:3000" && \
	echo "  API:      http://localhost:8000/api/v1"

up-prod: ## Start production-like stack (Nginx + Django). Requires built frontend
	$(MAKE) build-frontend
	$(PROD_COMPOSE) up -d --build
	$(MAKE) migrate COMPOSE_CMD="$(PROD_COMPOSE)"
	@echo "\nProd URL: http://localhost"

build-frontend: ## Build frontend (Vite)
	cd frontend && npm ci && npm run build

migrate: ## Apply Django migrations
	$(COMPOSE_CMD) exec backend python manage.py migrate --noinput

collectstatic: ## Collect static files (Docker settings)
	$(COMPOSE_CMD) exec backend python manage.py collectstatic --noinput

createsuperuser: ## Create Django superuser (interactive)
	$(COMPOSE_CMD) exec backend python manage.py createsuperuser

ps: ## Show compose services status
	$(COMPOSE_CMD) ps

logs: ## Tail logs of all services
	$(COMPOSE_CMD) logs -f

logs-backend: ## Tail backend logs
	$(COMPOSE_CMD) logs -f backend

logs-frontend: ## Tail frontend logs
	$(DEV_COMPOSE) logs -f frontend

logs-db: ## Tail database logs
	$(COMPOSE) logs -f db

restart: ## Restart all services
	$(COMPOSE_CMD) restart

restart-backend: ## Restart backend service
	$(COMPOSE_CMD) restart backend

restart-frontend: ## Restart frontend service
	$(DEV_COMPOSE) restart frontend

shell-backend: ## Open a shell in backend container
	$(COMPOSE_CMD) exec backend sh

shell-frontend: ## Open a shell in frontend container
	$(DEV_COMPOSE) exec frontend sh

down: ## Stop services (keep volumes)
	$(COMPOSE_CMD) down

down-v: ## Stop services and remove volumes (DANGER: removes DB data)
	$(COMPOSE_CMD) down -v

validate: ## Run performance, accessibility, bundle and cross-browser validations
	@echo "Running validation scripts (ensure dev deps are installed: lighthouse, playwright, @axe-core/playwright, gzip-size)" && \
	node validation-runner.js

load-test: ## Run k6 load test (requires k6). BASE_URL can be overridden: make load-test BASE_URL=http://localhost
	@BASE_URL=$${BASE_URL:-http://localhost} ; \
	echo "Running k6 against $$BASE_URL" ; \
	k6 run --vus 100 --duration 1m load-tests/k6-load-test.js || { echo "Install k6: https://k6.io/docs/get-started/installation/" ; exit 1; }

# Blue-Green deployment helpers
.PHONY: bg-deploy bg-switch bg-validate

bg-deploy: ## Build and deploy using blue-green strategy (switch to target env)
	bash scripts/deploy.sh

bg-validate: ## Run post-deploy validation against load balancer
	bash scripts/post-deploy-validation.sh http://localhost

e2e: ## E2E tests disabled (removed from pipeline). This target is a no-op.
	@echo "E2E tests are disabled for this project (pipeline and local)."
