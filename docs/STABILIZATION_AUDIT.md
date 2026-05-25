# GP Ecosystem Stabilization Audit

**Mode:** STABILIZATION (no new features)  
**Date:** 2026-05-25

## Executive summary

| Area | Status | Action taken |
|------|--------|--------------|
| Admin production build | **BROKEN** → **FIXED** | Missing `@gp/shared` export for `ecosystemStatuses` |
| GitHub Actions deploy | **RISK** → **GATED** | Added `ci.yml` + health gate before docker push |
| Shared enums/roles | **DRIFT** → **CORE** | New `@gp/shared-core` canonical package |
| Admin order assign (API mode) | **BROKEN** → **FIXED** (prior session) | `adminAssignOrder` wired |
| Partner shop before approve | **BROKEN** → **FIXED** (prior session) | `canAccessShopModule` requires `APPROVED` |
| Order assigned → partner accept | **BROKEN** → **FIXED** (prior session) | Pre-assigned `partnerId` on `NEW` |

---

## Phase 1 — Broken connections (root causes)

### 1. Admin build failure (CI / deploy red)

- **Symptom:** `gp-admin` vite build fails on import `@gp/shared/constants/ecosystemStatuses`
- **Cause:** `package.json` `exports` did not expose subpath `./constants/ecosystemStatuses`
- **Chain:** Admin pages → shared constants → missing export → Docker `gp-admin` image never builds
- **Services:** gp-admin, GitHub Actions `deploy-production.yml`

### 2. Deploy without validation gate

- **Symptom:** Red deploys on `main` with broken frontends
- **Cause:** Workflow pushed Docker images without `npm run build` for all apps
- **Chain:** merge → docker build fails late → production broken
- **Services:** all containers

### 3. Duplicated ecosystem logic

- **Symptom:** Statuses/roles in multiple files; drift between Service/Partner/Admin
- **Cause:** No single `@gp/shared-core`; partial copies in `ecosystemStatuses.js`, `partnerRole.js`, admin `permissions.js`
- **Services:** all frontends + shared

### 4. Admin orders (API mode) — local-only assign

- **Symptom:** Assign partner in Admin did not persist after refresh
- **Cause:** `StoreContext.assignPartner` only updated in-memory when `apiMode`
- **Services:** gp-admin, backend (no assign endpoint consumed)

### 5. Status vocabulary mismatch (by design, documented)

- **Spec:** `pending_moderation`, `active`, `created`, `assigned`
- **Prisma:** `PENDING_REVIEW`, `APPROVED`, `NEW`, …
- **Mitigation:** `@gp/shared-core/statuses` mapping layer (not a second enum in DB)

### 6. Product moderation UI

- **Was:** Demo-only toggle on `MarketProductsPage`
- **Now:** `/market/products/moderation` + API `adminModerateMarketProduct`

---

## Phase 2 — Shared core (`packages/shared-core`)

| Module | Purpose |
|--------|---------|
| `roles.js` | USER_ROLES, PARTNER_ROLES, aliases, resolve from groups |
| `statuses.js` | Partner/order/service/product status maps |
| `permissions.js` | Partner nav access, admin actions |
| `api-contracts.js` | Required API client methods + backend route checks |
| `ecosystem-types.js` | Services, env contract |
| `validation.js` | Export + API method assertions |

`@gp/shared` re-exports for backward compatibility.

---

## Phase 3–5 — Auth, roles, orders (stabilized)

- Registration: optional test fields; server autofill; `partnerRole` required
- Partner: `PENDING_REVIEW` → Admin moderation → `APPROVED` → modules unlocked
- Orders: Client create → Admin assign → Partner accept → shared status maps

---

## Phase 6 — Deployment

### Commands (required before deploy)

```bash
npm run ecosystem:check          # full gate (replaces predeploy)
npm run validate:ecosystem:quick # fast local check
```

### GitHub Actions

- **`ci.yml`** — PR/push: ecosystem-check + docker smoke
- **`deploy-production.yml`** — `ecosystem-health` job before build-and-push

---

## Phase 7 — Health checker

`scripts/ecosystem-check.mjs`:

1. shared-core exports
2. API contract
3. Backend routes
4. env + prisma + typecheck
5. build api, service, partner, admin
6. optional `--flows` (register client/partner against local API)

---

## Phase 8 — Dead UI (known limits)

| Item | Status |
|------|--------|
| Admin `PartnersPage` legacy local flags | Still demo-oriented; use `/partners/moderation` in API mode |
| Admin order edit fields | API mode updates status/assign; full edit partial |
| Service `cancelOrder` API-only throw | Hidden in API mode or demo |

No new dead buttons added in this stabilization pass.

---

## Dependency chain (deploy failure)

```
code change → missing shared export → admin build fail
           → docker build fail → GH Actions red
           → no new image → OR broken image on server
```

**Fix:** ecosystem-check on every PR + before deploy.

---

## Maintenance rule

Any change touching auth, status, role, DTO, or Prisma → run:

```bash
npm run ecosystem:check
```

Update **all** of: Service, Partner, Admin, API, `@gp/shared-core`, migrations.
