# GP Python AI Assistant

MVP Python AI service for GP Service, GP Market, GP Partner, GP Admin, Backend and PostgreSQL.

GP Work is intentionally excluded.

## Run

```bash
cd apps/ai-assistant
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8010 --reload
```

## Endpoints

- `GET /health`
- `POST /ai/orders/validate`
- `POST /ai/orders/match-partners`
- `POST /ai/market/recommend`
- `POST /ai/irrigation/check`
- `POST /ai/admin/audit`
- `POST /ai/reports/service`
- `POST /ai/reports/partner`
- `POST /ai/reports/admin`

The service returns recommendations only. It must not directly change order, partner, store or admin statuses.
