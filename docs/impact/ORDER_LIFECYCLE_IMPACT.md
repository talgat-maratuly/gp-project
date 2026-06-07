# Ecosystem impact analysis — Order Lifecycle & Notification System

Filled from `docs/ECOSYSTEM_IMPACT_ANALYSIS.md`. **CORE FREEZE is intentionally updated everywhere** (explicit user decision: proceed + replace + full).

## Feature / change

- **Title:** Order lifecycle state machine, expired/no_show automation, event-driven notifications, audit log, client/spec cancellation, re-create.
- **Requester / date:** Product owner — 2026-05-29.

## 1. What connected systems will break?

| System | Will change? | Risk if wrong |
|--------|--------------|---------------|
| GP Service (`apps/gp-service`) | yes | Status labels, CTA per status, cancel/recreate flows |
| GP Partner (`apps/gp-partner`) | yes | Partner status actions, cancel-with-reason |
| GP Admin (`apps/gp-admin`) | yes | Admin status dropdown, audit timeline |
| Backend API (`apps/api`) | yes | OrderStatus enum replaced, septic GPS moved to `septicStage` |
| Prisma schema / migrations | yes | enum rename + data migration of existing rows + new tables |
| `@gp/shared` / `@gp/shared-core` | yes | `statuses.js`, `mappers.js`, `manifest.js`, `client.js` |
| Docker / CI (`deploy/`, workflows) | no | none |
| Env vars | no | push is hook-only stub for now |

## 2. Frozen core touched? (intentional)

- [x] Statuses (`@gp/shared-core/statuses`) — replaced with spec model.
- [x] Orders (create → assign → accept → complete) — central state machine added.
- [ ] Auth / Roles / Moderation / Partner flows / Deploy — untouched.

## 3. Status model decision

Spec canonical statuses become the **single source of truth**:

```
NEW · ACCEPTED · ON_WAY · IN_PROCESS · COMPLETED
EXPIRED · CANCELED_BY_CLIENT · CANCELED_BY_SPEC · NO_SHOW
```

Septic granular sub-states (`ARRIVED, PUMPING, LOADED, DISPOSAL_ARRIVED, DISPOSAL_COMPLETED`)
moved to a new `Order.septicStage` field so the **GPS flow keeps working** instead of being deleted.
`CLIENT_CONFIRMED` removed as a status — represented by `clientConfirmedAt` timestamp on a `COMPLETED` order.

Data migration maps old rows:
`ON_THE_WAY→ON_WAY`, `ARRIVED→ON_WAY(+septicStage)`, `STARTED/LOADED/DISPOSAL_*→IN_PROCESS(+septicStage)`,
`CLIENT_CONFIRMED→COMPLETED`, `CANCELLED→CANCELED_BY_SPEC` (default; client-initiated unknown historically).

## 4. Validation plan

```bash
npm run ecosystem:check
```

Manual flows:
- [ ] Client create → admin assign → partner accept → on_way → in_process → completed → client confirm
- [ ] Client cancel (with reason) / Spec cancel (with reason)
- [ ] Cron: NEW past schedule → EXPIRED; ACCEPTED + 1 day no start → NO_SHOW
- [ ] Re-create from terminal order
- [ ] Septic GPS still drives septicStage + main status

## Decision

- [x] **Implement** — impact clear, frozen core intentionally updated across all apps.
