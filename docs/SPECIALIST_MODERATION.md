# Specialist Moderation Workflow

## API (REST)

| Method | Path | Рөл |
|--------|------|-----|
| POST | `/api/specialist-requests` | PARTNER |
| GET | `/api/specialist/my-requests` | PARTNER |
| POST | `/api/specialist-requests/resubmit` | PARTNER |
| GET | `/api/moderator/specialist-requests` | GP_OPERATOR, FRANCHISE_OWNER, GLOBAL_OPERATOR, ADMIN |
| PATCH | `/api/moderator/specialist-requests/:id/approve` | Moderators |
| PATCH | `/api/moderator/specialist-requests/:id/reject` | Moderators |

Legacy: `POST /api/partner/apply` → moderation submit (автобекіту жоқ).

## Статус өтуі

```
PENDING → APPROVED | REJECTED
REJECTED → PENDING (resubmit)
APPROVED — терминал
```

## Автобекіту жойылды

- `Role.PARTNER` енді `SPECIALIST` portal рөлін **автоматты бермейді**
- `SPECIALIST` тек `requestStatus = APPROVED` + `rbac.onSpecialistApproved()`
- Тіркелу: `DRAFT`, `portalRoles: [CLIENT]`

## Модератор маршруты

- Франшиза аймағы → `FRANCHISE_OWNER` + `GP_OPERATOR`
- Негізгі платформа → `GP_OPERATOR` + `GLOBAL_OPERATOR`

## Хабарламалар

`Notification` кестесі — push интеграциясы кейін қосылады.
