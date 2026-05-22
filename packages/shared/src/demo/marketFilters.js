/** Фильтры доступа GP Market */

import { scopeByFranchise } from './filters.js'

export function shopsForAdmin(shops, role, franchiseId) {
  if (role === 'SUPER_ADMIN' && !franchiseId) return shops
  return scopeByFranchise(shops, franchiseId)
}

export function shopForPartner(shops, partnerId) {
  return shops.find((s) => s.partnerId === partnerId) || null
}

export function productsForClient(products, franchiseId, opts = {}) {
  const { search = '', categoryId, minPrice, maxPrice } = opts
  let list = products.filter(
    (p) => p.franchiseId === franchiseId && p.status === 'ACTIVE' && p.quantity > 0,
  )
  const activeShops = new Set(
    products
      .filter((p) => p.franchiseId === franchiseId)
      .map((p) => p.shopId),
  )
  list = list.filter((p) => {
    return true
  })
  if (categoryId && categoryId !== 'all') list = list.filter((p) => p.categoryId === categoryId)
  if (search.trim()) {
    const q = search.trim().toLowerCase()
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
  }
  if (minPrice != null) list = list.filter((p) => p.price >= minPrice)
  if (maxPrice != null) list = list.filter((p) => p.price <= maxPrice)
  return list
}

export function productsForPartner(products, partnerId) {
  return products.filter((p) => p.partnerId === partnerId)
}

export function productsForAdmin(products, franchiseId) {
  if (!franchiseId) return products
  return scopeByFranchise(products, franchiseId)
}

export function marketOrdersForClient(orders, clientId) {
  return orders.filter((o) => o.clientId === clientId)
}

export function marketOrdersForPartner(orders, partnerId) {
  return orders.filter((o) => o.partnerId === partnerId)
}

export function marketOrdersForAdmin(orders, franchiseId) {
  if (!franchiseId) return orders
  return scopeByFranchise(orders, franchiseId)
}

/** Маппинг в UI Service (совместимость с CatalogPage) */
export function mapMarketProductToCatalog(p) {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    oldPrice: p.oldPrice,
    stock: p.quantity,
    quantity: p.quantity,
    category: p.categoryId,
    categoryId: p.categoryId,
    brand: p.brand || 'GP Market',
    linkedServiceType: p.linkedServiceType || null,
    description: p.description,
    image: p.images?.[0] || null,
    images: p.images || [],
    inStock: p.status === 'ACTIVE' && p.quantity > 0,
    partnerId: p.partnerId,
    shopId: p.shopId,
    franchiseId: p.franchiseId,
    city: p.city,
    unit: p.unit,
    status: p.status,
    deliveryAvailable: p.deliveryAvailable,
    pickupAvailable: p.pickupAvailable,
    popularity: 50,
    rating: 4.5,
  }
}

export function mapMarketOrderToClient(o) {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    kind: 'market',
    serviceName: o.items?.map((i) => i.name).join(', ') || 'GP Market',
    city: o.city,
    total: o.finalAmount,
    status: o.status,
    rawStatus: o.status,
    paymentStatus: o.paymentStatus,
    deliveryType: o.deliveryType,
    createdAt: new Date(o.createdAt).toISOString(),
    address: o.deliveryAddress || '',
    canCancel: ['NEW', 'ACCEPTED'].includes(o.status),
    canEdit: false,
  }
}
