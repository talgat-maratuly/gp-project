# Ecosystem impact analysis (required before new features)

**CORE FREEZE is active.** See `.cursor/rules/gp-core-freeze.mdc`.

Copy this template into a PR or task notes before implementing anything beyond stabilization fixes.

## Feature / change

- **Title:**
- **Requester / date:**

## 1. What connected systems will break?

| System | Will change? | Risk if wrong |
|--------|--------------|---------------|
| GP Service (`apps/gp-service`) | ☐ | |
| GP Partner (`apps/gp-partner`) | ☐ | |
| GP Admin (`apps/gp-admin`) | ☐ | |
| Backend API (`apps/api`) | ☐ | |
| Prisma schema / migrations | ☐ | |
| `@gp/shared` / `@gp/shared-core` | ☐ | |
| Docker / CI (`deploy/`, workflows) | ☐ | |
| Env vars (`.env.example`, secrets) | ☐ | |

**If any row is “unknown” → stop. Investigate before coding.**

## 2. Frozen core touched?

- ☐ Auth
- ☐ Roles (`@gp/shared-core/roles`)
- ☐ Statuses (`@gp/shared-core/statuses`)
- ☐ shared-core package structure
- ☐ Moderation (partner / offerings / market)
- ☐ Orders (create → assign → accept → complete)
- ☐ Partner flows (register → approve → modules)
- ☐ Deploy pipeline

**Touching frozen core requires explicit justification and cross-app diff.**

## 3. Minimal change set (all apps in one task)

List files/services that **must** ship together:

```
-
```

## 4. Validation plan

```bash
npm run ecosystem:check
# optional: npm run validate:ecosystem:docker
```

Manual flows to verify:

- [ ] Client register / login (Service)
- [ ] Partner register → Admin moderate → Partner approved
- [ ] Order: Service create → Admin assign → Partner accept → status sync
- [ ] Deploy images build (if touching Docker/shared exports)

## Decision

- ☐ **Implement** — impact clear, frozen core respected or intentionally updated everywhere
- ☐ **Defer** — impact unclear or core not stable yet
- ☐ **Reject** — isolated UI / single-app patch without API contract
