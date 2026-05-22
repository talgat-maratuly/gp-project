# GP QA Testing

## Команды

| Команда | Описание |
|---------|----------|
| `npm run qa:all` | Store + stress + API (Node, без браузера) |
| `npm run qa:e2e` | Playwright UI smoke (3 приложения) |
| `npm run qa:full` | `qa:all` → `qa:e2e` → объединённый отчёт |
| `npm run playwright:install` | Установка Chromium для Playwright |

Первый запуск E2E:

```bash
npm install
npm run playwright:install
npm run demo:hub    # в отдельном терминале (или Playwright поднимет сам)
npm run qa:full
```

## Отчёт в Admin

```bash
npm run dev:admin
# superadmin / 1234 → QA Отчёт (/testing-report)
```

Артефакты:

- `apps/gp-admin/public/qa-report.json` — для UI
- `qa-reports/latest.json` — копия
- `qa-logs/test-run.log`, `api-requests.json`, `playwright-report.json`

## Node-тесты (`qa:all`)

| Модуль | Содержание |
|--------|------------|
| Routes | Файлы страниц Service / Partner / Admin |
| Auth | DEMO_USERS |
| Service Orders | Полный цикл заявки |
| Hunter / Furniture | Создание, partner/admin |
| GP Market | Магазин, заказ, статусы |
| Stress | 100 Hunter + 100 Furniture + 100 Market + **100 clients** + 50 partners |
| API | `/health`, products, market, login (если API запущен) |

## Playwright (`qa:e2e`)

- `tests/e2e/service.spec.mjs` — главная, shop, hunter, login
- `tests/e2e/partner.spec.mjs` — login, orders, shop, светлая тема
- `tests/e2e/admin.spec.mjs` — market, hunter, furniture, QA dashboard
- `tests/e2e/flows.spec.mjs` — furniture wizard, без React overlay

Конфиг: `playwright.config.mjs` (порты 5173–5175, hub 5190).

## API

```bash
npm run dev:api
QA_API_URL=http://localhost:4000 npm run qa:all
```

## Hub (синхронизация LocalStorage)

В `.env.development` каждого приложения: `VITE_GP_DEMO_HUB=http://127.0.0.1:5190`

```bash
npm run demo:hub
```

## Пропуск E2E

```bash
QA_SKIP_E2E=1 npm run qa:full
```
