#!/usr/bin/env bash
# Умный запуск GP: не дублирует процессы, не даёт EADDRINUSE, открывает браузер если уже работает.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PID_DIR="$ROOT/.gp-pids"
mkdir -p "$PID_DIR"

API_PORT=4000
SERVICE_PORT=5173
PARTNER_PORT=5174

API_URL="http://localhost:${API_PORT}/health"
SERVICE_URL="http://localhost:${SERVICE_PORT}/"
PARTNER_URL="http://localhost:${PARTNER_PORT}/"

API_PID="$PID_DIR/api.pid"
SERVICE_PID="$PID_DIR/service.pid"
PARTNER_PID="$PID_DIR/partner.pid"

curl_ok() {
  curl -sf --max-time 3 "$1" >/dev/null 2>&1
}

pids_on_port() {
  lsof -ti:"$1" -sTCP:LISTEN 2>/dev/null || lsof -ti:"$1" 2>/dev/null || true
}

sync_pid_from_port() {
  local port="$1"
  local pid_file="$2"
  local pid
  pid="$(pids_on_port "$port" | head -1 | tr -d ' ')"
  if [ -n "$pid" ]; then
    echo "$pid" >"$pid_file"
  fi
}

kill_port() {
  local port="$1"
  local pids
  pids="$(pids_on_port "$port")"
  if [ -n "$pids" ]; then
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 0.6
  fi
}

pid_alive() {
  [ -n "${1:-}" ] && kill -0 "$1" 2>/dev/null
}

stop_pid_file() {
  local f="$1"
  if [ -f "$f" ]; then
    local pid
    pid="$(cat "$f" 2>/dev/null || true)"
    if pid_alive "$pid"; then
      kill "$pid" 2>/dev/null || true
      sleep 0.3
    fi
    rm -f "$f"
  fi
}

open_browser() {
  local url="$1"
  if command -v open >/dev/null 2>&1; then
    open "$url" >/dev/null 2>&1 || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" >/dev/null 2>&1 || true
  fi
}

wait_http() {
  local url="$1"
  local label="$2"
  local i
  for i in $(seq 1 60); do
    if curl_ok "$url"; then
      return 0
    fi
    sleep 1
  done
  echo "  ⚠ ${label}: процесс стартовал, но ${url} пока не отвечает (см. .gp-pids/${3}.log)"
  return 1
}

# $1=name $2=port $3=check_url $4=pid_file $5=log_name $6=start_cmd $7=open_in_browser(0|1)
ensure_service() {
  local name="$1"
  local port="$2"
  local check_url="$3"
  local pid_file="$4"
  local log_name="$5"
  local start_cmd="$6"
  local do_open="${7:-0}"

  if curl_ok "$check_url"; then
    echo "✓ ${name} уже запущен — ${check_url}"
    sync_pid_from_port "$port" "$pid_file"
    if [ "$do_open" = "1" ]; then
      open_browser "$check_url"
    fi
    return 0
  fi

  local port_pids
  port_pids="$(pids_on_port "$port")"
  if [ -n "$port_pids" ]; then
    echo "↻ ${name}: порт ${port} занят, но не отвечает — перезапуск…"
    kill_port "$port"
    stop_pid_file "$pid_file"
  elif [ -f "$pid_file" ]; then
    local saved_pid
    saved_pid="$(cat "$pid_file")"
    if pid_alive "$saved_pid"; then
      echo "↻ ${name}: старый PID ${saved_pid} без ответа — перезапуск…"
      kill "$saved_pid" 2>/dev/null || true
      sleep 0.3
    fi
    rm -f "$pid_file"
  fi

  echo "▶ Запуск ${name}…"
  (
    cd "$ROOT"
    # shellcheck disable=SC2091
    eval "$start_cmd"
  ) >>"$PID_DIR/${log_name}.log" 2>&1 &
  echo $! >"$pid_file"

  if wait_http "$check_url" "$name" "$log_name"; then
    echo "  ✓ ${name} готов — ${check_url}"
    if [ "$do_open" = "1" ]; then
      open_browser "$check_url"
    fi
  fi
  return 0
}

echo ""
echo "═══════════════════════════════════════"
echo "  GP — умный запуск (dev:smart)"
echo "═══════════════════════════════════════"
echo ""

ensure_service "GP API" "$API_PORT" "$API_URL" "$API_PID" "api" \
  "npm run dev:api" "0"

ensure_service "GP Service" "$SERVICE_PORT" "$SERVICE_URL" "$SERVICE_PID" "service" \
  "npm run dev:service" "1"

ensure_service "GP Partner" "$PARTNER_PORT" "$PARTNER_URL" "$PARTNER_PID" "partner" \
  "npm run dev:partner" "1"

echo ""
echo "───────────────────────────────────────"
echo "  API:     ${API_URL}"
echo "  Service: ${SERVICE_URL}"
echo "  Partner: ${PARTNER_URL}"
echo "  PID:     .gp-pids/"
echo "  Логи:    .gp-pids/*.log"
echo ""
echo "  Повторный запуск: npm run dev:smart  (без EADDRINUSE)"
echo "  Остановить всё:   npm run kill:ports"
echo "  Жёсткий сброс:    npm run kill:ports && npm run dev:smart"
echo "───────────────────────────────────────"
echo ""

exit 0
