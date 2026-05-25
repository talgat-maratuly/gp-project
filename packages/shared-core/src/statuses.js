/** Canonical statuses — Prisma ↔ spec ↔ UI */

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

export const SERVICE_STATUS_SPEC = {
  pending_moderation: 'PENDING_MODERATION',
  active: 'ACTIVE',
  rejected: 'REJECTED',
  hidden: 'TEMPORARILY_BLOCKED',
}

export const SERVICE_STATUS_FROM_PRISMA = Object.fromEntries(
  Object.entries(SERVICE_STATUS_SPEC).map(([spec, prisma]) => [prisma, spec]),
)

export const PRODUCT_STATUS_SPEC = {
  draft: 'DRAFT',
  pending_moderation: 'PENDING_REVIEW',
  active: 'ACTIVE',
  rejected: 'REJECTED',
  hidden: 'HIDDEN',
}

export const ORDER_STATUS_SPEC = {
  created: 'NEW',
  assigned: 'NEW',
  accepted: 'ACCEPTED',
  in_progress: 'ON_THE_WAY',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
  disputed: 'CANCELLED',
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

export const ADMIN_ORDER_UI_TO_PRISMA = {
  new: 'NEW',
  assigned: 'NEW',
  in_progress: 'ON_THE_WAY',
  in_work: 'STARTED',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
  problem: 'CANCELLED',
}

export const PRISMA_ORDER_STATUS = [
  'NEW',
  'ACCEPTED',
  'ON_THE_WAY',
  'ARRIVED',
  'STARTED',
  'LOADED',
  'DISPOSAL_ARRIVED',
  'DISPOSAL_COMPLETED',
  'COMPLETED',
  'CLIENT_CONFIRMED',
  'CANCELLED',
]

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
  const id = order?.assignedPartnerId ?? order?.partnerId
  return Boolean(id) && (order?.status === 'NEW' || order?.prismaStatus === 'NEW')
}

export function mapAdminOrderStatusToPrisma(uiStatus) {
  return ADMIN_ORDER_UI_TO_PRISMA[uiStatus] || uiStatus
}
