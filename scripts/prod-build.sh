#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "▶ GP production build"

export VITE_API_URL="${VITE_API_URL:-https://api.gp-service.kz/api}"
export VITE_GP_DEMO=false

npm run build:api
npm run build:service
npm run build:partner
npm run build:admin

echo "✓ Builds:"
echo "  apps/api/dist"
echo "  apps/gp-service/dist"
echo "  apps/gp-partner/dist"
echo "  apps/gp-admin/dist"
echo ""
echo "Deploy static folders to nginx (see deploy/nginx/gp.conf)"
echo "Start API: pm2 start deploy/ecosystem.config.cjs --env production"
