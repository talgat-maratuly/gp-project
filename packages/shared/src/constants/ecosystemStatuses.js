/**
 * Единый слой статусов GP ecosystem.
 * Prisma/API (SCREAMING_SNAKE) ↔ spec (snake_case) ↔ UI labels.
 * Backend остаётся источником правды; фронты используют эти маппинги.
 */

/** Partner account (PartnerProfile.status) */
export const PARTNER_STATUS_SPEC = {
  pending_moderation: 'PENDING_REVIEW',
  active: 'APPROVED',
  rejected: 'REJECTED',
  blocked: 'SUSPENDED',
  needs_revision: 'NEEDS_REVISION',
  draft: 'DRAFT',
}

export const PARTNER_STATUS_FROM_PRISMA = Object.fromEntries(
  Object.entries(PARTNER_STATUS_SPEC).map(([spec, prisma]) => [prisma, spec]),
)

export const PARTNER_STATUS_LABELS_RU = {
  pending_moderation: 'На модерации',
  active: 'Активен',
  rejected: 'Отклонён',
  blocked: 'Заблокирован',
  needs_revision: 'На доработке',
  draft: 'Черновик',
}

/** Partner offering / service subservice (PartnerOfferingStatus) */
export const SERVICE_STATUS_SPEC = {
  pending_moderation: 'PENDING_MODERATION',
  active: 'ACTIVE',
  rejected: 'REJECTED',
  hidden: 'TEMPORARILY_BLOCKED',
}

export const SERVICE_STATUS_FROM_PRISMA = Object.fromEntries(
  Object.entries(SERVICE_STATUS_SPEC).map(([spec, prisma]) => [prisma, spec]),
)

/** Market product visibility (MarketProduct.isActive + Store.status) */
export const PRODUCT_STATUS_SPEC = {
  draft: 'DRAFT',
  pending_moderation: 'PENDING_REVIEW',
  active: 'ACTIVE',
  rejected: 'REJECTED',
  hidden: 'HIDDEN',
}

/** Order (OrderStatus) — spec → Prisma */
export const ORDER_STATUS_SPEC = {
  created: 'NEW',
  assigned: 'NEW', // partnerId set, still NEW until partner accepts
  accepted: 'ACCEPTED',
  in_progress: 'ON_THE_WAY',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
  disputed: 'CANCELLED', // no enum yet; map for UI only
}

export const ORDER_STATUS_FROM_PRISMA = {
  NEW: 'created',
  ACCEPTED: 'accepted',
  ON_THE_WAY: 'in_progress',
  ARRIVED: 'in_progress',
  STARTED: 'in_progress',
  LOADED: 'in_progress',
  DISPOSAL_ARRIVED: 'in_progress',
  DISPOSAL_COMPLETED: 'in_progress',
  COMPLETED: 'completed',
  CLIENT_CONFIRMED: 'completed',
  CANCELLED: 'cancelled',
}

/** Admin UI slugs (legacy admin store) → Prisma OrderStatus */
export const ADMIN_ORDER_UI_TO_PRISMA = {
  new: 'NEW',
  assigned: 'NEW',
  in_progress: 'ON_THE_WAY',
  in_work: 'STARTED',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
  problem: 'CANCELLED',
}

export function partnerStatusToSpec(prismaStatus) {
  return PARTNER_STATUS_FROM_PRISMA[prismaStatus] || prismaStatus
}

export function partnerStatusLabel(prismaOrSpec) {
  const spec = PARTNER_STATUS_FROM_PRISMA[prismaOrSpec] || prismaOrSpec
  return PARTNER_STATUS_LABELS_RU[spec] || prismaOrSpec
}

export function isPartnerActiveForOrders(partnerStatus) {
  return partnerStatus === 'APPROVED' || partnerStatus === PARTNER_STATUS_SPEC.active
}

export function orderHasAssignedPartner(order) {
  return Boolean(order?.partnerId) && order?.status === 'NEW'
}
