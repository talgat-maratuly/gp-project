/**
 * Live API flow probes for ecosystem report (no console side effects).
 */
const API = process.env.API_URL || 'http://localhost:4000/api'
const BASE = API.replace(/\/api$/, '')

async function req(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message || res.statusText
    throw new Error(`${method} ${path}: ${msg}`)
  }
  return data
}

export async function probeApiReachable() {
  try {
    const health = await fetch(`${BASE}/health`).then((r) => r.json())
    const db = await fetch(`${BASE}/health/db`).then((r) => r.json()).catch(() => null)
    return {
      ok: health.status === 'ok',
      health,
      dbOk: db?.status === 'ok',
      dbMessage: db?.message || null,
    }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

/** @returns {{ ok: boolean, steps: object[], chain?: object }} */
export async function runAuthFlow() {
  const steps = []
  const chain = {
    id: 'auth',
    apps: ['gp-service', 'gp-partner', 'gp-api'],
    rootCause: null,
  }
  try {
    const client = await req('/auth/register/client', { method: 'POST', body: {} })
    steps.push({ name: 'client register', ok: !!client.accessToken, detail: client.user?.email })
    const partner = await req('/auth/register/partner', {
      method: 'POST',
      body: { partnerRole: 'SPECIALIST' },
    })
    steps.push({ name: 'partner register', ok: !!partner.accessToken, detail: partner.user?.email })
    const login = await req('/auth/login', {
      method: 'POST',
      body: { email: 'admin@gp.kz', password: 'password123' },
    })
    steps.push({ name: 'admin login', ok: !!login.accessToken })
    const ok = steps.every((s) => s.ok)
    if (!ok) chain.rootCause = steps.find((s) => !s.ok)?.name || 'auth failure'
    return { ok, steps, chain, tokens: { client: client.accessToken, partner: partner.accessToken, admin: login.accessToken } }
  } catch (e) {
    chain.rootCause = e.message
    steps.push({ name: 'auth flow', ok: false, detail: e.message })
    return { ok: false, steps, chain, error: e.message }
  }
}

export async function runPartnerFlow(partnerToken) {
  const steps = []
  const chain = { id: 'partner', apps: ['gp-partner', 'gp-api'], rootCause: null }
  try {
    await req('/partner/apply', {
      method: 'POST',
      token: partnerToken,
      body: {
        partnerType: 'OTHER',
        partnerRole: 'SPECIALIST',
        accountType: 'INDIVIDUAL',
        subserviceIds: ['grass-mowing'],
      },
    })
    const me = await req('/auth/me', { token: partnerToken })
    const ok = me.partnerProfile?.status === 'PENDING_REVIEW'
    steps.push({ name: 'partner apply', ok, detail: me.partnerProfile?.status })
    if (!ok) chain.rootCause = `unexpected status ${me.partnerProfile?.status}`
    return { ok, steps, chain, partnerProfileId: me.partnerProfile?.id }
  } catch (e) {
    chain.rootCause = e.message
    steps.push({ name: 'partner apply', ok: false, detail: e.message })
    return { ok: false, steps, chain, error: e.message }
  }
}

export async function runModerationFlow(adminToken, partnerProfileId) {
  const steps = []
  const chain = { id: 'moderation', apps: ['gp-admin', 'gp-api'], rootCause: null }
  if (!partnerProfileId) {
    chain.rootCause = 'no partner profile id'
    return { ok: false, steps, chain, error: chain.rootCause }
  }
  try {
    const approved = await req(`/admin/moderation/partners/${partnerProfileId}/approve`, {
      method: 'PATCH',
      token: adminToken,
    })
    const ok = approved.status === 'APPROVED'
    steps.push({ name: 'admin approve partner', ok, detail: approved.status })
    if (!ok) chain.rootCause = `status ${approved.status}`
    return { ok, steps, chain }
  } catch (e) {
    chain.rootCause = e.message
    steps.push({ name: 'admin approve partner', ok: false, detail: e.message })
    return { ok: false, steps, chain, error: e.message }
  }
}

export async function runOrderFlow({ clientToken, partnerToken, adminToken, partnerProfileId }) {
  const steps = []
  const chain = {
    id: 'order',
    apps: ['gp-service', 'gp-admin', 'gp-partner', 'gp-api'],
    rootCause: null,
  }
  let orderId
  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const order = await req('/orders', {
      method: 'POST',
      token: clientToken,
      body: {
        category: 'LAWN',
        serviceId: 'grass-mowing',
        serviceName: 'Ecosystem report order',
        address: 'Уральск',
        clientLat: 51.24,
        clientLng: 51.38,
        total: 12000,
        paymentMethod: 'CASH_ON_DELIVERY',
        lawnAreaSqm: 200,
        preferredDate: tomorrow.toISOString().slice(0, 10),
        preferredTime: '15:00',
        flexibleTime: true,
      },
    })
    orderId = order.id
    steps.push({ name: 'client create order', ok: order.status === 'NEW', detail: orderId })

    const assigned = await req(`/admin/orders/${orderId}/assign`, {
      method: 'PATCH',
      token: adminToken,
      body: { assignedPartnerId: partnerProfileId },
    })
    steps.push({
      name: 'admin assign',
      ok: (assigned.assignedPartnerId ?? assigned.partnerId) === partnerProfileId,
      detail: assigned.assignedPartnerId ?? assigned.partnerId,
    })

    const accepted = await req(`/orders/${orderId}/status`, {
      method: 'PATCH',
      token: partnerToken,
      body: { status: 'ACCEPTED', executorLat: 51.24, executorLng: 51.38 },
    })
    steps.push({ name: 'partner accept', ok: accepted.status === 'ACCEPTED', detail: accepted.status })

    const clientOrders = await req('/orders', { token: clientToken })
    const adminOrders = await req('/admin/orders', { token: adminToken })
    const partnerOrders = await req('/orders', { token: partnerToken })
    const co = clientOrders.find((o) => o.id === orderId)
    const ao = adminOrders.find((o) => o.id === orderId)
    const po = partnerOrders.find((o) => o.id === orderId)
    const synced =
      co?.status === 'ACCEPTED' && ao?.status === 'ACCEPTED' && po?.status === 'ACCEPTED'
    steps.push({
      name: 'status sync',
      ok: synced,
      detail: `client=${co?.status} admin=${ao?.status} partner=${po?.status}`,
    })

    const ok = steps.every((s) => s.ok)
    if (!ok) chain.rootCause = steps.find((s) => !s.ok)?.detail || steps.find((s) => !s.ok)?.name
    return { ok, steps, chain }
  } catch (e) {
    chain.rootCause = e.message
    steps.push({ name: 'order flow', ok: false, detail: e.message })
    return { ok: false, steps, chain, error: e.message }
  }
}
