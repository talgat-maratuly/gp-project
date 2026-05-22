import {
  findDemoUser,
  loadGlobalStore,
  syncFromHub,
  createMarketOrder,
  updateMarketOrder,
  productsForClient,
  marketOrdersForClient,
  mapMarketProductToCatalog,
  mapMarketOrderToClient,
} from '@gp/shared/demo'

export { getDemoSession, setDemoSession, demoLogin, demoLogout, demoFranchises, updateDemoSession } from './demoApi.js'

import { getDemoSession, setDemoSession } from './demoApi.js'

export async function demoGetMarketProducts(opts = {}) {
  await syncFromHub()
  const session = getDemoSession()
  if (!session) return []
  const store = loadGlobalStore()
  const activeShopIds = new Set(
    (store.shops || []).filter((s) => s.status === 'ACTIVE' && s.franchiseId === session.franchiseId).map((s) => s.id),
  )
  const products = productsForClient(store.marketProducts || [], session.franchiseId, opts).filter(
    (p) => activeShopIds.has(p.shopId),
  )
  return products.map(mapMarketProductToCatalog)
}

export async function demoGetMarketOrders() {
  await syncFromHub()
  const session = getDemoSession()
  if (!session) return []
  const store = loadGlobalStore()
  return marketOrdersForClient(store.marketOrders || [], session.clientId).map(mapMarketOrderToClient)
}

export async function demoPlaceMarketOrder({ items, deliveryType, deliveryAddress, paymentMethod, deliveryPrice }) {
  await syncFromHub()
  const session = getDemoSession()
  if (!session) throw new Error('auth_required')
  const store = loadGlobalStore()
  const first = items[0]
  const product = (store.marketProducts || []).find((p) => p.id === first.productId)
  if (!product || product.franchiseId !== session.franchiseId) throw new Error('product_not_found')
  const client = store.clients.find((c) => c.id === session.clientId)
  createMarketOrder({
    franchiseId: session.franchiseId,
    city: session.city || client?.city,
    clientId: session.clientId,
    clientName: session.name || client?.name,
    partnerId: product.partnerId,
    shopId: product.shopId,
    items,
    deliveryType,
    deliveryAddress,
    paymentMethod,
    deliveryPrice: deliveryPrice || 0,
    paymentStatus: paymentMethod === 'kaspi_qr' ? 'PAID' : 'UNPAID',
  })
  await syncFromHub()
  const orders = await demoGetMarketOrders()
  return orders[orders.length - 1]
}

export async function demoCancelMarketOrder(orderId) {
  updateMarketOrder(orderId, { status: 'CANCELLED' })
  await syncFromHub()
}
