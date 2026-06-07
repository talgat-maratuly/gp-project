/** Навигация GP Partner по partnerRole (+ partnerType для уточнения услуг) */

import {
  canAccessServiceModule,
  canAccessShopModule,
  getEffectivePartnerRole,
  getPartnerAccess,
  PARTNER_ROLES,
} from './partnerRole.js'

export const SHOP_PARTNER_TYPE = 'SHOP'

/** @deprecated Используйте getPartnerAccess(user).shop */
export function isShopPartner(userOrType, partnerStatus) {
  if (userOrType && typeof userOrType === 'object') {
    return getPartnerAccess(userOrType).shop
  }
  return canAccessShopModule(
    getEffectivePartnerRole(null, userOrType),
    partnerStatus,
  )
}

export function isServicePartner(user, opts = {}) {
  if (user && typeof user === 'object') {
    return getPartnerAccess(user, opts).service
  }
  return Boolean(user && user !== SHOP_PARTNER_TYPE)
}

/** Нижнее меню */
export function getPartnerBottomNav(user, { isDemoMode = false } = {}) {
  const { shop, service, nursery, delivery, partnerType } = getPartnerAccess(user || {}, { isDemoMode })

  if (nursery) {
    return [
      { to: '/', icon: 'LayoutDashboard', labelKey: 'nav_home', end: true },
      { to: '/nursery/requests', icon: 'ClipboardList', labelKey: 'nursery_requests' },
      { to: '/nursery/products', icon: 'Trees', labelKey: 'nursery_products' },
      { to: '/profile', icon: 'User', labelKey: 'nav_profile' },
    ]
  }

  if (delivery) {
    return [
      { to: '/', icon: 'LayoutDashboard', labelKey: 'nav_home', end: true },
      { to: '/delivery/orders', icon: 'ClipboardList', labelKey: 'delivery_orders' },
      { to: '/delivery/routes', icon: 'Truck', labelKey: 'delivery_routes' },
      { to: '/profile', icon: 'User', labelKey: 'nav_profile' },
    ]
  }

  if (!shop && !service) {
    return [
      { to: '/', icon: 'LayoutDashboard', labelKey: 'nav_home', end: true },
      { to: '/profile', icon: 'User', labelKey: 'nav_profile' },
    ]
  }

  if (shop && !service) {
    return [
      { to: '/', icon: 'LayoutDashboard', labelKey: 'nav_home', end: true },
      { to: '/shop/orders', icon: 'ClipboardList', labelKey: 'nav_orders' },
      { to: '/shop', icon: 'Store', labelKey: 'market_my_shop' },
      { to: '/profile', icon: 'User', labelKey: 'nav_profile' },
    ]
  }

  if (shop && service) {
    return [
      { to: '/', icon: 'LayoutDashboard', labelKey: 'nav_home', end: true },
      { to: '/orders', icon: 'ClipboardList', labelKey: 'nav_orders' },
      { to: '/services', icon: 'Briefcase', labelKey: 'nav_my_services' },
      { to: '/shop', icon: 'Store', labelKey: 'market_my_shop' },
      { to: '/profile', icon: 'User', labelKey: 'nav_profile' },
    ]
  }

  return [
    { to: '/', icon: 'LayoutDashboard', labelKey: 'nav_home', end: true },
    { to: '/orders', icon: 'ClipboardList', labelKey: 'nav_orders' },
    { to: '/profile', icon: 'User', labelKey: 'nav_profile' },
  ]
}

export function getAllowedPathPrefixes(user, opts = {}) {
  const { shop, service, nursery, delivery, partnerType } = getPartnerAccess(user || {}, opts)
  const common = ['/apply', '/apply/specialist', '/apply/nursery', '/apply/delivery', '/profile']

  const prefixes = ['/']

  if (shop) {
    prefixes.push('/shop', '/catalog', '/cabinet')
  }
  if (service) {
    prefixes.push(
      '/orders',
      '/schedule',
      '/photos',
      '/balance',
      '/services',
      '/payouts',
    )
    if (partnerType === 'SEPTIC_SERVICE') prefixes.push('/map')
  }
  if (nursery) {
    prefixes.push('/nursery')
  }
  if (delivery) {
    prefixes.push('/delivery')
  }

  return [...new Set([...prefixes, ...common])]
}

export function isPathAllowedForPartner(pathname, user, opts = {}) {
  const allowed = getAllowedPathPrefixes(user, opts)
  return allowed.some((p) => {
    if (p === '/') return pathname === '/'
    return pathname === p || pathname.startsWith(`${p}/`)
  })
}

/** Быстрые ссылки на дашборде услуг */
export function getServiceDashboardLinks(user) {
  const type = user?.partnerType
  const base = [
    { to: '/orders', labelKey: 'nav_orders' },
    { to: '/orders/plant-doctor', labelKey: 'plant_doctor_cases' },
    { to: '/services', labelKey: 'nav_my_services' },
    { to: '/services/add', labelKey: 'nav_add_service' },
    { to: '/schedule', labelKey: 'nav_schedule' },
    { to: '/balance', labelKey: 'nav_payouts' },
  ]
  if (type === 'SEPTIC_SERVICE') {
    return [
      { to: '/orders', labelKey: 'nav_orders' },
      { to: '/map', labelKey: 'nav_map' },
      { to: '/services', labelKey: 'nav_my_services' },
      { to: '/balance', labelKey: 'nav_payouts' },
    ]
  }
  return base
}

export function getShopDashboardLinks() {
  return [
    { to: '/shop', labelKey: 'market_my_shop' },
    { to: '/catalog/add', labelKey: 'market_add_product' },
    { to: '/shop/stock', labelKey: 'market_stock' },
    { to: '/shop/orders', labelKey: 'market_orders' },
    { to: '/shop/settings', labelKey: 'market_settings' },
  ]
}

export function getShopOnlyPaths() {
  return ['/shop', '/catalog', '/cabinet']
}

export function getNurseryOnlyPaths() {
  return ['/nursery']
}

export function getDeliveryOnlyPaths() {
  return ['/delivery']
}

export function getServiceOnlyPaths() {
  return [
    '/orders',
    '/schedule',
    '/photos',
    '/map',
    '/services',
    '/balance',
    '/payouts',
  ]
}

export function pathRequiresShop(pathname) {
  return getShopOnlyPaths().some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

export function pathRequiresService(pathname) {
  return getServiceOnlyPaths().some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

export function pathRequiresNursery(pathname) {
  return getNurseryOnlyPaths().some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

export function pathRequiresDelivery(pathname) {
  return getDeliveryOnlyPaths().some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

export { PARTNER_ROLES }
