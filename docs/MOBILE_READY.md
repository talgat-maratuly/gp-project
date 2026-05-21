# GP — подготовка к мобильным приложениям

Backend и каталог магазина готовы. Нативные приложения подключаются к **тому же API**, что веб.

## Что уже готово

| Компонент | Статус |
|-----------|--------|
| REST API + JWT | ✅ |
| OpenAPI | http://localhost:4000/api/openapi.json |
| Контракт | [packages/contracts/gp-api.json](../packages/contracts/gp-api.json) |
| GP Shop в БД | ✅ **48 товаров** после `npm run prisma:seed` |
| WebSocket `/tracking` | ✅ GPS + `order:status` |
| Demo аккаунты | client@gp.kz / partner@gp.kz / password123 |

## Каталог магазина (seed)

11 категорий: plants, lawn, irrigation, hunter, pumps, filters, fertilizers, lighting, tools, consumables, parts.

```bash
npm run prisma:seed
# в логе: GP Shop: 48 товаров
curl http://localhost:4000/products | head
```

## Тест на телефоне (без Flutter, сегодня)

1. Узнайте IP Mac в Wi‑Fi: `ipconfig getifaddr en0` (или Системные настройки → Сеть).
2. Скопируйте [apps/gp-service/.env.mobile.example](../apps/gp-service/.env.mobile.example) → `.env.mobile.local`:
   ```
   VITE_API_URL=http://192.168.1.XXX:4000
   ```
3. Запуск:
   ```bash
   npm run kill:ports
   npm run dev:all
   ```
4. На телефоне (та же Wi‑Fi):
   - Клиент: `http://192.168.1.XXX:5173`
   - Партнёр: `http://192.168.1.XXX:5174`

Vite уже с `host: true` — слушает все интерфейсы.

## Flutter (рекомендуется для сторов)

См. [FLUTTER.md](./FLUTTER.md) и [apps/mobile/README.md](../apps/mobile/README.md).

**API URL на устройстве:**

| Среда | URL |
|-------|-----|
| Android Emulator | `http://10.0.2.2:4000` |
| iOS Simulator | `http://localhost:4000` |
| Реальный телефон | `http://<IP-вашего-Mac>:4000` |
| Production | `https://your-api.onrender.com` |

```dart
const apiBase = String.fromEnvironment(
  'API_URL',
  defaultValue: 'http://10.0.2.2:4000',
);
```

Токен: `flutter_secure_storage`, ключи как в [packages/shared/src/api/token.js](../packages/shared/src/api/token.js).

## Production (TestFlight / внутреннее тестирование)

1. API на Render + `CORS_ORIGINS` (для веб; Flutter native CORS не нужен).
2. `VITE_API_URL` на Vercel для веб-версии.
3. Flutter: `--dart-define=API_URL=https://gp-api.onrender.com`.

## Экраны для первого релиза Flutter

**GP Service (CLIENT):** логин, каталог, карточка товара, корзина, заказы, профиль.  
**GP Partner (PARTNER):** логин, новые заявки, статусы, баланс, добавить товар.

Карты: `flutter_map` или Google Maps. Не переносить Leaflet из React.

## Команды

```bash
npm run dev:all
npm run prisma:seed
curl http://localhost:4000/health/full
curl "http://localhost:4000/products?limit=5"
```
