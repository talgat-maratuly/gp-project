import {
  findDemoUser,
  loadGlobalStore,
  createClientOrder,
  createFurnitureExecutorOrder,
  updateGlobalOrder,
  mapServiceOrderPayload,
  ordersForClient,
  mapOrderToService,
  syncFromHub,
} from '@gp/shared/demo'
import { SERVICE_ID_TO_FURNITURE_TYPE } from '@gp/shared/constants'

const SESSION_KEY = 'gp-demo-client-session'

export function getDemoSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setDemoSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(SESSION_KEY)
}

export async function demoLogin(username, password) {
  const u = findDemoUser(username, password)
  if (!u || u.role !== 'CLIENT') throw new Error('login_error')
  const session = {
    id: u.clientId,
    clientId: u.clientId,
    role: 'CLIENT',
    name: u.name,
    franchiseId: u.franchiseId,
    city: u.city,
    phone: loadGlobalStore().clients.find((c) => c.id === u.clientId)?.phone,
  }
  setDemoSession(session)
  await syncFromHub()
  return session
}

export async function demoLogout() {
  setDemoSession(null)
}

export async function demoGetOrders() {
  await syncFromHub()
  const session = getDemoSession()
  if (!session) return []
  const store = loadGlobalStore()
  return ordersForClient(store.orders, session.clientId).map(mapOrderToService)
}

export async function demoPlaceServiceOrder(data) {
  await syncFromHub()
  const session = getDemoSession()
  if (!session) throw new Error('auth_required')
  const payload = mapServiceOrderPayload(data, session)
  createClientOrder(payload)
  const furnitureType = SERVICE_ID_TO_FURNITURE_TYPE[data.serviceId]
  if (furnitureType) {
    createFurnitureExecutorOrder({
      serviceType: furnitureType,
      clientName: session.name,
      phone: session.phone || payload.clientPhone || '',
      address: data.address || payload.city || 'Уральск',
      city: session.city,
      comment: data.comment || data.serviceName,
      totalPrice: Number(data.total) || payload.amount || 0,
      franchiseId: session.franchiseId,
    })
  }
  await syncFromHub()
  return { id: 'ok' }
}

export async function demoCancelOrder(orderId) {
  updateGlobalOrder(orderId, { status: 'cancelled' })
  await syncFromHub()
}

export async function demoUpdateOrder(orderId, patch) {
  updateGlobalOrder(orderId, patch)
  await syncFromHub()
}

export function demoFranchises() {
  return loadGlobalStore().franchises.filter((f) => f.status === 'ACTIVE')
}

export function updateDemoSession(patch) {
  const s = getDemoSession()
  if (s) setDemoSession({ ...s, ...patch })
}
