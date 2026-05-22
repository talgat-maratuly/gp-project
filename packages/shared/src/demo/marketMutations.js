import { uid, loadGlobalStore, saveGlobalStore } from './store.js'
import { nextMarketStatus } from '../constants/market.js'

let orderSeq = 1000

function nextOrderNumber() {
  orderSeq += 1
  return `MK-${orderSeq}`
}

export function createShop(data) {
  const store = loadGlobalStore()
  const existing = store.shops?.find((s) => s.partnerId === data.partnerId)
  if (existing) throw new Error('shop_exists')
  const shop = {
    id: uid('shop'),
    franchiseId: data.franchiseId,
    city: data.city,
    partnerId: data.partnerId,
    shopName: data.shopName,
    ownerName: data.ownerName,
    phone: data.phone,
    address: data.address,
    status: 'ACTIVE',
    kaspiPaymentInfo: data.kaspiPaymentInfo || '',
    deliveryEnabled: data.deliveryEnabled !== false,
    createdAt: new Date().toISOString().slice(0, 10),
  }
  return saveGlobalStore({ ...store, shops: [...(store.shops || []), shop] })
}

export function updateShop(shopId, patch) {
  const store = loadGlobalStore()
  return saveGlobalStore({
    ...store,
    shops: (store.shops || []).map((s) => (s.id === shopId ? { ...s, ...patch } : s)),
  })
}

export function createMarketProduct(data) {
  const store = loadGlobalStore()
  const product = {
    id: uid('mp'),
    franchiseId: data.franchiseId,
    city: data.city,
    partnerId: data.partnerId,
    shopId: data.shopId,
    categoryId: data.categoryId,
    name: data.name,
    description: data.description || '',
    price: Number(data.price) || 0,
    oldPrice: data.oldPrice ? Number(data.oldPrice) : null,
    quantity: Number(data.quantity) || 0,
    unit: data.unit || 'шт',
    images: data.images || [],
    status: data.quantity > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
    deliveryAvailable: data.deliveryAvailable !== false,
    pickupAvailable: data.pickupAvailable !== false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  return saveGlobalStore({ ...store, marketProducts: [...(store.marketProducts || []), product] })
}

export function updateMarketProduct(productId, patch) {
  const store = loadGlobalStore()
  return saveGlobalStore({
    ...store,
    marketProducts: (store.marketProducts || []).map((p) => {
      if (p.id !== productId) return p
      const next = { ...p, ...patch, updatedAt: Date.now() }
      if (patch.quantity != null) {
        next.status = patch.quantity <= 0 ? 'OUT_OF_STOCK' : patch.status || 'ACTIVE'
      }
      return next
    }),
  })
}

export function deleteMarketProduct(productId) {
  const store = loadGlobalStore()
  return saveGlobalStore({
    ...store,
    marketProducts: (store.marketProducts || []).filter((p) => p.id !== productId),
  })
}

export function createMarketOrder(payload) {
  const store = loadGlobalStore()
  const items = payload.items.map((i) => ({
    productId: i.productId,
    name: i.name,
    price: i.price,
    qty: i.qty,
    unit: i.unit,
  }))
  const totalAmount = items.reduce((s, i) => s + i.price * i.qty, 0)
  const deliveryPrice = payload.deliveryPrice || 0
  const order = {
    id: uid('mord'),
    orderNumber: nextOrderNumber(),
    franchiseId: payload.franchiseId,
    city: payload.city,
    clientId: payload.clientId,
    clientName: payload.clientName,
    partnerId: payload.partnerId,
    shopId: payload.shopId,
    items,
    totalAmount,
    deliveryPrice,
    finalAmount: totalAmount + deliveryPrice,
    paymentMethod: payload.paymentMethod,
    paymentStatus: payload.paymentStatus || 'UNPAID',
    deliveryType: payload.deliveryType,
    deliveryAddress: payload.deliveryAddress || '',
    deliveryCompanyId: payload.deliveryCompanyId || null,
    courierName: null,
    courierPhone: null,
    status: 'NEW',
    createdAt: Date.now(),
  }
  const products = (store.marketProducts || []).map((p) => {
    const line = items.find((i) => i.productId === p.id)
    if (!line) return p
    const qty = Math.max(0, p.quantity - line.qty)
    return { ...p, quantity: qty, status: qty <= 0 ? 'OUT_OF_STOCK' : p.status, updatedAt: Date.now() }
  })
  return saveGlobalStore({
    ...store,
    marketProducts: products,
    marketOrders: [...(store.marketOrders || []), order],
  })
}

export function updateMarketOrder(orderId, patch) {
  const store = loadGlobalStore()
  return saveGlobalStore({
    ...store,
    marketOrders: (store.marketOrders || []).map((o) => (o.id === orderId ? { ...o, ...patch } : o)),
  })
}

export function advanceMarketOrder(orderId) {
  const store = loadGlobalStore()
  const order = (store.marketOrders || []).find((o) => o.id === orderId)
  if (!order) throw new Error('not_found')
  const next = nextMarketStatus(order.status)
  if (!next) return store
  const patch = { status: next }
  if (next === 'DELIVERED') patch.paymentStatus = order.paymentStatus === 'UNPAID' ? 'PAID' : order.paymentStatus
  return updateMarketOrder(orderId, patch)
}
