# GP — Production деплой (басынан аяғына)

Репозиторий: `https://github.com/talgat-maratuly/gp-project`

| # | Сервис | Платформа | URL (мысал) |
|---|--------|-----------|-------------|
| 1 | PostgreSQL + API | Render | `https://gp-api.onrender.com` |
| 2 | GP Service | Vercel | `https://gp-service-xxx.vercel.app` |
| 3 | GP Partner | Vercel | `https://gp-partner-xxx.vercel.app` |

---

## Қадам 1 — Render: API + база

1. [dashboard.render.com](https://dashboard.render.com) → тіркелу / кіру (GitHub арқылы).
2. **New +** → **Blueprint**.
3. **Connect repository** → `talgat-maratuly/gp-project`.
4. Render `render.yaml` оқиды — **gp-postgres** (БД) + **gp-api** (web) құрады.
5. **Apply** → deploy басталады (5–15 минут, free tier бірінші рет баяу).
6. Deploy аяқталғанша күтіңіз. API URL: `https://gp-api.onrender.com` (немесе Render берген атау).

### Seed (демо аккаунттар — бір рет)

Render → **gp-api** → **Shell**:

```bash
npm run prisma:seed
```

Немесе локальді (Render → gp-postgres → **External Database URL** көшіріңіз):

```bash
export DATABASE_URL="postgresql://..."
npm run prisma:migrate:deploy
npm run prisma:seed
```

Демо: `client@gp.kz` / `partner@gp.kz` / `password123`

### API тексеру

```bash
curl https://gp-api.onrender.com/health
curl https://gp-api.onrender.com/products
```

`{"status":"ok"}` және товарлар тізімі — дұрыс.

**CORS_ORIGINS** әлі бос — Vercel URL-дерді қойғаннан кейін (қадам 4).

---

## Қадам 2 — Vercel: GP Service

1. [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. Import `talgat-maratuly/gp-project`.
3. **Configure Project:**

   | Параметр | Мән |
   |----------|-----|
   | Project Name | `gp-service` (қалаған) |
   | **Root Directory** | `apps/gp-service` |
   | Framework Preset | Vite |
   | Build Command | `cd ../.. && npm run build:service` |
   | Output Directory | `dist` |
   | Install Command | `cd ../.. && npm install` |

4. **Environment Variables** (Production + Preview):

   | Key | Value |
   |-----|--------|
   | `VITE_API_URL` | `https://gp-api.onrender.com` |

   Соңындағы `/` жоқ.

5. **Deploy** → URL сақтаңыз, мысалы: `https://gp-service.vercel.app`.

---

## Қадам 3 — Vercel: GP Partner

Жаңа проект (бір repo, екінші Vercel project):

| Параметр | Мән |
|----------|-----|
| Root Directory | `apps/gp-partner` |
| Build Command | `cd ../.. && npm run build:partner` |
| Output Directory | `dist` |
| `VITE_API_URL` | `https://gp-api.onrender.com` |

Deploy → URL сақтаңыз, мысалы: `https://gp-partner.vercel.app`.

---

## Қадам 4 — CORS (маңызды!)

Render → **gp-api** → **Environment**:

`CORS_ORIGINS` қосыңыз немесе жаңартыңыз:

```text
https://СЕНІҢ-gp-service.vercel.app,https://СЕНІҢ-gp-partner.vercel.app
```

- `https://` міндетті  
- үтірмен, бос орынсыз  
- соңында `/` жоқ  

**Save** → **Manual Deploy** (қайта іске қосу).

---

## Қадам 5 — Соңғы тексеру

### API

```bash
API=https://gp-api.onrender.com

curl -s "$API/health"
curl -s "$API/products" | head -c 200

curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"client@gp.kz","password":"password123"}'
```

### Браузер

1. **GP Service** — ашыңыз, кіру `client@gp.kz` / `password123`, магазин/заказ.
2. **GP Partner** — `partner@gp.kz` / `password123`, заявки.
3. DevTools → Network — сұраулар `gp-api.onrender.com`қа барады, CORS қатесі жоқ.

---

## CLI (қалаған)

```bash
# Vercel
vercel login
cd apps/gp-service && vercel --prod
cd apps/gp-partner && vercel --prod
```

---

## Жиі мәселелер

| Мәселе | Шешім |
|--------|--------|
| CORS error | `CORS_ORIGINS` екі Vercel URL, API redeploy |
| API ұйықтап тұр (free) | Бірінші сұрау 30–60 сек — күту |
| `VITE_API_URL` жоқ | Vercel env + **Redeploy** (build кезінде керек) |
| БД бос | `npm run prisma:seed` Shell-де |
| 502 Render | Logs → migrate қатесі → `DATABASE_URL` тексеру |

---

## Тізім (галочка)

- [ ] Render Blueprint deploy аяқталды
- [ ] `/health` жауап береді
- [ ] `prisma:seed` орындалды
- [ ] Vercel gp-service + `VITE_API_URL`
- [ ] Vercel gp-partner + `VITE_API_URL`
- [ ] `CORS_ORIGINS` қойылды, API redeploy
- [ ] Клиент пен партнёр кіре алады
