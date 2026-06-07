/** Роли, навигация и права GP Admin */

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  FRANCHISE_ADMIN: 'FRANCHISE_ADMIN',
  MODERATOR: 'MODERATOR',
  DISPATCHER: 'DISPATCHER',
  VIEWER: 'VIEWER',
  MARKET_MANAGER: 'MARKET_MANAGER',
  DELIVERY_MANAGER: 'DELIVERY_MANAGER',
  MANAGER: 'MANAGER',
  FINANCE: 'FINANCE',
  SUPPORT: 'SUPPORT',
}

/** Основная навигация — без дублей */
export const NAV_ITEMS = [
  {
    path: '/',
    labelKey: 'nav_home',
    icon: 'LayoutDashboard',
    roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'MODERATOR', 'DISPATCHER', 'VIEWER', 'MANAGER', 'FINANCE', 'SUPPORT', 'MARKET_MANAGER', 'DELIVERY_MANAGER'],
  },
  {
    path: '/orders',
    labelKey: 'nav_orders',
    icon: 'ClipboardList',
    roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'MODERATOR', 'DISPATCHER', 'VIEWER', 'MANAGER', 'MARKET_MANAGER', 'DELIVERY_MANAGER'],
  },
  {
    path: '/moderation',
    labelKey: 'nav_moderation',
    icon: 'UserCheck',
    roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'MODERATOR', 'MANAGER'],
  },
  {
    path: '/partners',
    labelKey: 'partners',
    icon: 'Briefcase',
    roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'MODERATOR', 'VIEWER', 'MANAGER'],
  },
  {
    path: '/market/shops',
    labelKey: 'nav_shops',
    icon: 'Store',
    roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'MODERATOR', 'VIEWER', 'MARKET_MANAGER'],
  },
  {
    path: '/clients',
    labelKey: 'clients',
    icon: 'Users',
    roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'MODERATOR', 'VIEWER', 'MANAGER'],
  },
  {
    path: '/services',
    labelKey: 'services',
    icon: 'Wrench',
    roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'MODERATOR', 'VIEWER'],
  },
  {
    path: '/regions',
    labelKey: 'nav_cities',
    icon: 'MapPin',
    roles: ['SUPER_ADMIN'],
  },
  {
    path: '/finance',
    labelKey: 'nav_reports',
    icon: 'BarChart3',
    roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'FINANCE'],
  },
  {
    path: '/settings',
    labelKey: 'settings',
    icon: 'Settings',
    roles: ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'MODERATOR', 'DISPATCHER', 'VIEWER', 'MANAGER', 'FINANCE', 'SUPPORT', 'MARKET_MANAGER', 'DELIVERY_MANAGER'],
  },
]

/** Скрытые маршруты (доступны по URL, не в sidebar) */
export const HIDDEN_ROUTE_PREFIXES = [
  '/franchises',
  '/partners/moderation',
  '/specialists/moderation',
  '/services/moderation',
  '/market/products',
  '/market/orders',
  '/market/delivery',
  '/market',
  '/discounts',
  '/reviews',
  '/qr',
  '/services/subservices',
  '/services/septic-pricing',
  '/services/hunter-irrigation',
  '/services/furniture',
  '/testing-report',
]

export const PAGE_TITLE_KEYS = {
  '/': 'nav_home',
  '/orders': 'nav_orders',
  '/moderation': 'nav_moderation',
  '/partners': 'partners',
  '/market/shops': 'nav_shops',
  '/clients': 'clients',
  '/services': 'nav_service_types',
  '/services/subservices': 'nav_subservice_types',
  '/services/septic-pricing': 'nav_septic_pricing',
  '/regions': 'nav_cities',
  '/finance': 'nav_reports',
  '/settings': 'settings',
  '/franchises': 'franchises',
  '/partners/moderation': 'moderation_block_partners',
  '/specialists/moderation': 'moderation_block_specialists',
  '/services/moderation': 'moderation_block_offerings',
  '/services/hunter-irrigation': 'admin_hunter',
  '/services/furniture': 'admin_furniture',
  '/discounts': 'discounts',
  '/reviews': 'reviewsFull',
  '/qr': 'qr_service',
  '/qr/create': 'qr_service',
  '/market': 'market_dashboard',
  '/market/products': 'market_products',
  '/market/products/moderation': 'product_moderation',
  '/market/orders': 'market_orders',
  '/market/delivery': 'market_delivery',
  '/testing-report': 'qa_dashboard',
}

/** Действия для проверки can() */
export const ACTIONS = {
  FRANCHISE_CREATE: 'franchise:create',
  FRANCHISE_DELETE: 'franchise:delete',
  FRANCHISE_BLOCK: 'franchise:block',
  GEOGRAPHY_CRUD: 'geography:crud',
  CLIENT_CRUD: 'client:crud',
  PARTNER_CRUD: 'partner:crud',
  PARTNER_MODERATE: 'partner:moderate',
  SERVICE_CRUD: 'service:crud',
  ORDER_EDIT: 'order:edit',
  PRODUCT_MODERATE: 'product:moderate',
  DISCOUNT_CRUD: 'discount:crud',
  SETTINGS_EDIT: 'settings:edit',
}

const ROLE_ACTIONS = {
  SUPER_ADMIN: Object.values(ACTIONS),
  FRANCHISE_ADMIN: [
    ACTIONS.CLIENT_CRUD,
    ACTIONS.PARTNER_CRUD,
    ACTIONS.PARTNER_MODERATE,
    ACTIONS.SERVICE_CRUD,
    ACTIONS.ORDER_EDIT,
    ACTIONS.PRODUCT_MODERATE,
    ACTIONS.DISCOUNT_CRUD,
  ],
  MODERATOR: [ACTIONS.PARTNER_MODERATE],
  DISPATCHER: [ACTIONS.ORDER_EDIT],
  VIEWER: [],
  MANAGER: [ACTIONS.ORDER_EDIT, ACTIONS.PARTNER_MODERATE],
  FINANCE: [],
  SUPPORT: [],
  MARKET_MANAGER: [ACTIONS.ORDER_EDIT, ACTIONS.PRODUCT_MODERATE],
  DELIVERY_MANAGER: [ACTIONS.ORDER_EDIT],
}

export function navForRole(role) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}

export function canAccess(role, path) {
  if (role === ROLES.SUPER_ADMIN) return true
  if (path === '/' || path === '') return true
  if (NAV_ITEMS.some((n) => (n.path === path || (n.path !== '/' && path.startsWith(n.path))) && n.roles.includes(role))) {
    return true
  }
  return HIDDEN_ROUTE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
    && role !== ROLES.VIEWER
}

export function canPerform(role, action) {
  if (action === ACTIONS.SETTINGS_EDIT) return role === ROLES.SUPER_ADMIN
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
