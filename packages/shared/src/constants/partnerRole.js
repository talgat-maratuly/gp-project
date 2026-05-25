/** Роль партнёра для навигации и доступа: specialist | shop | mixed_partner */

export const PARTNER_ROLES = {
  SPECIALIST: 'SPECIALIST',
  SHOP: 'SHOP',
  MIXED_PARTNER: 'MIXED_PARTNER',
}

/** UI/API алиасы из ТЗ */
export const PARTNER_ROLE_LABELS = {
  SPECIALIST: 'Специалист',
  SHOP: 'Магазин',
  MIXED_PARTNER: 'Смешанный (магазин + услуги)',
}

export const PARTNER_ROLE_ALIASES = {
  specialist: PARTNER_ROLES.SPECIALIST,
  shop: PARTNER_ROLES.SHOP,
  mixed_partner: PARTNER_ROLES.MIXED_PARTNER,
}

/** Нормализация partnerRole из UI/API (specialist | shop | mixed_partner | SPECIALIST …) */
export function normalizePartnerRoleInput(role) {
  if (!role) return null
  const raw = String(role).trim()
  const lower = raw.toLowerCase()
  if (PARTNER_ROLE_ALIASES[lower]) return PARTNER_ROLE_ALIASES[lower]
  if (Object.values(PARTNER_ROLES).includes(raw)) return raw
  return null
}

export const SHOP_MAIN_GROUP_IDS = new Set(['shop', 'nursery'])

export function resolvePartnerRoleFromGroups(mainGroupIds = []) {
  const ids = [...mainGroupIds]
  const hasShop = ids.some((id) => SHOP_MAIN_GROUP_IDS.has(id))
  const hasService = ids.some((id) => !SHOP_MAIN_GROUP_IDS.has(id))
  if (hasShop && hasService) return PARTNER_ROLES.MIXED_PARTNER
  if (hasShop) return PARTNER_ROLES.SHOP
  return PARTNER_ROLES.SPECIALIST
}

export function resolvePartnerRoleFromType(partnerType) {
  if (partnerType === 'SHOP') return PARTNER_ROLES.SHOP
  if (!partnerType) return null
  return PARTNER_ROLES.SPECIALIST
}

export function getEffectivePartnerRole(partnerRole, partnerType) {
  return partnerRole || resolvePartnerRoleFromType(partnerType) || PARTNER_ROLES.SPECIALIST
}

export function canAccessShopModule(partnerRole, partnerStatus) {
  if (partnerRole === PARTNER_ROLES.SHOP) return true
  if (partnerRole === PARTNER_ROLES.MIXED_PARTNER) return partnerStatus === 'APPROVED'
  return false
}

export function canAccessServiceModule(partnerRole, partnerStatus) {
  if (partnerRole === PARTNER_ROLES.SPECIALIST) return true
  if (partnerRole === PARTNER_ROLES.MIXED_PARTNER) return partnerStatus === 'APPROVED'
  return false
}

export function getPartnerAccess(user = {}, { isDemoMode = false } = {}) {
  const partnerType =
    user.partnerType || (isDemoMode && !user.partnerRole ? 'LAWN_MOWING' : null)
  const role = getEffectivePartnerRole(user.partnerRole, partnerType)
  const status = user.partnerStatus
  return {
    role,
    partnerType,
    shop: canAccessShopModule(role, status),
    service: canAccessServiceModule(role, status),
  }
}
