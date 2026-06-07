# GP — мобильные приложения на Flutter

Веб-приложения (React) и будущие Flutter-приложения используют **один backend** (`apps/api`).  
Бизнес-логика — на сервере; клиент только UI + HTTP.

## Архитектура

```
┌─────────────────┐     ┌─────────────────┐
│  GP Service     │     │  GP Partner     │
│  Flutter / Web  │     │  Flutter / Web  │
└────────┬────────┘     └────────┬────────┘
         │    JWT Bearer         │
         └──────────┬────────────┘
                    ▼
            ┌───────────────┐
            │  NestJS API   │
            │  PostgreSQL   │
            └───────────────┘
```

## OpenAPI (автогенерация клиента)

1. Запустите API: `npm run dev:api`
2. Скачайте схему: http://localhost:4000/api/openapi.json
3. В Flutter:

```bash
dart pub add dio flutter_secure_storage
# опционально: openapi_generator или swagger_dart_code_generator
```

Контракт вручную: [`packages/contracts/gp-api.json`](../packages/contracts/gp-api.json)

## Авторизация (Dart пример)

```dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const apiBase = String.fromEnvironment('API_URL', defaultValue: 'http://localhost:4000');
const tokenKey = 'gp-partner-access-token'; // или gp-service-access-token

final dio = Dio(BaseOptions(baseUrl: apiBase));
final storage = FlutterSecureStorage();

Future<void> loginPartner(String email, String password) async {
  final res = await dio.post('/auth/login', data: {'email': email, 'password': password});
  final token = res.data['accessToken'] as String;
  await storage.write(key: tokenKey, value: token);
}

Future<Response> apiGet(String path) async {
  final token = await storage.read(key: tokenKey);
  return dio.get(path, options: Options(headers: {'Authorization': 'Bearer $token'}));
}

Future<void> registerPartner(Map<String, dynamic> body) async {
  final res = await dio.post('/auth/register/partner', data: body);
  await storage.write(key: tokenKey, value: res.data['accessToken']);
}
```

Тело регистрации партнёра:

```json
{
  "email": "you@mail.kz",
  "password": "password123",
  "name": "Айбек",
  "phone": "+77001234567",
  "company": "ИП Айбек",
  "directions": ["SEPTIC", "LAWN"]
}
```

## Два приложения Flutter

| App | Роль | Основные экраны |
|-----|------|-----------------|
| `gp_service` | CLIENT | каталог, корзина, заказы, профиль |
| `gp_partner` | PARTNER | заявки, карта, баланс, магазин |

Рекомендуется **два отдельных Flutter-проекта** (или flavors) с разными `applicationId` и иконками.

## Enum-ы (как в API)

Используйте строки из `gp-api.json` → `enums`, не дублируйте логику комиссий на клиенте.

Статусы заказа: `NEW` → `ACCEPTED` → `ON_THE_WAY` → `ARRIVED` → `COMPLETED`

## Локальная разработка

- Эмулятор Android: `http://10.0.2.2:4000`
- iOS Simulator: `http://localhost:4000`
- Реальное устройство: IP компьютера в Wi‑Fi, например `http://192.168.1.10:4000`

В NestJS CORS уже включён.

## Что не переносить в Flutter из React

- `localStorage` → `flutter_secure_storage` для JWT
- Leaflet → `flutter_map` или `google_maps_flutter`
- Стили Tailwind → Material / своя тема

## Демо-аккаунты

| Email | Пароль | Приложение |
|-------|--------|------------|
| client@gp.kz | password123 | GP Service |
| partner@gp.kz | password123 | GP Partner |
# GP Flutter Mobile

Flutter workspace is available in:

```text
apps/flutter/
```

It contains:

- `gp_mobile_shared` — Dart shared API/auth/session package.
- `gp_service_app` — GP Service mobile client.
- `gp_partner_app` — GP Partner mobile client.

Run:

```bash
cd apps/flutter/gp_service_app
flutter pub get
flutter run --dart-define=API_URL=https://apigp.duckdns.org/api
```

For DEV OTP:

```bash
flutter run \
  --dart-define=API_URL=http://10.0.2.2:4000/api \
  --dart-define=GP_DEV_OTP=true
```

Use OTP:

```text
000000
```

Do not enable `GP_DEV_OTP=true` for production builds.
