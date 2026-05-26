/** API auth/me → сессия GP Admin (рөлдер Prisma Role) */

export const API_ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN', 'REGION_ADMIN'])

export function mapMeToAdminSession(me) {
  if (!me || !API_ADMIN_ROLES.has(me.role)) return null

  let role = 'MANAGER'
  if (me.role === 'SUPER_ADMIN' || me.role === 'ADMIN') role = 'SUPER_ADMIN'
  if (me.role === 'REGION_ADMIN') role = 'FRANCHISE_ADMIN'

  const franchiseId =
    me.role === 'REGION_ADMIN' && me.region?.code ? `fr-${me.region.code}` : null

  return {
    username: me.email,
    role,
    name: me.name || 'GP Admin',
    franchiseId,
    regionId: me.regionId ?? null,
  }
}

export function isApiAdminUser(me) {
  return Boolean(me && API_ADMIN_ROLES.has(me.role))
}
