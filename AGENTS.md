# GP Monorepo — Agent Guide

**Одна экосистема GP**, не три отдельных сайта.

## Stack

| Layer | Path |
|-------|------|
| GP Service (client) | `apps/gp-service` |
| GP Partner | `apps/gp-partner` |
| GP Admin | `apps/gp-admin` |
| Backend API | `apps/api` |
| PostgreSQL | Prisma `apps/api/prisma` |
| Deploy | `deploy/` (Docker, nginx) |
| Shared | `packages/shared` |

## Rules (обязательно)

1. `.cursor/rules/gp-ecosystem-sync.mdc` — связанные изменения во всех apps
2. `.cursor/rules/gp-monorepo.mdc` — deploy, validation, DevOps mindset

## Ecosystem contract

`packages/shared/src/ecosystem/manifest.js` — сервисы, env, API methods, shared modules.

Import: `@gp/shared/ecosystem`

## STABILIZATION MODE + CORE FREEZE

**No new features. No constant rewrites of `@gp/shared-core`.**

Frozen until stable: auth, roles, statuses, shared-core, moderation, orders, partner flows, deploy.

Rule: `.cursor/rules/gp-core-freeze.mdc`

**Before any new module/feature:** complete `docs/ECOSYSTEM_IMPACT_ANALYSIS.md`.

> **What connected systems will break?**  
> If unclear → **do not implement yet.**

## Pre-commit / pre-deploy

```bash
npm run ecosystem:check            # REQUIRED before deploy (builds all apps)
npm run validate:ecosystem:quick   # fast local (~1–2 min)
npm run validate:ecosystem:docker  # + Docker images
```

Audit report: `docs/STABILIZATION_AUDIT.md`

## Shared (единые контракты)

| Module | Path |
|--------|------|
| API client | `@gp/shared/api` |
| Statuses | `@gp/shared/constants` → `ecosystemStatuses.js` |
| Partner roles | `partnerRole.js` |
| Auth test | `@gp/shared/utils`, `@gp/shared/testMode` |
| Demo | `@gp/shared/demo` |

## Backend truth

- Auth: `apps/api/src/auth/`
- Partner moderation: `apps/api/src/admin/`, `partner-moderation.service.ts`
- Orders: `apps/api/src/orders/`
- Market: `apps/api/src/market/`

Global prefix: `/api` (health без prefix).

## Local dev

```bash
npm run prisma:migrate:deploy
npm run prisma:generate
npm run prisma:seed
npm run dev:all
```

## If deploy fails

1. Identify failing service (API / Service / Partner / Admin / Postgres / nginx)
2. Read logs — migration? build? env? CORS?
3. Fix dependency chain end-to-end
4. Re-run `npm run validate:ecosystem`

Never fix only one frontend screen when the issue is shared auth, DTO, or schema.
