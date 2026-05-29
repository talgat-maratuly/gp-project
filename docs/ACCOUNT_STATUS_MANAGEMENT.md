# Account Status Management

## Статустар

`ACTIVE` | `SUSPENDED` | `BANNED`

## Мінез-құлық

| Status | Login | Тапсырыс/қабылдау |
|--------|-------|-------------------|
| ACTIVE | ✓ | ✓ |
| SUSPENDED | ✓ | ✗ |
| BANNED | ✗ | ✗ |

## API

| Method | Path |
|--------|------|
| GET | `/api/user-status/me` |
| GET | `/api/user-status/me/account-logs` |
| GET | `/api/moderator/accounts` |
| PATCH | `/api/moderator/accounts/users/:id/status` |
| GET | `/api/moderator/accounts/users/:id/logs` |
| POST | `/api/moderator/accounts/complaints` |
| POST | `/api/moderator/accounts/auto-moderation/run` |

Legacy: `PATCH /api/user-status/users/:id/account` → moderator controller.

## Audit

`AccountStatusLog`: userId, oldStatus, newStatus, changeType, reason, rule, changedById, createdAt.

## Auto rules

- `AUTO_COMPLAINT_LIMIT` — 3/24h, 5/7d → SUSPENDED
- `AUTO_SUSPICIOUS_ACTIVITY` — 15 orders/hour
- `AUTO_PAYMENT_DEBT` — balance < -5000
- `AUTO_REPEAT_SUSPENSIONS` — 3/30d → BANNED
- `AUTO_MULTIPLE_FAKE_ACCOUNTS` — duplicate phone

## Operator transitions

```
ACTIVE → SUSPENDED | BANNED
SUSPENDED → ACTIVE | BANNED
BANNED → ACTIVE (ADMIN only)
```
