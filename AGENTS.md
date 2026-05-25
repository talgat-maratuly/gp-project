# GP Monorepo — Agent Guide

Экосистема: **GP Service** (клиент) · **GP Partner** (партнёр) · **GP Admin** (модерация) · **apps/api** (NestJS + Prisma).

## Обязательное правило

Читай и соблюдай `.cursor/rules/gp-ecosystem-sync.mdc` — любое связанное изменение синхронизируй во всех затронутых приложениях.

## Shared

- API: `packages/shared/src/api/`
- Статусы: `packages/shared/src/constants/ecosystemStatuses.js`
- Роли партнёра: `packages/shared/src/constants/partnerRole.js`
- Тест-регистрация: `packages/shared/src/utils/testAuthCredentials.js`, `packages/shared/src/testMode/`

## Ключевые потоки

1. Заказ: Service → `POST /orders` → Admin `PATCH /admin/orders/:id/assign` → Partner `PATCH /orders/:id/status`
2. Партнёр: Partner register → Admin `/partners/moderation` → `APPROVED` → доступ к заказам
3. Товар: Partner Market → Admin `/market/products/moderation` → `isActive` → Service `GET /market/products`

## Prisma / миграции

```bash
npm run prisma:migrate:deploy
npm run prisma:generate
npm run prisma:seed
```
