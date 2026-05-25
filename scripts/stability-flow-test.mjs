#!/usr/bin/env node
/**
 * Full GP stability flow (API-level).
 * client register → partner register → partner apply → admin approve →
 * order create → admin assign → partner accept → status sync
 */
const API = process.env.API_URL || 'http://localhost:4000/api'
const results = []

function record(step, ok, detail = '') {
  results.push({ step, ok, detail })
  const mark = ok ? '✓ PASS' : '✗ FAIL'
  console.log(`${mark}  ${step}${detail ? ` — ${detail}` : ''}`)
}

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

async function main() {
  console.log(`\n=== GP stability flow test ===\nAPI: ${API}\n`)

  try {
    const health = await fetch(`${API.replace(/\/api$/, '')}/health`).then((r) => r.json())
    record('API health', health.status === 'ok')
  } catch (e) {
    record('API health', false, e.message)
    printSummary()
    process.exit(1)
  }

  let clientToken
  let partnerToken
  let adminToken
  let partnerProfileId
  let orderId

  try {
    const clientReg = await req('/auth/register/client', { method: 'POST', body: {} })
    clientToken = clientReg.accessToken
    record('Client registration', !!clientToken, clientReg.user?.email)
  } catch (e) {
    record('Client registration', false, e.message)
  }

  try {
    const partnerReg = await req('/auth/register/partner', {
      method: 'POST',
      body: { partnerRole: 'SPECIALIST' },
    })
    partnerToken = partnerReg.accessToken
    const me = await req('/auth/me', { token: partnerToken })
    partnerProfileId = me.partnerProfile?.id
    record('Partner registration', !!partnerToken && !!partnerProfileId, me.email)
  } catch (e) {
    record('Partner registration', false, e.message)
  }

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
    record('Partner apply (moderation queue)', me.partnerProfile?.status === 'PENDING_REVIEW', me.partnerProfile?.status)
  } catch (e) {
    record('Partner apply (moderation queue)', false, e.message)
  }

  try {
    adminToken = (await req('/auth/login', {
      method: 'POST',
      body: { email: 'admin@gp.kz', password: 'password123' },
    })).accessToken
    record('Admin login', !!adminToken)
  } catch (e) {
    record('Admin login', false, e.message)
  }

  try {
    const approved = await req(`/admin/moderation/partners/${partnerProfileId}/approve`, {
      method: 'PATCH',
      token: adminToken,
    })
    record('Admin moderation (approve partner)', approved.status === 'APPROVED', approved.status)
  } catch (e) {
    record('Admin moderation (approve partner)', false, e.message)
  }

  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const order = await req('/orders', {
      method: 'POST',
      token: clientToken,
      body: {
        category: 'LAWN',
        serviceId: 'grass-mowing',
        serviceName: 'Stability flow — газон',
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
    record('Client create order', order.status === 'NEW', orderId)
  } catch (e) {
    record('Client create order', false, e.message)
  }

  try {
    const assigned = await req(`/admin/orders/${orderId}/assign`, {
      method: 'PATCH',
      token: adminToken,
      body: { partnerId: partnerProfileId },
    })
    record('Admin order assignment', assigned.partnerId === partnerProfileId, assigned.partnerId)
  } catch (e) {
    record('Admin order assignment', false, e.message)
  }

  try {
    const accepted = await req(`/orders/${orderId}/status`, {
      method: 'PATCH',
      token: partnerToken,
      body: { status: 'ACCEPTED', executorLat: 51.24, executorLng: 51.38 },
    })
    record('Partner accept order', accepted.status === 'ACCEPTED', accepted.status)
  } catch (e) {
    record('Partner accept order', false, e.message)
  }

  try {
    const clientOrders = await req('/orders', { token: clientToken })
    const adminOrders = await req('/admin/orders', { token: adminToken })
    const partnerOrders = await req('/orders', { token: partnerToken })
    const co = clientOrders.find((o) => o.id === orderId)
    const ao = adminOrders.find((o) => o.id === orderId)
    const po = partnerOrders.find((o) => o.id === orderId)
    const synced =
      co?.status === 'ACCEPTED' && ao?.status === 'ACCEPTED' && po?.status === 'ACCEPTED'
    record(
      'Status sync (client / admin / partner)',
      synced,
      `client=${co?.status} admin=${ao?.status} partner=${po?.status}`,
    )
  } catch (e) {
    record('Status sync (client / admin / partner)', false, e.message)
  }

  printSummary()
  process.exit(results.some((r) => !r.ok) ? 1 : 0)
}

function printSummary() {
  const passed = results.filter((r) => r.ok).length
  const failed = results.filter((r) => !r.ok).length
  console.log(`\n── Flow summary: ${passed} passed, ${failed} failed ──\n`)
}

main().catch((e) => {
  console.error('Fatal:', e.message)
  process.exit(1)
})
