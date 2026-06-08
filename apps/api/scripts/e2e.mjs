#!/usr/bin/env node
/**
 * GP API business-flow E2E.
 * Requires: PostgreSQL + migrated DB + seed.
 */

const API = process.env.API_URL || 'http://localhost:4000/api'

let passed = 0
let failed = 0

function assert(cond, msg) {
  if (cond) {
    passed++
    console.log(`  ✓ ${msg}`)
  } else {
    failed++
    console.error(`  ✗ ${msg}`)
  }
}

async function req(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message || res.statusText
    throw new Error(`${method} ${path}: ${msg}`)
  }
  return data
}

async function login(email, password) {
  const r = await req('/auth/login', { method: 'POST', body: { email, password } })
  return r.accessToken
}

function tomorrow(offset = 1) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

async function createSepticOrder(token, suffix, preferredDate = tomorrow()) {
  return req('/orders', {
    method: 'POST',
    token,
    body: {
      category: 'SEPTIC',
      serviceName: `E2E septic ${suffix}`,
      serviceId: 'septic-pumping',
      address: `Уральск, E2E ${suffix}`,
      clientLat: 51.24,
      clientLng: 51.38,
      total: 15000,
      paymentMethod: 'CASH_ON_DELIVERY',
      septicVolume: 6,
      preferredDate,
      preferredTime: '15:00',
      flexibleTime: false,
      onBehalfCity: 'Уральск',
      cityId: 'city-uralsk',
      franchiseId: 'fr-uralsk',
    },
  })
}

async function main() {
  console.log(`\nGP API E2E → ${API}\n`)

  const health = await fetch(`${API}/health`).then((r) => r.json())
  assert(health.status === 'ok', 'health check')

  const stamp = Date.now()
  const clientEmail = `e2e_client_${stamp}@gp.local`
  const partnerEmail = `e2e_partner_${stamp}@gp.local`
  const password = '123456'

  const registeredClient = await req('/auth/register/client', {
    method: 'POST',
    body: {
      email: clientEmail,
      password,
      name: 'E2E Client',
      phone: `+7700${String(stamp).slice(-7)}`,
      city: 'Уральск',
    },
  })
  assert(Boolean(registeredClient.accessToken), 'client registration')

  const registeredPartner = await req('/auth/register/partner', {
    method: 'POST',
    body: {
      email: partnerEmail,
      password,
      name: 'E2E Pending Partner',
      phone: `+7710${String(stamp).slice(-7)}`,
      city: 'Уральск',
      partnerRole: 'SPECIALIST',
      partnerType: 'SEPTIC_SERVICE',
      subserviceIds: ['septic-pumping'],
    },
  })
  assert(Boolean(registeredPartner.accessToken), 'partner registration')
  const pendingPartner = await req('/partners/me', { token: registeredPartner.accessToken })
  assert(pendingPartner.status === 'DRAFT', 'partner registration starts not approved')

  const clientToken = await login(clientEmail, password)
  const adminToken = await login('admin@gp.kz', 'password123')
  const partnerToken = await login('partner@gp.kz', 'password123')

  const seededPartner = await req('/partners/me', { token: partnerToken })
  await req('/partners/me', { method: 'PATCH', token: partnerToken, body: { isOnline: true } })

  let restored = false
  try {
    const order = await createSepticOrder(clientToken, stamp)
    assert(order.status === 'NEW', 'order created as NEW')
    assert(order.assignedPartnerId === seededPartner.id, 'backend auto-assigns matching Uralsk septic partner')

    const adminOrders = await req('/admin/orders', { token: adminToken })
    const adminOrder = adminOrders.find((o) => o.id === order.id)
    assert(Boolean(adminOrder), 'admin sees created order')
    assert(adminOrder?.eventLogs?.some((e) => e.action === 'ORDER_ASSIGNED'), 'admin sees assignment history')

    const partnerNew = await req('/partner/orders/new', { token: partnerToken })
    assert(partnerNew.some((o) => o.id === order.id), 'partner receives assigned order')

    let current = await req(`/partner/orders/${order.id}/accept`, { method: 'PATCH', token: partnerToken })
    assert(current.status === 'ACCEPTED', 'partner accepts order')

    current = await req(`/partner/orders/${order.id}/status`, {
      method: 'PATCH',
      token: partnerToken,
      body: { status: 'ON_WAY', executorLat: 51.245, executorLng: 51.38 },
    })
    assert(current.status === 'ON_WAY', 'partner sets ON_WAY')

    current = await req(`/partner/orders/${order.id}/status`, {
      method: 'PATCH',
      token: partnerToken,
      body: { status: 'IN_PROCESS', executorLat: 51.246, executorLng: 51.381 },
    })
    assert(current.status === 'IN_PROCESS', 'partner sets IN_PROCESS')

    current = await req(`/partner/orders/${order.id}/status`, {
      method: 'PATCH',
      token: partnerToken,
      body: { status: 'COMPLETED' },
    })
    assert(current.status === 'COMPLETED', 'partner completes order')

    const clientOrders = await req('/orders', { token: clientToken })
    assert(clientOrders.some((o) => o.id === order.id && o.status === 'COMPLETED'), 'client sees completed status')

    await req(`/admin/moderation/partners/${seededPartner.id}/suspend`, {
      method: 'PATCH',
      token: adminToken,
      body: { reason: 'E2E blocked partner check' },
    })
    const blockedOrder = await createSepticOrder(clientToken, `${stamp}_blocked`, tomorrow(2))
    assert(!blockedOrder.assignedPartnerId, 'blocked partner does not receive new order')
  } finally {
    try {
      await req(`/admin/moderation/partners/${seededPartner.id}/restore`, {
        method: 'PATCH',
        token: adminToken,
      })
      restored = true
    } catch (e) {
      console.warn(`  ! restore skipped: ${e.message}`)
    }
  }
  assert(restored, 'blocked partner restored after E2E')

  console.log(`\n${passed} passed, ${failed} failed\n`)
  process.exit(failed ? 1 : 0)
}

main().catch((e) => {
  console.error('\nE2E failed:', e.message)
  process.exit(1)
})
