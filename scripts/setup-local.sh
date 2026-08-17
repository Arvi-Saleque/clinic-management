#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

if [[ ! -f .env.local ]]; then
  cp .env.local.example .env.local
  echo "Created .env.local. Add the three Supabase values before using live data."
fi

echo "Installing dependencies..."
npm install

echo "Running type validation..."
npm run typecheck

echo "Creating a production build..."
npm run build

echo "Setup complete. Run: npm run dev"
echo "Visual demo: http://localhost:3000/workspace-demo"
