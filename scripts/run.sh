#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
SUPABASE_DIR="$SCRIPT_DIR/database/supabase"

# --- Color helpers ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

# --- Check prerequisites ---
info "Checking prerequisites..."

if ! command -v npx &>/dev/null; then
  error "'npx' (Node.js) not found. Install Node.js first."
  exit 1
fi
info "  npx: $(npx --version 2>/dev/null || echo 'ok')"

if ! command -v node &>/dev/null || ! command -v npm &>/dev/null; then
  error "Node.js and npm not found."
  exit 1
fi
info "  node: $(node --version)"
info "  npm:  $(npm --version)"

# --- Ensure frontend .env.local ---
ENV_LOCAL="$FRONTEND_DIR/.env.local"
if [ ! -f "$ENV_LOCAL" ]; then
  info "Creating $ENV_LOCAL from template..."
  cp "$FRONTEND_DIR/.env.example" "$ENV_LOCAL" 2>/dev/null || \
  cat > "$ENV_LOCAL" <<'EOF'
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
NEXT_PUBLIC_BASE_PATH=
EOF
  info "  Edit $ENV_LOCAL if you need custom values."
else
  info "  $ENV_LOCAL already exists."
fi

# --- Start Supabase ---
info "Starting Supabase backend..."
cd "$SUPABASE_DIR"
npx supabase@latest start 2>&1
info "Supabase backend is running."

# --- Install & start frontend ---
info "Setting up frontend..."
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
  info "Installing npm dependencies..."
  npm install
else
  info "Dependencies already installed."
fi

info ""
info "=========================================="
info "  Starting Next.js dev server (port 3000)"
info "  Supabase Studio: http://127.0.0.1:54323"
info "  Supabase API:    http://127.0.0.1:54321"
info "=========================================="
info ""

# Trap SIGINT / SIGTERM so Supabase stops cleanly
cleanup() {
  info ""
  info "Shutting down Supabase backend..."
  cd "$SUPABASE_DIR"
  npx supabase@latest stop 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

npm run dev