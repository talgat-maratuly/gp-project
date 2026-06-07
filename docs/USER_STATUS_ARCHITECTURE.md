# User Status Management — GPartners Portal

## Стек

- **Prisma** (TypeORM емес)
- **NestJS** `apps/api/src/user-status/`
- RBAC: `apps/api/src/rbac/`

## Үш тәуелсіз статус

| Статус | Жауапкершілік | Орналасуы |
|--------|---------------|-----------|
| **RequestStatus** | Specialist moderation | `PartnerProfile.requestStatus` |
| **AccountStatus** | Platform access | `User.accountStatus` |
| **WorkStatus** | Specialist availability | `PartnerProfile.workStatus` |

Enum-дар **біріктірілмейді**.

## Enum мәндері (MVP)

```prisma
enum RequestStatus { PENDING APPROVED REJECTED }
enum AccountStatus { ACTIVE SUSPENDED BANNED }
enum WorkStatus { ONLINE OFFLINE }  // BUSY — кейін
```

## Legacy `PartnerStatus`

`DRAFT | PENDING_REVIEW | NEEDS_REVISION | APPROVED | REJECTED | SUSPENDED` — ішкі workflow.

`requestStatus` синхрон:

| PartnerStatus | RequestStatus |
|---------------|---------------|
| DRAFT | `null` |
| PENDING_REVIEW, NEEDS_REVISION | PENDING |
| APPROVED, SUSPENDED | APPROVED |
| REJECTED | REJECTED |

`isOnline` — deprecated; `workStatus` + sync.

## Валидация

| Шарт | Нәтиже |
|------|--------|
| `accountStatus !== ACTIVE` | Login/JWT/orders блок |
| `requestStatus !== APPROVED` | Specialist ONLINE/orders блок |
| `workStatus !== ONLINE` | Жаңа тапсырыс қабылдамау |

## API

| Method | Path | Сипаттама |
|--------|------|-----------|
| GET | `/api/user-status/me` | Статустар snapshot |
| PATCH | `/api/user-status/users/:id/account` | ADMIN account status |
| PATCH | `/api/partners/me/work-status` | Specialist ONLINE/OFFLINE |
| PATCH | `/api/partners/me` | `workStatus` немесе `isOnline` (legacy) |

## Guards

- `AccountActiveGuard` — account ACTIVE
- `SpecialistOnlineGuard` — account + request APPROVED + work ONLINE + partner APPROVED
- `PartnerApprovedGuard` — account + request + partner workflow APPROVED
- `JwtStrategy` — әр JWT сұрауда account тексеру

## Frontend

```javascript
import { canWorkAsSpecialist, canUsePlatform } from '@gp/shared-core/user-statuses'
```

## Migration

```bash
npm run prisma:migrate:deploy
npm run prisma:generate
```

`20260529140000_user_status_system`

## Мысалдар

**Жаңа өтінім:** `request=PENDING`, `account=ACTIVE`, `work=OFFLINE`

**Бекітілген specialist:** `request=APPROVED`, `account=ACTIVE`, `work=ONLINE`

**Banned:** `account=BANNED` — басқа статустар маңызсыз
