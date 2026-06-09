/** Маппинг API (NestJS enums) ↔ фронтенд */

export const ORDER_STATUS_TO_UI = {
  NEW: 'new',
  ACCEPTED: 'accepted',
  ON_WAY: 'on_way',
  IN_PROCESS: 'in_process',
  COMPLETED: 'completed',
  WAITING_ADMIN: 'waiting_admin',
  EXPIRED: 'expired',
  CANCELED_BY_CLIENT: 'canceled_by_client',
  CANCELED_BY_SPEC: 'canceled_by_spec',
  NO_SHOW: 'no_show',
}

export const ORDER_STATUS_TO_API = {
  new: 'NEW',
  accepted: 'ACCEPTED',
  on_way: 'ON_WAY',
  in_process: 'IN_PROCESS',
  completed: 'COMPLETED',
  waiting_admin: 'WAITING_ADMIN',
  expired: 'EXPIRED',
  canceled_by_client: 'CANCELED_BY_CLIENT',
  canceled_by_spec: 'CANCELED_BY_SPEC',
  no_show: 'NO_SHOW',
}

/** Под-статус септик-рейса → UI id */
export const SEPTIC_STAGE_TO_UI = {
  ARRIVED: 'on_site',
  PUMPING: 'pumping',
  LOADED: 'loaded',
  DISPOSAL_ARRIVED: 'disposal_arrived',
  DISPOSAL_COMPLETED: 'disposal_completed',
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
  const assignedPartnerId = o.assignedPartnerId ?? o.partnerId ?? null
  const mapped = {
    ...o,
    assignedPartnerId,
    partnerId: assignedPartnerId,
    status: ORDER_STATUS_TO_UI[o.status] || o.status?.toLowerCase?.(),
    septicStage: o.septicStage ? (SEPTIC_STAGE_TO_UI[o.septicStage] || o.septicStage) : null,
    cancelReason: o.cancelReason || null,
    clientConfirmed: !!o.clientConfirmedAt,
    category: CATEGORY_TO_UI[o.category] || o.category?.toLowerCase?.(),
    total: Number(o.total),
    gpCommission: o.gpCommission != null ? Number(o.gpCommission) : null,
    partnerName: o.partner?.company || o.partner?.companyName || o.partner?.fullName || o.partner?.user?.name,
    partnerPhone: o.partner?.user?.phone || o.partnerPhone || null,
    lawnWorkType: o.lawnWorkType ? (LAWN_WORK_TO_UI[o.lawnWorkType] || o.lawnWorkType) : null,
    flexibleTime: !!o.flexibleTime,
    preferredDate: o.preferredDate || null,
    preferredTime: o.preferredTime || null,
    lawnAreaSqm: o.lawnAreaSqm != null ? Number(o.lawnAreaSqm) : null,
    city: o.city || o.client?.city || null,
  }
  if (forClient) {
    delete mapped.gpCommission
    delete mapped.commissionPaid
  }
  return mapped
}

export function mapProduct(p) {
  if (!p) return p
  const stockValue =
    typeof p.stock === 'object' && p.stock !== null
      ? Math.max(0, Number(p.stock.quantity ?? 0) - Number(p.stock.reservedQuantity ?? 0))
      : Number(p.stock ?? p.quantity ?? 0)
  const category = p.category ?? p.categoryId
  return {
    ...p,
    price: Number(p.price),
    stock: stockValue,
    quantity: stockValue,
    categoryId: productCategoryToUi(category),
    brand: p.brand || p.partner?.company || p.store?.name || 'Partner',
    description: p.description || '',
    specifications: p.specifications || '',
    partnerName: p.partner?.company || p.partner?.user?.name || p.partnerName || p.store?.name,
    storeId: p.storeId,
    storeName: p.store?.name || p.storeName,
    inStock: p.inStock ?? (p.isActive !== undefined ? p.isActive && stockValue > 0 : stockValue > 0),
    popularity: p.popularity ?? 50,
    rating: p.rating ?? 4.5,
  }
}

export function mapMarketOrder(o) {
  if (!o) return o
  return {
    ...o,
    id: o.id,
    kind: 'market',
    rawStatus: o.status,
    status: o.status,
    serviceName: o.store?.name ? `Заказ GP Market · ${o.store.name}` : 'Заказ GP Market',
    total: Number(o.totalAmount ?? o.finalAmount ?? o.total ?? 0),
    amount: Number(o.totalAmount ?? o.finalAmount ?? o.total ?? 0),
    address: o.address || '',
    city: o.region?.name || o.city || '',
    partnerName: o.store?.name || o.partnerName || '',
    items: o.items || [],
    createdAt: o.createdAt,
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
    rating: Number(profile.rating ?? 5),
    completedOrders: Number(profile.completedOrders ?? 0),
    canceledOrders: Number(profile.canceledOrders ?? 0),
    serviceOfferings: profile.serviceOfferings || [],
  }
}
