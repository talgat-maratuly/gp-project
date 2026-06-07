import {
  findDemoUser,
  loadGlobalStore,
  updateGlobalOrder,
  ordersForPartner,
  mapOrderToPartner,
  PARTNER_STATUS_MAP,
  syncFromHub,
} from '@gp/shared/demo'

const SESSION_KEY = 'gp-demo-partner-session'
const OFFERINGS_KEY = 'gp-demo-partner-offerings'

function loadOfferingsStore() {
  try {
    const raw = localStorage.getItem(OFFERINGS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveOfferingsStore(store) {
  localStorage.setItem(OFFERINGS_KEY, JSON.stringify(store))
}

export function demoGetPartnerOfferings(partnerId) {
  return loadOfferingsStore()[partnerId] || []
}

export async function demoAddPartnerOfferings(partnerId, subserviceIds) {
  const store = loadOfferingsStore()
  const list = store[partnerId] || []
  const added = subserviceIds.map((subserviceId) => ({
    id: `off_${Date.now()}_${subserviceId}`,
    subserviceId,
    status: 'PENDING_MODERATION',
  }))
  store[partnerId] = [...list, ...added]
  saveOfferingsStore(store)
  return store[partnerId]
}

export async function demoSaveCustomOffering(partnerId, data) {
  const store = loadOfferingsStore()
  const list = store[partnerId] || []
  const offering = {
    id: data.id || `custom_${Date.now()}`,
    subserviceId: data.subserviceId || `custom-${Date.now()}`,
    custom: true,
    category: data.category,
    name: data.name,
    price: Number(data.price) || 0,
    description: data.description || '',
    status: data.status || 'PENDING_MODERATION',
  }
  const idx = list.findIndex((o) => o.id === offering.id)
  if (idx >= 0) list[idx] = { ...list[idx], ...offering }
  else list.push(offering)
  store[partnerId] = list
  saveOfferingsStore(store)
  return offering
}

function mergeSessionOfferings(session) {
  const offerings = demoGetPartnerOfferings(session.partnerId)
  return { ...session, serviceOfferings: offerings }
}

export function getDemoSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    const session = raw ? JSON.parse(raw) : null
    return session ? mergeSessionOfferings(session) : null
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
  return mergeSessionOfferings(session)
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
  const assigned = order.assignedPartnerId ?? order.partnerId
  const isAccept = partnerStatus === 'accepted'
  if ((!assigned || assigned !== session.partnerId) && isAccept) {
    updateGlobalOrder(orderId, {
      partnerId: session.partnerId,
      assignedPartnerId: session.partnerId,
      partnerName: session.company || session.name,
      status: PARTNER_STATUS_MAP.accepted || 'assigned',
      ...extra,
    })
    await syncFromHub()
    return
  }
  if (!assigned || assigned !== session.partnerId) {
    throw new Error('forbidden')
  }
  const mapped = PARTNER_STATUS_MAP[partnerStatus] || partnerStatus
  const patch = { status: mapped, ...extra }
  updateGlobalOrder(orderId, patch)
  await syncFromHub()
}
