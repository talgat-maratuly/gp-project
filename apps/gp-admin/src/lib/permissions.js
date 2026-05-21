/** Роли, навигация и права GP Admin */

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  FRANCHISE_ADMIN: 'FRANCHISE_ADMIN',
  MANAGER: 'MANAGER',
  FINANCE: 'FINANCE',
  SUPPORT: 'SUPPORT',
}

export const NAV_ITEMS = [
  { path: '/', labelKey: 'dashboard', icon: 'LayoutDashboard', roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'MANAGER', 'FINANCE', 'SUPPORT'] },
  { path: '/franchises', labelKey: 'franchises', icon: 'Building2', roles: ['SUPER_ADMIN'] },
  { path: '/orders', labelKey: 'orders', icon: 'ClipboardList', roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'MANAGER'] },
  { path: '/clients', labelKey: 'clients', icon: 'Users', roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'MANAGER'] },
  { path: '/partners', labelKey: 'partners', icon: 'Briefcase', roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'MANAGER'] },
  { path: '/services', labelKey: 'services', icon: 'Wrench', roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN'] },
  { path: '/discounts', labelKey: 'discounts', icon: 'Percent', roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN'] },
  { path: '/finance', labelKey: 'finance', icon: 'Wallet', roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'FINANCE'] },
  { path: '/reviews', labelKey: 'reviews', icon: 'MessageSquare', roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'SUPPORT'] },
  { path: '/settings', labelKey: 'settings', icon: 'Settings', roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN'] },
]

export const PAGE_TITLE_KEYS = {
  '/': 'dashboard',
  '/franchises': 'franchises',
  '/orders': 'orders',
  '/clients': 'clients',
  '/partners': 'partners',
  '/services': 'services',
  '/discounts': 'discounts',
  '/finance': 'finance',
  '/reviews': 'reviewsFull',
  '/settings': 'settings',
}

/** Действия для проверки can() */
export const ACTIONS = {
  FRANCHISE_CREATE: 'franchise:create',
  FRANCHISE_DELETE: 'franchise:delete',
  FRANCHISE_BLOCK: 'franchise:block',
  CLIENT_CRUD: 'client:crud',
  PARTNER_CRUD: 'partner:crud',
  SERVICE_CRUD: 'service:crud',
  ORDER_EDIT: 'order:edit',
  DISCOUNT_CRUD: 'discount:crud',
  SETTINGS_EDIT: 'settings:edit',
}

const ROLE_ACTIONS = {
  SUPER_ADMIN: Object.values(ACTIONS),
  FRANCHISE_ADMIN: [
    ACTIONS.CLIENT_CRUD,
    ACTIONS.PARTNER_CRUD,
    ACTIONS.SERVICE_CRUD,
    ACTIONS.ORDER_EDIT,
    ACTIONS.DISCOUNT_CRUD,
    ACTIONS.SETTINGS_EDIT,
  ],
  MANAGER: [ACTIONS.ORDER_EDIT],
  FINANCE: [],
  SUPPORT: [],
}

export function navForRole(role) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}

export function canAccess(role, path) {
  if (role === ROLES.SUPER_ADMIN) return true
  if (path === '/' || path === '') return true
  return NAV_ITEMS.some(
    (n) => (n.path === path || (n.path !== '/' && path.startsWith(n.path))) && n.roles.includes(role),
  )
}

export function canPerform(role, action) {
  return (ROLE_ACTIONS[role] || []).includes(action)
}

export function isSuperAdmin(role) {
  return role === ROLES.SUPER_ADMIN
}

export function canManageFranchise(role) {
  return role === ROLES.SUPER_ADMIN
}

/** Эффективный franchiseId для фильтра данных */
export function resolveFranchiseFilter(user, selectedFranchiseId) {
  if (isSuperAdmin(user.role)) {
    return selectedFranchiseId === 'all' ? null : selectedFranchiseId
  }
  return user.franchiseId || null
}

export function scopeByFranchise(list, franchiseId) {
  if (!franchiseId || !Array.isArray(list)) return list
  return list.filter((item) => item.franchiseId === franchiseId)
}

export function franchiseStats(store, franchiseId) {
  const clients = scopeByFranchise(store.clients, franchiseId)
  const partners = scopeByFranchise(store.partners, franchiseId)
  const orders = scopeByFranchise(store.orders, franchiseId)
  const completed = orders.filter((o) => o.status === 'completed')
  return {
    clients: clients.length,
    partners: partners.length,
    orders: orders.length,
    turnover: completed.reduce((s, o) => s + o.amount, 0),
  }
}
