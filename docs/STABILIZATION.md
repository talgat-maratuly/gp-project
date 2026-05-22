# GP Stabilization & Production

## Проверка flows (ручной smoke)

| Flow | Учётка | Endpoint |
|------|--------|----------|
| Client auth | client@gp.kz / password123 | POST `/api/auth/login` |
| Partner auth | partner@gp.kz / password123 | POST `/api/auth/login` |
| Admin auth | admin@gp.kz / password123 | POST `/api/auth/login` |
| Refresh token | mobile only | POST `/api/auth/mobile/refresh` |
| Logout | clear `gp-*-access-token` + refresh | client `api.logout()` |
| Service order | client JWT | POST `/api/orders` |
| Shop order | client JWT | POST `/api/orders` category SHOP |
| QR public | no auth | GET/POST `/api/qr/public/:code` |
| QR partner | partner JWT | GET/PATCH `/api/qr/partner/orders` |
| Admin data | admin JWT | GET `/api/admin/*` |

## Demo vs API

- По умолчанию **`VITE_GP_DEMO=false`** — фронты ходят в backend.
- Demo: `VITE_GP_DEMO=true` + demo hub (`npm run demo:hub`).
- LocalStorage **только UI**: cart, favorites, objects, profile draft (не заказы/каталог в API-режиме).

## Централизованные ошибки

`@gp/shared/api/errors` — `ApiError`, `getErrorMessage`, `isRetryableError`.

`@gp/shared/ui/AsyncState` — loading / error+retry / empty.

## Health

```bash
curl http://localhost:4000/health
curl http://localhost:4000/health/db
curl http://localhost:4000/health/ws
curl http://localhost:4000/health/full
```

## Backend logs

Nest Logger domains: `GP:AUTH`, `GP:ORDER`, `GP:PARTNER`, `GP:QR` (interceptor на HTTP).

## Prisma

- Индексы: Order, Product, QRServiceOrder (миграция `20260521230000_stability_indexes`).
- Cascade: User → profiles/tokens; OrderItem → Order; QRScanLog → QRCodeObject.
- Restrict: Order → Client (без onDelete) — удаление клиента с заказами заблокировано.

## Production

```bash
# Build all frontends + API
npm run build:prod

# Docker (API + Postgres)
docker compose -f deploy/docker-compose.prod.yml --env-file apps/api/.env.production up -d

# PM2 (API only, after build)
pm2 start deploy/ecosystem.config.cjs --env production
```

Nginx: `deploy/nginx/gp.conf`  
Env example: `apps/api/.env.production.example`

## Dev all apps

```bash
npm run dev:all
```

Порты: API 4000, Service/Market 5173, Partner 5174, Admin 5175.
