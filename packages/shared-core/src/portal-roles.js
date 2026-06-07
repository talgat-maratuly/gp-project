/** GPartners Portal RBAC — UserRole spec (барлық app-тер үшін) */

export const PORTAL_USER_ROLES = {
  CLIENT: 'CLIENT',
  SPECIALIST: 'SPECIALIST',
  GP_OPERATOR: 'GP_OPERATOR',
  FRANCHISE_OWNER: 'FRANCHISE_OWNER',
  GLOBAL_OPERATOR: 'GLOBAL_OPERATOR',
  ADMIN: 'ADMIN',
}

export const ORDER_CREATE_ROLES = [
  PORTAL_USER_ROLES.CLIENT,
  PORTAL_USER_ROLES.GP_OPERATOR,
  PORTAL_USER_ROLES.GLOBAL_OPERATOR,
  PORTAL_USER_ROLES.ADMIN,
]

const FORBIDDEN_WITH_SPECIALIST = [
  PORTAL_USER_ROLES.GP_OPERATOR,
  PORTAL_USER_ROLES.GLOBAL_OPERATOR,
  PORTAL_USER_ROLES.FRANCHISE_OWNER,
]

export function normalizePortalRoles(roles = []) {
  return [...new Set(roles.map(String))].sort()
}

export function assertValidRoleCombination(roles) {
  const set = new Set(normalizePortalRoles(roles))
  if (set.has(PORTAL_USER_ROLES.SPECIALIST)) {
    for (const forbidden of FORBIDDEN_WITH_SPECIALIST) {
      if (set.has(forbidden)) {
        throw new Error(`Role conflict: SPECIALIST cannot combine with ${forbidden}`)
      }
    }
  }
}

export function canCreateOrder(roles = []) {
  const set = new Set(normalizePortalRoles(roles))
  return ORDER_CREATE_ROLES.some((r) => set.has(r))
}

export function canAcceptOrders(roles = []) {
  return normalizePortalRoles(roles).includes(PORTAL_USER_ROLES.SPECIALIST)
}

export function hasGlobalRegionAccess(roles = []) {
  const set = new Set(normalizePortalRoles(roles))
  return (
    set.has(PORTAL_USER_ROLES.GLOBAL_OPERATOR) || set.has(PORTAL_USER_ROLES.ADMIN)
  )
}
