/** Навигация GP Partner по partnerType */

export const SHOP_PARTNER_TYPE = 'SHOP'

export function isShopPartner(partnerType) {
  return partnerType === SHOP_PARTNER_TYPE
}

export function isServicePartner(partnerType) {
  return Boolean(partnerType && partnerType !== SHOP_PARTNER_TYPE)
}

/** Нижнее меню (до 5 пунктов) */
export function getPartnerBottomNav(partnerType, { isDemoMode = false } = {}) {
  const type = partnerType || (isDemoMode ? 'LAWN_MOWING' : null)

  if (isShopPartner(type)) {
    return [
      { to: '/', icon: 'LayoutDashboard', labelKey: 'shop_dashboard', end: true },
      { to: '/shop', icon: 'Package', labelKey: 'market_products' },
      { to: '/catalog/add', icon: 'PlusCircle', labelKey: 'market_add_product' },
      { to: '/shop/orders', icon: 'ShoppingCart', labelKey: 'market_orders' },
      { to: '/profile', icon: 'User', labelKey: 'nav_profile' },
    ]
  }

  const nav = [
    { to: '/', icon: 'LayoutDashboard', labelKey: 'nav_home', end: true },
    { to: '/orders/new', icon: 'Inbox', labelKey: 'new_orders_title' },
    { to: '/orders', icon: 'ClipboardList', labelKey: 'nav_orders' },
    { to: '/balance', icon: 'Wallet', labelKey: 'nav_payouts' },
    { to: '/profile', icon: 'User', labelKey: 'nav_profile' },
  ]

  if (type === 'SEPTIC_SERVICE') {
    return [
      { to: '/', icon: 'LayoutDashboard', labelKey: 'nav_home', end: true },
      { to: '/orders', icon: 'ClipboardList', labelKey: 'nav_orders' },
      { to: '/map', icon: 'Map', labelKey: 'nav_map' },
      { to: '/balance', icon: 'Wallet', labelKey: 'nav_payouts' },
      { to: '/profile', icon: 'User', labelKey: 'nav_profile' },
    ]
  }

  return nav
}

/** Разрешённые path-префиксы для редиректа */
export function getAllowedPathPrefixes(partnerType, { isDemoMode = false } = {}) {
  const common = ['/apply', '/profile']
  const type = partnerType || (isDemoMode ? 'LAWN_MOWING' : null)

  if (isShopPartner(type)) {
    return ['/', '/shop', '/catalog', ...common]
  }

  const service = [
    '/',
    '/orders',
    '/schedule',
    '/photos',
    '/balance',
    '/profile',
    '/apply',
  ]
  if (type === 'SEPTIC_SERVICE') service.push('/map')
  return service
}

export function isPathAllowedForPartner(pathname, partnerType, opts = {}) {
  const allowed = getAllowedPathPrefixes(partnerType, opts)
  return allowed.some((p) => {
    if (p === '/') return pathname === '/'
    return pathname === p || pathname.startsWith(`${p}/`)
  })
}

/** Быстрые ссылки на дашборде услуг */
export function getServiceDashboardLinks(partnerType) {
  const base = [
    { to: '/orders/new', labelKey: 'new_orders_title' },
    { to: '/orders', labelKey: 'nav_orders' },
    { to: '/schedule', labelKey: 'nav_schedule' },
    { to: '/photos', labelKey: 'nav_photos' },
    { to: '/balance', labelKey: 'nav_payouts' },
  ]
  if (partnerType === 'SEPTIC_SERVICE') {
    return [
      { to: '/orders', labelKey: 'nav_orders' },
      { to: '/map', labelKey: 'nav_map' },
      { to: '/schedule', labelKey: 'nav_schedule' },
      { to: '/balance', labelKey: 'nav_payouts' },
    ]
  }
  return base
}

export function getShopDashboardLinks() {
  return [
    { to: '/shop', labelKey: 'market_products' },
    { to: '/catalog/add', labelKey: 'market_add_product' },
    { to: '/shop/stock', labelKey: 'market_stock' },
    { to: '/shop/orders', labelKey: 'market_orders' },
    { to: '/shop/settings', labelKey: 'market_settings' },
  ]
}
