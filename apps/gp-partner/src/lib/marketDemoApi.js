import {
  loadGlobalStore,
  syncFromHub,
  createShop,
  updateShop,
  createMarketProduct,
  updateMarketProduct,
  deleteMarketProduct,
  advanceMarketOrder,
  updateMarketOrder,
  shopForPartner,
  productsForPartner,
  marketOrdersForPartner,
  mapMarketProductToCatalog,
} from '@gp/shared/demo'

import { getDemoSession } from './demoApi.js'

export async function demoGetShop() {
  await syncFromHub()
  const session = getDemoSession()
  if (!session) return null
  return shopForPartner(loadGlobalStore().shops || [], session.partnerId)
}

export async function demoCreateShop(data) {
  await syncFromHub()
  const session = getDemoSession()
  if (!session) throw new Error('auth_required')
  createShop({
    ...data,
    franchiseId: session.franchiseId,
    city: session.city,
    partnerId: session.partnerId,
  })
  await syncFromHub()
  return demoGetShop()
}

export async function demoUpdateShop(shopId, patch) {
  updateShop(shopId, patch)
  await syncFromHub()
  return demoGetShop()
}

export async function demoGetProducts() {
  await syncFromHub()
  const session = getDemoSession()
  if (!session) return []
  const list = productsForPartner(loadGlobalStore().marketProducts || [], session.partnerId)
  return list.map(mapMarketProductToCatalog)
}

export async function demoAddProduct(data) {
  await syncFromHub()
  const session = getDemoSession()
  const shop = shopForPartner(loadGlobalStore().shops || [], session.partnerId)
  if (!shop) throw new Error('shop_required')
  createMarketProduct({
    ...data,
    franchiseId: session.franchiseId,
    city: session.city,
    partnerId: session.partnerId,
    shopId: shop.id,
  })
  await syncFromHub()
}

export async function demoUpdateProduct(id, patch) {
  updateMarketProduct(id, patch)
  await syncFromHub()
}

export async function demoDeleteProduct(id) {
  deleteMarketProduct(id)
  await syncFromHub()
}

export async function demoGetMarketOrders() {
  await syncFromHub()
  const session = getDemoSession()
  if (!session) return []
  return marketOrdersForPartner(loadGlobalStore().marketOrders || [], session.partnerId)
}

export async function demoAdvanceMarketOrder(orderId) {
  advanceMarketOrder(orderId)
  await syncFromHub()
}

export async function demoSetMarketOrderStatus(orderId, status) {
  updateMarketOrder(orderId, { status })
  await syncFromHub()
}
