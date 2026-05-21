# GP Admin

Единая панель GP Service + GP Partner. Один сервер / одна БД (в проде), доступ по **франшизам** и **городам**.

## Запуск

```bash
npm install
npm run dev:admin
```

→ **http://localhost:5175**

## Демо-логины (пароль `1234`)

| Логин | Роль | Доступ |
|-------|------|--------|
| `superadmin` | SUPER_ADMIN | Все города, франшизы, сеть GP |
| `atyrau_admin` | FRANCHISE_ADMIN | Только Атырау |
| `aktobe_admin` | FRANCHISE_ADMIN | Только Актобе |
| `uralsk_admin` | FRANCHISE_ADMIN | Только Уральск |
| `manager` | MANAGER | Уральск — заявки, клиенты, партнёры |
| `finance` | FINANCE | Уральск — финансы |
| `support` | SUPPORT | Уральск — отзывы |

SUPER_ADMIN в шапке видит фильтр **«Все города»** и может переключать франшизу.

## Разделы

| Раздел | Кто видит | Действия |
|--------|-----------|----------|
| **Франшизы** | SUPER_ADMIN | Создать / редактировать / блокировать |
| **Услуги** | SUPER_ADMIN, FRANCHISE_ADMIN | CRUD услуг и подуслуг, цены, комиссия |
| **Скидки** | SUPER_ADMIN, FRANCHISE_ADMIN | Акции, % / фикс / 5-й заказ бесплатно |
| **Заявки** | Admin, Manager | Редактирование, партнёр, статус |
| **Клиенты** | Admin, Manager | CRUD, бонусы, скидки |
| **Партнёры** | Admin, Manager | CRUD, блокировка, услуги |
| **Финансы** | Admin, Finance | Отчёты по своей франшизе |
| **Отзывы** | Admin, Support | Статусы жалоб |

## Где что делать в интерфейсе

1. **Франшизы** — меню «Франшизы» (только superadmin) → «Добавить франшизу»
2. **Услуги** — «Услуги» → «Добавить услугу»; подуслуги — раскрыть карточку → «Добавить подуслугу»
3. **Подуслуги** — внутри карточки услуги (цена и комиссия отдельно)
4. **Права пользователей** — сейчас в демо: `src/data/seedData.js` → `DEMO_USERS` (роль + `franchiseId`); в проде — таблица users в API
5. **Скидки** — меню «Скидки и бонусы»

## Данные (LocalStorage)

- Ключ: `gp-admin-store-v2`
- Фильтр города (superadmin): `gp-admin-franchise-filter`
- Сброс: **Настройки** → «Сбросить демо-данные» (SUPER_ADMIN)

Структура готова под backend: у всех сущностей есть `franchiseId`.

```js
franchises[]   // id, name, city, ownerName, phone, status, createdAt
services[]     // franchiseId, subservices[]
clients[]      // franchiseId, bonuses, freeFifthOrder
partners[]     // franchiseId, serviceIds[]
orders[]       // franchiseId, serviceId, subserviceId
discounts[]    // franchiseId, type: PERCENT|FIXED|FREE_ORDER
```

Сиды: `src/data/seedData.js` · Права: `src/lib/permissions.js` · Фильтр: `src/context/AccessContext.jsx`

## i18n

`src/i18n/translations.js` — RU / KZ / EN. Новые ключи добавляйте в три блока (`ru`, `kk`, `en`).

## Подключение backend

1. Prisma: `Franchise`, `Service`, `Subservice`, `Discount` с `franchiseId`
2. JWT: `{ role, franchiseId }` — middleware фильтрует запросы по городу
3. Заменить `StoreContext` на `@gp/shared` API; оставить `AccessContext` для UI-фильтра
4. `GET /admin/franchises`, `GET /admin/orders?franchiseId=`, CRUD по ролям как в `ROLE_ACTIONS`

## Сборка

```bash
npm run build -w @gp/admin
```
