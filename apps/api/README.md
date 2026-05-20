# GP API — NestJS Backend

Backend для **GP Service** (клиенты) и **GP Partner** (партнёры, магазины, водители, исполнители).

> GP Work — отдельный проект, не входит в этот API.

## Стек

- Node.js · NestJS · PostgreSQL · Prisma · JWT · Swagger

## Быстрый старт

```bash
cd apps/api
cp .env.example .env
npm install
docker compose up -d
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

- API: http://localhost:4000  
- Swagger: http://localhost:4000/api/docs  

## Тестовые аккаунты (seed)

| Роль | Email | Пароль |
|------|-------|--------|
| Admin | admin@gp.kz | password123 |
| Client | client@gp.kz | password123 |
| Partner | partner@gp.kz | password123 |

## Модули

| Модуль | Описание |
|--------|----------|
| **Auth** | `POST /auth/register/client`, `/register/partner`, `/login`, `GET /auth/me` |
| **Partners** | Профиль, направления, онлайн, GPS |
| **Products** | `GET/POST /products` — каталог GP Shop |
| **Orders** | Создание клиентом, фильтр для партнёра по направлениям |
| **Payments** | Архитектура оплаты, превью комиссии септика |
| **Partner Balance** | Баланс, пополнение, история |
| **Geo** | Трекинг, mock GPS |
| **Notifications** | Mock-уведомления |
| **Admin** | Дашборд, клиенты, партнёры, заказы, комиссии |

## Статусы заказа

`NEW` → `ACCEPTED` → `ON_THE_WAY` → `ARRIVED` → `COMPLETED` · `CANCELLED`

## Направления партнёра

`SEPTIC` · `LAWN` · `AUTOWATERING` · `PUMPS` · `FILTERS` · `NURSERY` · `SHOP` · `LANDSCAPE`

## Оплата

- `CASH_ON_DELIVERY` · `KASPI_DIRECT_TO_PARTNER`
- Деньги клиента → партнёру напрямую
- Комиссия GP (`GP_BALANCE_COMMISSION`) списывается с баланса партнёра при `COMPLETED`
- Септик: 4–5 м³ = 300₸, 6 м³ = 400₸, 8–9 м³ = 500₸

## JWT

Передавайте заголовок: `Authorization: Bearer <accessToken>`
