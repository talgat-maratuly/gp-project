/** Canonical GP roles — single source for all apps */

export const USER_ROLES = {
  CLIENT: 'CLIENT',
  PARTNER: 'PARTNER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  REGION_ADMIN: 'REGION_ADMIN',
}

/** Partner navigation / access (Prisma PartnerRole) */
export const PARTNER_ROLES = {
  SPECIALIST: 'SPECIALIST',
  SHOP: 'SHOP',
  MIXED_PARTNER: 'MIXED_PARTNER',
}

export const PARTNER_ROLE_LABELS = {
  SPECIALIST: 'Специалист',
  SHOP: 'Магазин',
  MIXED_PARTNER: 'Смешанный (магазин + услуги)',
}

export const PARTNER_ROLE_ALIASES = {
  specialist: PARTNER_ROLES.SPECIALIST,
  shop: PARTNER_ROLES.SHOP,
  mixed_partner: PARTNER_ROLES.MIXED_PARTNER,
  client: USER_ROLES.CLIENT,
}

/** Admin panel roles (demo / local RBAC) */
export const ADMIN_PANEL_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  FRANCHISE_ADMIN: 'FRANCHISE_ADMIN',
  MARKET_MANAGER: 'MARKET_MANAGER',
  DELIVERY_MANAGER: 'DELIVERY_MANAGER',
  MANAGER: 'MANAGER',
  FINANCE: 'FINANCE',
  SUPPORT: 'SUPPORT',
}

export const SHOP_MAIN_GROUP_IDS = new Set(['shop', 'nursery'])

export function normalizePartnerRoleInput(role) {
  if (!role) return null
  const raw = String(role).trim()
  const lower = raw.toLowerCase()
  if (PARTNER_ROLE_ALIASES[lower]) return PARTNER_ROLE_ALIASES[lower]
  if (Object.values(PARTNER_ROLES).includes(raw)) return raw
  return null
}

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
