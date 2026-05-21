#!/usr/bin/env bash
# Печатает URL для теста с телефона в локальной сети
set -e
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')
if [ -z "$IP" ]; then
  echo "Не удалось определить IP. Задайте VITE_API_URL вручную."
  exit 1
fi
echo "API:     http://${IP}:4000"
echo "Service: http://${IP}:5173"
echo "Partner: http://${IP}:5174"
echo ""
echo "Для .env.mobile.local:"
echo "VITE_API_URL=http://${IP}:4000"
