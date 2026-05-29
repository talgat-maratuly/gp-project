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
  on_way: 'ON_WAY',
  in_progress: 'IN_PROCESS',
  completed: 'COMPLETED',
  expired: 'EXPIRED',
  cancelled: 'CANCELED_BY_CLIENT',
  canceled_by_client: 'CANCELED_BY_CLIENT',
  canceled_by_spec: 'CANCELED_BY_SPEC',
  no_show: 'NO_SHOW',
  disputed: 'CANCELED_BY_SPEC',
}

export const ORDER_STATUS_FROM_PRISMA = {
  NEW: 'new',
  ACCEPTED: 'accepted',
  ON_WAY: 'on_way',
  IN_PROCESS: 'in_process',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  CANCELED_BY_CLIENT: 'canceled_by_client',
  CANCELED_BY_SPEC: 'canceled_by_spec',
  NO_SHOW: 'no_show',
}

export const ADMIN_ORDER_UI_TO_PRISMA = {
  new: 'NEW',
  assigned: 'NEW',
  accepted: 'ACCEPTED',
  on_way: 'ON_WAY',
  in_progress: 'IN_PROCESS',
  in_work: 'IN_PROCESS',
  completed: 'COMPLETED',
  expired: 'EXPIRED',
  no_show: 'NO_SHOW',
  cancelled: 'CANCELED_BY_SPEC',
  canceled_by_client: 'CANCELED_BY_CLIENT',
  canceled_by_spec: 'CANCELED_BY_SPEC',
  problem: 'CANCELED_BY_SPEC',
}

export const PRISMA_ORDER_STATUS = [
  'NEW',
  'ACCEPTED',
  'ON_WAY',
  'IN_PROCESS',
  'COMPLETED',
  'EXPIRED',
  'CANCELED_BY_CLIENT',
  'CANCELED_BY_SPEC',
  'NO_SHOW',
]

/** Терминальные статусы — переходы запрещены */
export const TERMINAL_ORDER_STATUS = [
  'COMPLETED',
  'EXPIRED',
  'CANCELED_BY_CLIENT',
  'CANCELED_BY_SPEC',
  'NO_SHOW',
]

export function isTerminalOrderStatus(prismaStatus) {
  return TERMINAL_ORDER_STATUS.includes(prismaStatus)
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
  const id = order?.assignedPartnerId ?? order?.partnerId
  return Boolean(id) && (order?.status === 'NEW' || order?.prismaStatus === 'NEW')
}

export function mapAdminOrderStatusToPrisma(uiStatus) {
  return ADMIN_ORDER_UI_TO_PRISMA[uiStatus] || uiStatus
}
