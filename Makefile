.PHONY: help setup dev dev-backend dev-frontend types stop lint typecheck test build clean

# ── System-Wide Local Development ─────────────────────────────────────────────
# This Makefile orchestrates both backend (Supabase) and frontend (Vite + React).
#
# Dependency chain:
#   backend (supabase start) → types (supabase gen types) → frontend (npm run dev)
#
# Quick start:
#   make setup && make dev

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Setup ─────────────────────────────────────────────────────────────────────

setup: ## Install all dependencies and prepare .env
	@echo "=== Copying frontend .env ==="
	@test -f frontend/.env || cp frontend/.env.example frontend/.env
	@echo "=== Installing frontend dependencies ==="
	cd frontend && npm install
	@echo "=== Setup complete ==="
	@echo "Edit frontend/.env with your Supabase URL and anon key."

# ── Development ───────────────────────────────────────────────────────────────

dev-backend: ## Start Supabase local stack (Postgres, Auth, API, Studio)
	@echo "=== Starting Supabase local stack ==="
	cd backend && npx supabase start

dev-frontend: ## Start Vite dev server
	@echo "=== Starting Vite dev server ==="
	cd frontend && npm run dev

types: ## Generate database types from local Supabase (requires running backend)
	@echo "=== Generating database types ==="
	cd backend && npx supabase gen types typescript --local > ../frontend/src/api/database.types.ts
	@echo "Types written to frontend/src/api/database.types.ts"

dev: dev-backend types ## Start everything: backend → generate types → frontend
	@echo "=== Ensuring frontend dependencies ==="
	cd frontend && npm install
	@echo "=== Starting frontend ==="
	@$(MAKE) dev-frontend

# ── Stop ──────────────────────────────────────────────────────────────────────

stop: ## Stop Supabase local stack
	@echo "=== Stopping Supabase local stack ==="
	cd backend && npx supabase stop

# ── Quality ───────────────────────────────────────────────────────────────────

lint: ## Lint all components
	@echo "=== Linting frontend ==="
	cd frontend && npm run lint
	@echo "=== Linting backend migrations ==="
	cd backend && npx supabase db lint

typecheck: ## TypeScript type-check (no emit)
	@echo "=== Type-checking frontend ==="
	cd frontend && npm run typecheck

test: ## Run frontend tests
	@echo "=== Running frontend tests ==="
	cd frontend && npm run test

# ── Build ─────────────────────────────────────────────────────────────────────

build: types ## Production build: generate types → build frontend
	@echo "=== Ensuring frontend dependencies ==="
	cd frontend && npm install
	@echo "=== Building frontend for production ==="
	cd frontend && npm run build
	@echo "Build output: frontend/dist/"

# ── Clean ─────────────────────────────────────────────────────────────────────

clean: ## Remove build artifacts and node_modules
	@echo "=== Cleaning ==="
	rm -rf frontend/dist frontend/node_modules frontend/.env
	@echo "=== Clean complete ==="