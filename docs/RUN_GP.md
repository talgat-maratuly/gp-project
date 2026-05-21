# Запуск GP MVP (локально)

## Порты

| Сервис | URL | Порт |
|--------|-----|------|
| **GP API** | http://localhost:4000 | 4000 |
| **GP Service** | http://localhost:5173 | 5173 |
| **GP Partner** | http://localhost:5174 | 5174 |

API для фронтендов: `VITE_API_URL=http://localhost:4000`

---

## Обычный запуск (рекомендуется)

```bash
npm install

# PostgreSQL (первый раз)
docker compose -f apps/api/docker-compose.yml up -d
npm run prisma:migrate:deploy
npm run prisma:seed

# Умный запуск — без EADDRINUSE, без дублей
npm run dev:smart
```

**`dev:smart`** для каждого сервиса:

1. Если URL уже отвечает → сообщение «уже запущен», для Service/Partner открывается браузер.
2. Если порт занят, но не отвечает → старый процесс убивается, сервис перезапускается.
3. Если порт свободен → запуск в фоне, PID в `.gp-pids/`.

Повторный `npm run dev:smart` **не** создаёт второй процесс и **не** показывает красную ошибку port already in use.

---

## Если всё зависло

```bash
npm run kill:ports
npm run dev:smart
```

---

## Открыть в браузере

```bash
npm run open:service   # http://localhost:5173
npm run open:partner   # http://localhost:5174
npm run open:api       # http://localhost:4000/health
```

---

## Альтернатива: все сервисы в одном терминале

```bash
npm run dev:all      # concurrently, перед стартом kill:ports
npm run restart:all  # полный перезапуск
```

Остановка `dev:all`: `Ctrl+C` в том же терминале.

---

## Скрипты

| Команда | Описание |
|---------|----------|
| **`npm run dev:smart`** | Умный запуск (по умолчанию `npm run dev`) |
| `npm run kill:ports` | Освободить 4000, 5173, 5174 |
| `npm run dev:all` | Всё в одном терминале (concurrently) |
| `npm run restart:all` | Kill + wait + dev:all |
| `npm run open:service` | Открыть GP Service |
| `npm run open:partner` | Открыть GP Partner |
| `npm run open:api` | Открыть health API |

---

## Логи и PID

| Файл | Содержимое |
|------|------------|
| `.gp-pids/api.pid` | PID процесса API |
| `.gp-pids/service.pid` | PID GP Service |
| `.gp-pids/partner.pid` | PID GP Partner |
| `.gp-pids/*.log` | stdout/stderr фоновых процессов |

---

## Проверка

```bash
curl http://localhost:4000/health
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5174
```

См. также [SMOKE_TEST.md](./SMOKE_TEST.md) · [MOBILE_READY.md](./MOBILE_READY.md) · [STABLE_RUN.md](./STABLE_RUN.md)
