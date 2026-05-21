/** Маппинг API (NestJS enums) ↔ фронтенд */

export const ORDER_STATUS_TO_UI = {
  NEW: 'new',
  ACCEPTED: 'accepted',
  ON_THE_WAY: 'on_way',
  ARRIVED: 'on_site',
  STARTED: 'started',
  LOADED: 'loaded',
  DISPOSAL_ARRIVED: 'disposal_arrived',
  DISPOSAL_COMPLETED: 'disposal_completed',
  COMPLETED: 'done',
  CLIENT_CONFIRMED: 'client_confirmed',
  CANCELLED: 'cancelled',
}

export const ORDER_STATUS_TO_API = {
  new: 'NEW',
  accepted: 'ACCEPTED',
  on_way: 'ON_THE_WAY',
  on_site: 'ARRIVED',
  started: 'STARTED',
  loaded: 'LOADED',
  disposal_arrived: 'DISPOSAL_ARRIVED',
  disposal_completed: 'DISPOSAL_COMPLETED',
  done: 'COMPLETED',
  client_confirmed: 'CLIENT_CONFIRMED',
  cancelled: 'CANCELLED',
}

export const CATEGORY_TO_UI = {
  SEPTIC: 'septic',
  LAWN: 'lawn',
  AUTOWATERING: 'irrigation',
  PUMPS: 'pumps',
  FILTERS: 'filters',
  SHOP: 'shop',
  ELECTRICAL: 'electrical',
}

export const CATEGORY_TO_API = {
  septic: 'SEPTIC',
  lawn: 'LAWN',
  irrigation: 'AUTOWATERING',
  pumps: 'PUMPS',
  filters: 'FILTERS',
  shop: 'SHOP',
  electrical: 'ELECTRICAL',
}

/** Slug категории GP Shop (не путать с enum заказов) */
export const SHOP_CATEGORY_SLUGS = new Set([
  'plants', 'lawn', 'irrigation', 'hunter', 'pumps', 'filters',
  'fertilizers', 'lighting', 'tools', 'consumables', 'parts', 'shop',
])

/** Категория товара в GP Shop (не путать с OrderCategory SEPTIC/LAWN) */
export function productCategoryToUi(category) {
  if (!category) return 'irrigation'
  const lower = String(category).toLowerCase()
  if (SHOP_CATEGORY_SLUGS.has(lower)) return lower
  const upper = String(category).toUpperCase()
  if (upper === 'AUTOWATERING') return 'irrigation'
  if (SHOP_CATEGORY_SLUGS.has(String(category))) return String(category)
  return lower
}

export const DIRECTION_TO_API = {
  septic: 'SEPTIC',
  lawn: 'LAWN',
  irrigation: 'AUTOWATERING',
  pumps: 'PUMPS',
  filters: 'FILTERS',
  nursery: 'NURSERY',
  shop: 'SHOP',
  landscape: 'LANDSCAPE',
  electrical: 'ELECTRICAL',
}

export const PAYMENT_TO_API = {
  kaspi_partner: 'KASPI_DIRECT_TO_PARTNER',
  kaspi: 'KASPI_DIRECT_TO_PARTNER',
  cash: 'CASH_ON_DELIVERY',
  CASH_ON_DELIVERY: 'CASH_ON_DELIVERY',
  KASPI_DIRECT_TO_PARTNER: 'KASPI_DIRECT_TO_PARTNER',
}

export const LAWN_WORK_TO_API = {
  MOWING: 'MOWING',
  CARE: 'CARE',
  CLEANUP: 'CLEANUP',
  mowing: 'MOWING',
  care: 'CARE',
  cleanup: 'CLEANUP',
}

export const LAWN_WORK_TO_UI = {
  MOWING: 'MOWING',
  CARE: 'CARE',
  CLEANUP: 'CLEANUP',
}

export function mapOrder(o, { forClient = false } = {}) {
  if (!o) return o
  const mapped = {
    ...o,
    status: ORDER_STATUS_TO_UI[o.status] || o.status?.toLowerCase?.(),
    category: CATEGORY_TO_UI[o.category] || o.category?.toLowerCase?.(),
    total: Number(o.total),
    gpCommission: o.gpCommission != null ? Number(o.gpCommission) : null,
    partnerName: o.partner?.company || o.partner?.user?.name,
    lawnWorkType: o.lawnWorkType ? (LAWN_WORK_TO_UI[o.lawnWorkType] || o.lawnWorkType) : null,
    flexibleTime: !!o.flexibleTime,
    preferredDate: o.preferredDate || null,
    preferredTime: o.preferredTime || null,
    lawnAreaSqm: o.lawnAreaSqm != null ? Number(o.lawnAreaSqm) : null,
  }
  if (forClient) {
    delete mapped.gpCommission
    delete mapped.commissionPaid
  }
  return mapped
}

export function mapProduct(p) {
  if (!p) return p
  return {
    ...p,
    price: Number(p.price),
    stock: Number(p.stock),
    categoryId: productCategoryToUi(p.category),
    brand: p.brand || p.partner?.company || 'Partner',
    description: p.description || '',
    specifications: p.specifications || '',
    partnerName: p.partner?.company || p.partner?.user?.name || p.partnerName,
    inStock: p.inStock ?? Number(p.stock) > 0,
    popularity: p.popularity ?? 50,
    rating: p.rating ?? 4.5,
  }
}

export function mapPartnerUser(me) {
  if (!me?.partnerProfile) return null
  const profile = me.partnerProfile
  return {
    id: me.id,
    email: me.email,
    name: me.name,
    phone: me.phone,
    company: profile.company,
    directions: (profile.directions || []).map((d) => CATEGORY_TO_UI[d] || d.toLowerCase()),
    balance: Number(profile.balance),
    isOnline: profile.isOnline,
    lat: profile.lat,
    lng: profile.lng,
    partnerProfileId: profile.id,
    serviceOfferings: profile.serviceOfferings || [],
  }
}
