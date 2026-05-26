import { PARTNER_ROLES } from './roles.js'
import { isPartnerActiveForOrders } from './statuses.js'

const ACTIVE_PARTNER = new Set(['APPROVED', 'active'])

function isPartnerActive(partnerStatus) {
  return ACTIVE_PARTNER.has(partnerStatus)
}

/** Partner app: shop vs service modules */
export function canAccessShopModule(partnerRole, partnerStatus) {
  if (!isPartnerActive(partnerStatus)) return false
  if (partnerRole === PARTNER_ROLES.SHOP) return true
  if (partnerRole === PARTNER_ROLES.MIXED_PARTNER) return true
  return false
}

export function canAccessServiceModule(partnerRole, partnerStatus) {
  if (!isPartnerActive(partnerStatus)) return false
  if (partnerRole === PARTNER_ROLES.SPECIALIST) return true
  if (partnerRole === PARTNER_ROLES.MIXED_PARTNER) return true
  return false
}

export function getPartnerAccess(user = {}, { isDemoMode = false, storeUiState = null } = {}) {
  const partnerType =
    user.partnerType || (isDemoMode && !user.partnerRole ? 'LAWN_MOWING' : null)
  const role = user.partnerRole || (partnerType === 'SHOP' ? PARTNER_ROLES.SHOP : PARTNER_ROLES.SPECIALIST)
  const status = user.partnerStatus
  const roleShop = canAccessShopModule(role, status)
  const shopProducts = roleShop && storeUiState === 'APPROVED'
  return {
    role,
    partnerType,
    shop: roleShop,
    shopProducts,
    storeUiState,
    service: canAccessServiceModule(role, status),
    canReceiveOrders: isPartnerActiveForOrders(status),
  }
}

/** Admin panel actions */
export const ADMIN_ACTIONS = {
  FRANCHISE_CREATE: 'franchise:create',
  FRANCHISE_DELETE: 'franchise:delete',
  FRANCHISE_BLOCK: 'franchise:block',
  CLIENT_CRUD: 'client:crud',
  PARTNER_CRUD: 'partner:crud',
  PARTNER_MODERATE: 'partner:moderate',
  SERVICE_CRUD: 'service:crud',
  ORDER_EDIT: 'order:edit',
  PRODUCT_MODERATE: 'product:moderate',
  DISCOUNT_CRUD: 'discount:crud',
  SETTINGS_EDIT: 'settings:edit',
}

export const ADMIN_ROLE_ACTIONS = {
  SUPER_ADMIN: Object.values(ADMIN_ACTIONS),
  FRANCHISE_ADMIN: [
    ADMIN_ACTIONS.CLIENT_CRUD,
    ADMIN_ACTIONS.PARTNER_CRUD,
    ADMIN_ACTIONS.PARTNER_MODERATE,
    ADMIN_ACTIONS.SERVICE_CRUD,
    ADMIN_ACTIONS.ORDER_EDIT,
    ADMIN_ACTIONS.PRODUCT_MODERATE,
    ADMIN_ACTIONS.DISCOUNT_CRUD,
    ADMIN_ACTIONS.SETTINGS_EDIT,
  ],
  MANAGER: [ADMIN_ACTIONS.ORDER_EDIT, ADMIN_ACTIONS.PARTNER_MODERATE],
  MARKET_MANAGER: [ADMIN_ACTIONS.ORDER_EDIT, ADMIN_ACTIONS.PRODUCT_MODERATE],
  DELIVERY_MANAGER: [ADMIN_ACTIONS.ORDER_EDIT],
  FINANCE: [],
  SUPPORT: [],
}

export function adminCan(role, action) {
  if (role === 'SUPER_ADMIN') return true
  return (ADMIN_ROLE_ACTIONS[role] || []).includes(action)
}
