#!/usr/bin/env bash
# Проверка production API после деплоя
# Использование: ./scripts/verify-prod.sh https://gp-api.onrender.com

set -e
API="${1:-https://gp-api.onrender.com}"
API="${API%/}"

echo "=== GP API verify: $API ==="

echo -n "GET /health ... "
curl -sf "$API/health" | head -c 80
echo ""

echo -n "GET /products ... "
COUNT=$(curl -sf "$API/products" | grep -o '"id"' | wc -l | tr -d ' ')
echo "ok (~$COUNT products)"

echo -n "POST /auth/login (client) ... "
RES=$(curl -sf -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"client@gp.kz","password":"password123"}')
echo "ok (token received)"

TOKEN=$(echo "$RES" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then
  echo -n "GET /orders (auth) ... "
  curl -sf "$API/orders" -H "Authorization: Bearer $TOKEN" | head -c 60
  echo "..."
fi

echo "=== Done ==="
