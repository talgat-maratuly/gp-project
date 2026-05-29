# GPartners Portal — RBAC архитектурасы

## Стек (нақты репо)

| Prompt | GP Monorepo |
|--------|-------------|
| TypeORM | **Prisma** (`apps/api/prisma`) |
| `UserRole` enum | **`PortalRole`** (Prisma) → TS alias `UserRole` |
| Flutter mobile | Жоспарланған; API контракты `@gp/shared-core/portal-roles` |

## Модель

```
User
├── role: Role              # legacy бір рөл (синхрон)
├── portalRoles: PortalRole[]  # канондық RBAC
├── regionId                # GP_OPERATOR / FRANCHISE_OWNER
└── franchiseId → Franchise
```

### Рөл картасы (legacy → portal)

| Legacy `Role` | Portal рөлдері |
|---------------|----------------|
| `CLIENT` | `CLIENT` (+ `SPECIALIST` егер partner APPROVED) |
| `PARTNER` | `CLIENT`, `SPECIALIST` |
| `REGION_ADMIN` | `GP_OPERATOR` |
| `SUPER_ADMIN` | `GLOBAL_OPERATOR`, `ADMIN` |
| `ADMIN` | `ADMIN`, `GLOBAL_OPERATOR` |

## API модулі

```
apps/api/src/rbac/
├── rbac.module.ts          # @Global()
├── rbac.service.ts         # resolve, assign, specialist approve
├── rbac-region.service.ts  # аймақ оқшаулауы
├── role-conflict.validator.ts
├── rbac.permissions.ts
├── legacy-role.mapper.ts
├── guards/
│   ├── portal-roles.guard.ts   # @PortalRoles(...) OR
│   └── permission.guard.ts     # @RequirePermission('order:create')
└── rbac.controller.ts      # PATCH /api/rbac/users/:id/roles
```

## JWT

```json
{
  "sub": "uuid",
  "role": "CLIENT",
  "roles": ["CLIENT", "SPECIALIST"],
  "regionId": "...",
  "franchiseId": null
}
```

Рөл өзгергенде — **жаңа токен** (`signToken`).

`JwtStrategy` әр сұрауда DB user қайтарады — payload-қа сенбеңіз.

## Guards мысалы

```typescript
@UseGuards(JwtAuthGuard, PortalRolesGuard, PermissionGuard)
@PortalRoles(PortalRole.CLIENT, PortalRole.GP_OPERATOR)
@RequirePermission('order:create')
@Post('orders')
```

## Тапсырыс құру

| Рөл | Әрекет |
|-----|--------|
| `CLIENT` | Өз `clientProfile` арқылы |
| `GP_OPERATOR` | `onBehalfClientPhone` + `onBehalfCity` |
| `GLOBAL_OPERATOR` | + `regionId` |
| `ADMIN` | барлық аймақ |

## Рөл конфликттері

- `SPECIALIST` + `GP_OPERATOR` | `GLOBAL_OPERATOR` | `FRANCHISE_OWNER` → **жоқ**
- Оператор тағайындалғанда `SPECIALIST` алынып тасталады

## Frontend

`@gp/shared-core/portal-roles` → `canCreateOrder(roles)` меню/батырма үшін.

**UI ғана көрсету** — барлық тексеру API guards/service.

## Масштабтау

1. `Franchise` model — франшиза иелері `FRANCHISE_OWNER`
2. `assignPortalRoles` — ADMIN API
3. Кейін: `Permission` кестесі (attribute-based) қажет болса

## Migration

```bash
npm run prisma:migrate:deploy
npm run prisma:generate
```

`20260529120000_portal_rbac` — legacy user-лерге backfill.

## Core freeze

`portalRoles` / guards — additive. Legacy `Role` өзгермейді синхрондау арқылы.
Жаңа endpoint/feature алдында `docs/ECOSYSTEM_IMPACT_ANALYSIS.md` толтырыңыз.
