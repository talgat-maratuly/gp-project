# GPS + Geofencing (септик)

## Миграция

```bash
npm run prisma:migrate:deploy
npm run prisma:seed   # 4 официальных слива Уральска
```

## API

| Метод | Путь | Кто |
|-------|------|-----|
| POST | `/geo/gps` | Партнёр — точка GPS (каждые 5–15 сек) |
| GET | `/geo/orders/:id/tracking` | Клиент / партнёр / админ |
| GET | `/geo/geofences` | Зоны сливов |
| GET | `/geo/admin/fleet` | Админ — флот + illegal |
| WebSocket | `/tracking` | `subscribe` + `tracking:update` |

## Автостатусы (септик)

`ACCEPTED` → движение → `ON_THE_WAY` → у клиента → `ARRIVED` → 3 мин → `STARTED` → уехал → `LOADED` → офиц. слив → `DISPOSAL_ARRIVED` → 2 мин → `DISPOSAL_COMPLETED` → уехал → `COMPLETED`

Незаконный слив: `LOADED` + стоянка вне зелёных кругов → `illegalDisposal` + событие `ILLEGAL`.

## Фронт

- **GP Partner**: GPS `watchPosition`, карта live, кнопки статусов только «Принять»
- **GP Service**: карта заказа, ETA, WebSocket
- **GP Admin**: `/fleet` — машины и подозрительные сливы
