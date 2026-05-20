# GP Ecosystem — Monorepo

| Приложение | Порт | Описание |
|------------|------|----------|
| **GP API** | 4000 | NestJS + PostgreSQL + Prisma (backend) |
| **GP Service** | 5173 | Клиентское приложение |
| **GP Partner** | 5174 | Партнёры, магазины, исполнители |
| **GP Admin** | 5175 | Панель администратора (модерация, аналитика) |

> **GP Work** — отдельный проект, не входит в этот репозиторий.

## Backend (NestJS)

```bash
cd apps/api
cp .env.example .env
npm install
docker compose up -d
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

Swagger: http://localhost:4000/api/docs

Подробнее: [apps/api/README.md](apps/api/README.md)

## Frontend

```bash
npm install
npm run dev:api       # backend :4000
npm run dev:service   # :5173
npm run dev:partner   # :5174
npm run dev:admin     # :5175 — только ADMIN
```

Или всё сразу: `npm run dev`

### E2E-тест API

После запуска backend и seed:

```bash
npm run test:e2e
```

Демо-аккаунты (пароль `password123`): `client@gp.kz`, `partner@gp.kz`, `admin@gp.kz`

## Flutter (мобильные приложения)

React-приложения — тонкий клиент к API. Для Flutter см. **[docs/FLUTTER.md](docs/FLUTTER.md)** и контракт **[packages/contracts/gp-api.json](packages/contracts/gp-api.json)**.

OpenAPI: http://localhost:4000/api/openapi.json

## Структура

```
apps/
  api/           # NestJS backend
  gp-service/    # React — клиенты
  gp-partner/    # React — партнёры
  gp-admin/      # React — админка
packages/
  shared/        # Общие константы и утилиты
```

## Деплой (бесплатный хостинг)

В продакшене участвуют только **GP Service**, **GP Partner** и **API**.  
**GP Admin** и **GP Work** в этой инструкции не деплоятся.

| Компонент | Платформа | Конфиг |
|-----------|-----------|--------|
| GP Service | [Vercel](https://vercel.com) | `apps/gp-service/vercel.json` |
| GP Partner | [Vercel](https://vercel.com) | `apps/gp-partner/vercel.json` |
| GP API | [Render](https://render.com) | `render.yaml` |
| PostgreSQL | Render PostgreSQL или [Supabase](https://supabase.com) | `DATABASE_URL` |

Пример переменных: [.env.example](.env.example)

### 1. Залить код в GitHub

```bash
git init
git add .
git commit -m "GP monorepo"
git branch -M main
git remote add origin https://github.com/YOUR_USER/gp-project.git
git push -u origin main
```

### 2. База данных (PostgreSQL)

**Render:** Dashboard → New → PostgreSQL → скопируйте **Internal Database URL** (для API на Render) или External (для Supabase/локально).

**Supabase:** Project Settings → Database → Connection string (URI). Для serverless иногда нужен pooler URL.

Сохраните строку как `DATABASE_URL` (формат `postgresql://user:pass@host:5432/db`).

### 3. API на Render

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** (или Web Service из репозитория).
2. Подключите GitHub-репозиторий.
3. Если Blueprint: Render подхватит корневой `render.yaml`.
4. Если вручную (Web Service):
   - **Root Directory:** `.` (корень monorepo)
   - **Build Command:**
     ```bash
     NPM_CONFIG_PRODUCTION=false npm install && npx prisma generate --schema apps/api/prisma/schema.prisma && npm run build:api
     ```
   - **Start Command:**
     ```bash
     npx prisma migrate deploy --schema apps/api/prisma/schema.prisma && npm run start:api
     ```
   - **Health Check Path:** `/health`
5. **Environment Variables:**
   | Key | Value |
   |-----|--------|
   | `DATABASE_URL` | строка из шага 2 |
   | `JWT_SECRET` | длинная случайная строка (32+ символа) |
   | `NODE_ENV` | `production` |
   | `CORS_ORIGINS` | URL двух фронтов через запятую, см. ниже |

После деплоя API будет доступен, например: `https://gp-api.onrender.com` (имя зависит от сервиса на Render).

### 4. Prisma migrate и seed

Миграции при старте на Render выполняются командой `prisma migrate deploy` из `render.yaml`.

Первичное наполнение (демо-аккаунты) — один раз локально или в Render Shell:

```bash
# локально, подставьте production DATABASE_URL
export DATABASE_URL="postgresql://..."
npm run prisma:migrate:deploy
npm run prisma:seed
```

Демо: `client@gp.kz`, `partner@gp.kz`, `admin@gp.kz` / `password123`

### 5. GP Service на Vercel

1. [vercel.com](https://vercel.com) → **Add New** → **Project** → импорт репозитория.
2. **Root Directory:** `apps/gp-service`
3. Framework Preset: **Vite** (или оставьте авто — подтянется `vercel.json`).
4. **Build Command:** `cd ../.. && npm run build:service` (уже в `vercel.json`).
5. **Output Directory:** `dist`
6. **Environment Variables** (Production и Preview):

   | Key | Value |
   |-----|--------|
   | `VITE_API_URL` | `https://gp-api.onrender.com` (ваш URL API без `/` в конце) |

7. Deploy.

### 6. GP Partner на Vercel

Отдельный проект Vercel (второй):

1. **Root Directory:** `apps/gp-partner`
2. **Environment Variables:**

   | Key | Value |
   |-----|--------|
   | `VITE_API_URL` | тот же URL API, что для Service |

3. Deploy.

### 7. CORS на API

После появления URL Vercel обновите на Render переменную `CORS_ORIGINS`:

```text
https://your-gp-service.vercel.app,https://your-gp-partner.vercel.app
```

Без слэша в конце, через запятую. Перезапустите сервис API.

### 8. Проверка API

Подставьте `API=https://gp-api.onrender.com`:

```bash
# Health
curl -s "$API/health"

# Каталог (публично)
curl -s "$API/products"

# Вход клиента (после seed)
curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"client@gp.kz","password":"password123"}'

# Заказы (нужен token из login)
curl -s "$API/orders" -H "Authorization: Bearer YOUR_TOKEN"
```

В браузере: откройте GP Service → войдите → заказы и магазин должны грузиться без ошибок CORS.

### Локальная разработка

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
# DATABASE_URL + docker compose в apps/api

npm install
cd apps/api && docker compose up -d && npx prisma migrate dev && npx prisma db seed
cd ../..
npm run dev
```

Для фронтов локально `VITE_API_URL` **не обязателен** — запросы идут через Vite proxy на `localhost:4000` (`packages/shared/vite.proxy.js`).

### Скрипты monorepo (деплой)

| Команда | Назначение |
|---------|------------|
| `npm run build:service` | Сборка GP Service → `apps/gp-service/dist` |
| `npm run build:partner` | Сборка GP Partner → `apps/gp-partner/dist` |
| `npm run build:api` | Сборка NestJS → `apps/api/dist` |
| `npm run start:api` | Запуск API в production |
| `npm run prisma:migrate:deploy` | Миграции на production БД |
| `npm run prisma:seed` | Демо-данные |
