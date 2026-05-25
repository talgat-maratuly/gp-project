import {
  findDemoUser,
  loadGlobalStore,
  updateGlobalOrder,
  assignGlobalPartner,
  ordersForPartner,
  mapOrderToPartner,
  PARTNER_STATUS_MAP,
  syncFromHub,
} from '@gp/shared/demo'

const SESSION_KEY = 'gp-demo-partner-session'

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
  if (!u || u.role !== 'PARTNER') throw new Error('login_error')
  const store = loadGlobalStore()
  const partner = store.partners.find((p) => p.id === u.partnerId)
  const session = {
    id: u.partnerId,
    partnerId: u.partnerId,
    role: 'PARTNER',
    name: partner?.name || u.name,
    company: partner?.company,
    partnerType: u.partnerType || (u.username?.includes('shop') ? 'SHOP' : 'LAWN_MOWING'),
    partnerRole: u.partnerRole || (u.partnerType === 'SHOP' || u.username?.includes('shop') ? 'SHOP' : 'SPECIALIST'),
    partnerStatus: 'APPROVED',
    franchiseId: u.franchiseId,
    city: u.city,
    partnerProfileId: u.partnerId,
    balance: partner?.earnings || 0,
    directions: [],
    serviceAccess: [
      'furniture_manufacturing',
      'furniture_assembly',
      'furniture_repair',
    ],
    isOnline: true,
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
  return ordersForPartner(store.orders, session.partnerId, session.franchiseId).map((o) =>
    mapOrderToPartner(o, session.partnerId),
  )
}

export async function demoPatchOrder(orderId, patch) {
  updateGlobalOrder(orderId, patch)
  await syncFromHub()
}

export async function demoUpdateStatus(orderId, partnerStatus, extra = {}) {
  const session = getDemoSession()
  const store = loadGlobalStore()
  const order = store.orders.find((o) => o.id === orderId)
  if (!order || order.franchiseId !== session.franchiseId) throw new Error('forbidden')
  if (order.partnerId && order.partnerId !== session.partnerId && partnerStatus !== 'accepted') {
    throw new Error('forbidden')
  }
  const mapped = PARTNER_STATUS_MAP[partnerStatus] || partnerStatus
  const patch = { status: mapped, ...extra }
  if (partnerStatus === 'accepted' && !order.partnerId) {
    assignGlobalPartner(orderId, session.partnerId)
  } else {
    updateGlobalOrder(orderId, patch)
  }
  await syncFromHub()
}
