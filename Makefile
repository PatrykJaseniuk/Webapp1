.PHONY: help setup dev stop lint typecheck test build clean

# ── System-Wide Local Development ─────────────────────────────────────────────
# This Makefile orchestrates both backend (Supabase) and frontend (Vite + React).
#
# Every dev/build action follows a pure functional pipeline:
#   1. supabase start      — fresh local Postgres + services
#   2. supabase db reset   — drop & rebuild DB entirely from migration files
#   3. supabase gen types  — derive database.types.ts from the schema above
#   4. npm run dev/build   — frontend
#   5. supabase stop       — cleanup, zero residual state
#
# No hidden state. No manual edits to generated files. Reproducible every time.
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
	(cd frontend && npm install)
	@echo "=== Setup complete ==="

# ── Development (full clean rebuild, cleanup on exit) ─────────────────────────

dev: ## Full pure rebuild: start → reset DB → gen types → frontend → cleanup
	@trap '$(MAKE) stop' INT TERM EXIT; \
	echo "=== Starting Supabase ==="; \
	(cd backend/supabase && npx supabase start); \
	echo "=== Resetting database (migrations + seed) ==="; \
	(cd backend/supabase && npx supabase db reset); \
	echo "=== Generating database types ==="; \
	(cd backend/supabase && npx supabase gen types typescript --local > ../../frontend/src/volatile1/infra/__generated__/database.types.ts); \
	echo "Types written to frontend/src/volatile1/infra/__generated__/database.types.ts"; \
	echo "=== Ensuring frontend dependencies ==="; \
	(cd frontend && npm install); \
	echo "=== Starting frontend ==="; \
	(cd frontend && npm run dev -- --open)

# ── Stop / Cleanup ────────────────────────────────────────────────────────────

stop: ## Stop Supabase and clean up all containers
	@echo "=== Stopping Supabase (cleanup) ==="
	-(cd backend/supabase && npx supabase stop)
	@echo "=== Cleanup complete ==="

# ── Quality ───────────────────────────────────────────────────────────────────

lint: ## Lint all components
	@echo "=== Linting frontend ==="
	(cd frontend && npm run lint)
	@echo "=== Linting backend migrations ==="
	(cd backend/supabase && npx supabase db lint)

typecheck: ## TypeScript type-check (no emit)
	@echo "=== Type-checking frontend ==="
	(cd frontend && npm run typecheck)

test: ## Run frontend tests
	@echo "=== Running frontend tests ==="
	(cd frontend && npm run test)

# ── Build (full clean rebuild → build → cleanup) ──────────────────────────────

build: setup stop ## Production build: reset DB → gen types → build → cleanup
	@trap '$(MAKE) stop' EXIT; \
	echo "=== Starting Supabase ==="; \
	(cd backend/supabase && npx supabase start); \
	echo "=== Resetting database (migrations + seed) ==="; \
	(cd backend/supabase && npx supabase db reset); \
	echo "=== Generating database types ==="; \
	(cd backend/supabase && npx supabase gen types typescript --local > ../../frontend/src/volatile1/infra/__generated__/database.types.ts); \
	echo "=== Building frontend for production ==="; \
	(cd frontend && npm run build); \
	echo "Build output: frontend/dist/"

# ── Clean ─────────────────────────────────────────────────────────────────────

clean: stop ## Remove all build artifacts and dependencies
	@echo "=== Cleaning ==="
	rm -rf frontend/dist frontend/node_modules frontend/.env
	@echo "=== Clean complete ==="