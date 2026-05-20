#!/usr/bin/env node
/**
 * E2E smoke test for GP NestJS API.
 * Requires: PostgreSQL + migrated DB + seed
 */

const API = process.env.API_URL || 'http://localhost:4000'

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

async function main() {
  console.log(`\nGP API E2E → ${API}\n`)

  const health = await fetch(`${API}/health`).then((r) => r.json())
  assert(health.status === 'ok', 'health check')

  const clientToken = await login('client@gp.kz', 'password123')
  const partnerToken = await login('partner@gp.kz', 'password123')

  const balanceBefore = await req('/partners/balance', { token: partnerToken })
  const balStart = Number(balanceBefore.balance)

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const preferredDate = tomorrow.toISOString().slice(0, 10)

  const order = await req('/orders', {
    method: 'POST',
    token: clientToken,
    body: {
      category: 'SEPTIC',
      serviceName: 'E2E откачка',
      address: 'Уральск',
      clientLat: 51.24,
      clientLng: 51.38,
      total: 15000,
      paymentMethod: 'CASH_ON_DELIVERY',
      septicVolume: 6,
      preferredDate,
      preferredTime: '15:00',
      flexibleTime: false,
    },
  })
  assert(order.status === 'NEW', 'order NEW')
  assert(Number(order.gpCommission) === 400, 'commission 400 for 6m³')

  const partnerOrders = await req('/orders', { token: partnerToken })
  assert(partnerOrders.some((o) => o.id === order.id), 'partner sees order')

  const statuses = ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'STARTED', 'COMPLETED']
  let current = order
  for (const status of statuses) {
    current = await req(`/orders/${order.id}/status`, {
      method: 'PATCH',
      token: partnerToken,
      body: { status, executorLat: 51.245, executorLng: 51.38 },
    })
    assert(current.status === status, `partner → ${status}`)
  }

  const midBalance = await req('/partners/balance', { token: partnerToken })
  assert(Number(midBalance.balance) === balStart, 'no commission before client confirm')

  const confirmed = await req(`/orders/${order.id}/confirm`, {
    method: 'PATCH',
    token: clientToken,
  })
  assert(confirmed.status === 'CLIENT_CONFIRMED', 'client confirmed')

  const balanceAfter = await req('/partners/balance', { token: partnerToken })
  assert(Number(balanceAfter.balance) === balStart - 400, 'commission after CLIENT_CONFIRMED')

  const tracking = await req(`/geo/orders/${order.id}/tracking`, { token: clientToken })
  assert(tracking.distanceKm != null, 'tracking has distanceKm')

  console.log(`\n${passed} passed, ${failed} failed\n`)
  process.exit(failed ? 1 : 0)
}

main().catch((e) => {
  console.error('\nE2E failed:', e.message)
  process.exit(1)
})
