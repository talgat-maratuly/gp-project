# GP — стабильный запуск (Service + Partner + API)

Архитектура и порты **не меняются**:

| Сервис | Порт | URL |
|--------|------|-----|
| GP API | 4000 | http://localhost:4000 |
| GP Service | 5173 | http://localhost:5173 |
| GP Partner | 5174 | http://localhost:5174 |

---

## 1. Запуск всей системы

```bash
cd gp_project
npm install
docker compose -f apps/api/docker-compose.yml up -d
npm run prisma:migrate:deploy
npm run prisma:generate
npm run prisma:seed   # demo-аккаунты

npm run dev:all
```

---

## 2. Если зависло / EADDRINUSE

```bash
npm run kill:ports
npm run dev:all
```

Или по отдельности:

```bash
npm run dev:api:safe
npm run dev:service:safe
npm run dev:partner:safe
```

---

## 3. Health-check API

```bash
# быстрый
curl http://localhost:4000/health

# полный (БД, Prisma, WebSocket, GPS, Orders, Auth, миграции)
curl http://localhost:4000/health/full | jq
```

Полный ответ проверяет:

- **database** — `SELECT 1`
- **prisma** — клиент и `User`
- **websocket** — namespace `/tracking`
- **gps** — geofence zones + `ingestGps`
- **orders** — модуль и счётчик заказов
- **auth** — модуль и пользователи
- **migrations** — pending → команда `npm run prisma:migrate:deploy`
- **schema** — поля `Order` / `GeofenceZone`

При `status: "error"` смотрите `checks.*.hint` и `hints` в корне ответа.

---

## 4. WebSocket (realtime статусы)

- Namespace: `http://localhost:4000/tracking`
- События:
  - `tracking:update` — GPS / карта
  - `order:status` — смена статуса заказа (партнёр → клиент)

Клиент подписывается через `@gp/shared/api/trackingSocket`:

- `subscribeOrderTracking(orderId, onTracking, onStatus)`
- `subscribeGlobalOrderStatus(() => refreshOrders())` — в `ServiceContext` / `PartnerContext`

**Auto-reconnect:** до 12 попыток, экспоненциальная задержка (без бесконечного цикла).

В DevTools → Console: `[GP WS] connected`, `reconnect`, `connect_error`.

После logout: `resetTrackingSocket('logout')`.

---

## 5. Проверка GPS / geofence

1. `curl http://localhost:4000/geo/geofences` — зелёные зоны слива (после seed)
2. Партнёр принимает заказ септика → кнопки статусов (MVP: вручную)
3. На карте клиента: live tracking или **«Демо GPS»** если WS/GPS недоступен
4. `POST /geo/gps` — партнёр отправляет координаты (hook `useGpsTracker`)

---

## 6. Flow заказа (smoke)

1. Клиент: регистрация / `client@gp.kz` → заказ септика или газона
2. Партнёр: `partner@gp.kz` → Заявки → **Принять**
3. Статусы: **Выехал** → **На месте** → **Начал** → **Завершил**
4. Клиент: Заказы — статус обновляется (WS + poll 6–8 с)
5. Клиент: **Подтвердить выполнение** → комиссия с баланса партнёра

Подробный чеклист: [SMOKE_TEST.md](./SMOKE_TEST.md)

---

## 7. Prisma / миграции

При старте API в логах:

```
[PrismaService] Миграции не синхронизированы...
[GP] Выполните: npm run prisma:migrate:deploy
```

Если `migrate dev` ругается на старые имена миграций:

```bash
npm run prisma:migrate:deploy
npm run prisma:generate
```

---

## 8. Типичные ошибки (centralized handler)

| kind | Причина | Действие |
|------|---------|----------|
| PORT | :4000 занят | `npm run kill:ports` |
| PRISMA | БД / миграции | docker + `prisma:migrate:deploy` |
| AUTH | 401/403 | Перелогин |
| GPS | geofence/GPS | `/health/full` → checks.gps |
| NETWORK | фронт не видит API | `VITE_API_URL=http://localhost:4000` |

---

## 9. Дубли API / порты

```bash
lsof -i :4000 -i :5173 -i :5174
```

Должен быть **один** node на 4000 (Nest). Два процесса → `kill:ports`.

---

## 10. Production readiness (кратко)

| Модуль | MVP | Production |
|--------|-----|------------|
| Auth | ✅ | JWT + валидация |
| Orders + статусы | ✅ | + санитизация на scale |
| Shop | ✅ | модерация товаров |
| Commission | ✅ | после CLIENT_CONFIRMED |
| WebSocket | ✅ dev | + auth на subscribe |
| GPS auto | ⚠️ кнопки MVP | полный GPS pipeline |
| Admin | отдельно :5175 | не в dev:all |

См. также [RUN_GP.md](./RUN_GP.md).
