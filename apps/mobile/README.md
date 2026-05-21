# GP Mobile (Flutter) — старт

Здесь будет код **двух** приложений (отдельные репозитории или подпапки):

- `gp_service_app` — клиент (CLIENT)
- `gp_partner_app` — партнёр (PARTNER)

Сейчас backend и контракт готовы; создайте проекты:

```bash
# из этой папки
flutter create gp_service_app --org kz.gp
flutter create gp_partner_app --org kz.gp
```

## Зависимости

```yaml
dependencies:
  dio: ^5.7.0
  flutter_secure_storage: ^9.2.2
  socket_io_client: ^3.0.0
  flutter_map: ^7.0.2
  latlong2: ^0.9.1
```

## API

```dart
// lib/config/api_config.dart
class ApiConfig {
  static const baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:4000', // Android emulator
  );
  static const trackingNamespace = '/tracking';
}
```

Запуск с URL для реального телефона:

```bash
flutter run --dart-define=API_URL=http://192.168.1.10:4000
```

## Эндпоинты (MVP)

| Действие | Метод |
|----------|--------|
| Вход | `POST /auth/login` |
| Регистрация клиента | `POST /auth/register/client` |
| Регистрация партнёра | `POST /auth/register/partner` |
| Профиль | `GET /auth/me` |
| Товары | `GET /products` |
| Заказы | `GET /orders` |
| Создать заказ | `POST /orders` |
| Статус | `PATCH /orders/:id/status` |
| Подтвердить | `PATCH /orders/:id/confirm` |

Полный список: [packages/contracts/gp-api.json](../../packages/contracts/gp-api.json)

## WebSocket

```dart
// io('$baseUrl/tracking')
// emit('subscribe', {'orderId': id})
// on('order:status', ...)
// on('tracking:update', ...)
```

См. веб: [packages/shared/src/api/trackingSocket.js](../../packages/shared/src/api/trackingSocket.js)

## Демо

- client@gp.kz / password123
- partner@gp.kz / password123

Магазин: 48 товаров после `npm run prisma:seed` из корня monorepo.

Документация: [docs/MOBILE_READY.md](../../docs/MOBILE_READY.md)
