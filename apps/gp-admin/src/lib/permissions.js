/** Роли, навигация и права GP Admin */

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  FRANCHISE_ADMIN: 'FRANCHISE_ADMIN',
  MARKET_MANAGER: 'MARKET_MANAGER',
  DELIVERY_MANAGER: 'DELIVERY_MANAGER',
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
  { path: '/partners/moderation', labelKey: 'partner_moderation', icon: 'UserCheck', roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'MANAGER'] },
  { path: '/services', labelKey: 'services', icon: 'Wrench', roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN'] },
  { path: '/services/hunter-irrigation', labelKey: 'admin_hunter', icon: 'Droplets', roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'MANAGER'] },
  { path: '/services/furniture', labelKey: 'admin_furniture', icon: 'LayoutGrid', roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'MANAGER'] },
  { path: '/discounts', labelKey: 'discounts', icon: 'Percent', roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN'] },
  { path: '/finance', labelKey: 'finance', icon: 'Wallet', roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'FINANCE'] },
  { path: '/reviews', labelKey: 'reviews', icon: 'MessageSquare', roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'SUPPORT'] },
  { path: '/qr', labelKey: 'qr_service', icon: 'QrCode', roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'MANAGER'] },
  { path: '/market', labelKey: 'market_dashboard', icon: 'ShoppingBag', roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'MARKET_MANAGER'] },
  { path: '/market/shops', labelKey: 'market_shops', icon: 'Store', roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'MARKET_MANAGER'] },
  { path: '/market/products', labelKey: 'market_products', icon: 'Package', roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'MARKET_MANAGER'] },
  { path: '/market/orders', labelKey: 'market_orders', icon: 'ShoppingCart', roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'MARKET_MANAGER', 'DELIVERY_MANAGER'] },
  { path: '/market/delivery', labelKey: 'market_delivery', icon: 'Truck', roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'MARKET_MANAGER', 'DELIVERY_MANAGER'] },
  { path: '/settings', labelKey: 'settings', icon: 'Settings', roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN'] },
  { path: '/testing-report', labelKey: 'qa_dashboard', icon: 'FlaskConical', roles: ['SUPER_ADMIN'] },
]

export const PAGE_TITLE_KEYS = {
  '/': 'dashboard',
  '/franchises': 'franchises',
  '/orders': 'orders',
  '/clients': 'clients',
  '/partners': 'partners',
  '/partners/moderation': 'partner_moderation',
  '/services': 'services',
  '/services/hunter-irrigation': 'admin_hunter',
  '/services/furniture': 'admin_furniture',
  '/discounts': 'discounts',
  '/finance': 'finance',
  '/reviews': 'reviewsFull',
  '/qr': 'qr_service',
  '/qr/create': 'qr_service',
  '/market': 'market_dashboard',
  '/market/shops': 'market_shops',
  '/market/products': 'market_products',
  '/market/orders': 'market_orders',
  '/market/delivery': 'market_delivery',
  '/settings': 'settings',
  '/testing-report': 'qa_dashboard',
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
  MARKET_MANAGER: [ACTIONS.ORDER_EDIT],
  DELIVERY_MANAGER: [ACTIONS.ORDER_EDIT],
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
