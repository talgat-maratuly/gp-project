#!/usr/bin/env node
/**
 * GP QA + Stress Test Runner (real tests against demo store + optional API)
 * npm run qa:all
 */
import fs from 'fs'
import path from 'path'
import { QaReporter, QA_ROOT } from './reporter.mjs'
import {
  createSeedState,
  saveGlobalStore,
  loadGlobalStore,
  findDemoUser,
  DEMO_USERS,
  createClientOrder,
  assignGlobalPartner,
  updateGlobalOrder,
  ordersForClient,
  ordersForPartner,
  scopeByFranchise,
  createHunterProject,
  createFurnitureProject,
  updateServiceProjectStatus,
  listServiceProjects,
  getServiceProjectBundle,
  createShop,
  createMarketProduct,
  createMarketOrder,
  advanceMarketOrder,
  marketOrdersForPartner,
} from '../../packages/shared/src/demo/index.js'
import { SERVICE_PROJECT_TYPES } from '../../packages/shared/src/constants/serviceProjects.js'

const API_BASE = process.env.QA_API_URL || 'http://localhost:4000'

const ROUTES = {
  'GP Service': [
    ['/', 'apps/gp-service/src/features/home/HomePage.jsx'],
    ['/shop', 'apps/gp-service/src/features/shop/CatalogPage.jsx'],
    ['/orders', 'apps/gp-service/src/features/orders/OrdersPage.jsx'],
    ['/services', 'apps/gp-service/src/features/services/ServicesPage.jsx'],
    ['/services/hunter-irrigation', 'apps/gp-service/src/features/hunter-irrigation/HunterServicePage.jsx'],
    ['/services/hunter-irrigation/new', 'apps/gp-service/src/features/hunter-irrigation/HunterProjectWizard.jsx'],
    ['/services/furniture', 'apps/gp-service/src/features/furniture/FurnitureServicePage.jsx'],
    ['/services/furniture/new', 'apps/gp-service/src/features/furniture/FurnitureProjectWizard.jsx'],
    ['/login', 'apps/gp-service/src/features/auth/ClientAuthPage.jsx'],
  ],
  'GP Partner': [
    ['/', 'apps/gp-partner/src/pages/DashboardPage.jsx'],
    ['/orders', 'apps/gp-partner/src/pages/OrdersPage.jsx'],
    ['/orders/hunter-irrigation', 'apps/gp-partner/src/pages/ServiceProjectsOrdersPage.jsx'],
    ['/orders/furniture', 'apps/gp-partner/src/pages/ServiceProjectsOrdersPage.jsx'],
    ['/shop', 'apps/gp-partner/src/pages/MyShopPage.jsx'],
    ['/auth', 'apps/gp-partner/src/pages/AuthPage.jsx'],
  ],
  'GP Admin': [
    ['/', 'apps/gp-admin/src/pages/DashboardPage.jsx'],
    ['/orders', 'apps/gp-admin/src/pages/OrdersPage.jsx'],
    ['/market', 'apps/gp-admin/src/pages/MarketDashboardPage.jsx'],
    ['/market/orders', 'apps/gp-admin/src/pages/MarketOrdersPage.jsx'],
    ['/services/hunter-irrigation', 'apps/gp-admin/src/pages/ServiceProjectsAdminPage.jsx'],
    ['/services/furniture', 'apps/gp-admin/src/pages/ServiceProjectsAdminPage.jsx'],
    ['/testing-report', 'apps/gp-admin/src/pages/TestingReportPage.jsx'],
  ],
}

const API_ENDPOINTS = [
  { method: 'GET', path: '/health', auth: false },
  { method: 'GET', path: '/health/full', auth: false },
  { method: 'GET', path: '/products', auth: false },
  { method: 'GET', path: '/market/products', auth: false },
  { method: 'GET', path: '/market/products?linkedServiceType=hunter_irrigation', auth: false },
  { method: 'POST', path: '/auth/login', auth: false, body: { email: 'client@gp.kz', password: 'password123' } },
]

function assertUniqueIds(list, key, label) {
  const ids = list.map((x) => x[key])
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (dup.length) throw new Error(`Дубликаты ${label}: ${[...new Set(dup)].slice(0, 3).join(', ')}`)
}

async function fetchApi(method, urlPath, body) {
  const t0 = performance.now()
  try {
    const res = await fetch(`${API_BASE}${urlPath}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000),
    })
    const ms = Math.round(performance.now() - t0)
    return { ok: res.ok, status: res.status, ms }
  } catch (e) {
    return { ok: false, status: 0, ms: Math.round(performance.now() - t0), error: e.message }
  }
}

async function runRoutes(r) {
  for (const [mod, routes] of Object.entries(ROUTES)) {
    for (const [route, file] of routes) {
      await r.test('Routes', `${mod} ${route} → ${file}`, async () => {
        const full = path.join(QA_ROOT, file)
        if (!fs.existsSync(full)) throw new Error(`Файл не найден: ${file}`)
      })
    }
  }
}

async function runAuth(r) {
  for (const u of DEMO_USERS) {
    await r.test('Auth', `demo login ${u.username}`, async () => {
      const ok = findDemoUser(u.username, u.password)
      if (!ok) throw new Error('login failed')
      if (ok.role !== u.role) throw new Error('role mismatch')
    })
  }
  await r.test('Auth', 'wrong password rejected', async () => {
    if (findDemoUser('uralsk_client', 'wrong')) throw new Error('should not login')
  })
}

async function runServiceCycle(r) {
  saveGlobalStore(createSeedState())
  const session = { clientId: 'c1', name: 'Айдар', franchiseId: 'fr-uralsk', city: 'Уральск', phone: '+7701' }
  let orderId
  await r.test('Service Orders', 'client creates order', async () => {
    const store = createClientOrder({
      franchiseId: 'fr-uralsk',
      clientId: 'c1',
      clientName: 'Айдар',
      clientPhone: '+7701',
      address: 'QA test',
      city: 'Уральск',
      serviceTemplateId: 'lawn',
      amount: 15000,
    })
    orderId = store.orders[store.orders.length - 1].id
    r.metrics.serviceOrdersCreated++
  })
  await r.test('Service Orders', 'admin uralsk sees order', async () => {
    const store = loadGlobalStore()
    const list = scopeByFranchise(store.orders, 'fr-uralsk')
    if (!list.some((o) => o.id === orderId)) throw new Error('admin uralsk missing order')
  })
  await r.test('Service Orders', 'atyrau admin does NOT see order', async () => {
    const store = loadGlobalStore()
    const list = scopeByFranchise(store.orders, 'fr-atyrau')
    if (list.some((o) => o.id === orderId)) throw new Error('isolation breach atyrau admin')
  })
  await r.test('Service Orders', 'partner before assign empty', async () => {
    const store = loadGlobalStore()
    if (ordersForPartner(store.orders, 'p1', 'fr-uralsk').some((o) => o.id === orderId)) {
      throw new Error('partner sees unassigned')
    }
  })
  await r.test('Service Orders', 'assign partner → partner sees', async () => {
    assignGlobalPartner(orderId, 'p1')
    const store = loadGlobalStore()
    if (!ordersForPartner(store.orders, 'p1', 'fr-uralsk').some((o) => o.id === orderId)) {
      throw new Error('partner missing after assign')
    }
  })
  await r.test('Service Orders', 'status → completed → client sees', async () => {
    updateGlobalOrder(orderId, { status: 'completed' })
    const client = ordersForClient(loadGlobalStore().orders, 'c1')
    if (client.find((o) => o.id === orderId)?.status !== 'completed') throw new Error('client status')
  })
}

async function runHunterCycle(r) {
  saveGlobalStore(createSeedState())
  const session = { clientId: 'c1', name: 'Айдар', franchiseId: 'fr-uralsk', city: 'Уральск' }
  let spId
  await r.test('Hunter', 'create hunter project', async () => {
    createHunterProject(session, {
      length: 10, width: 8, waterSource: 'city', pressure: 2.5, waterFlow: 2, submit: true,
    })
    const list = listServiceProjects({ type: SERVICE_PROJECT_TYPES.HUNTER_IRRIGATION })
    spId = list[list.length - 1].id
    r.metrics.hunterCreated++
    const bundle = getServiceProjectBundle(spId)
    if (!bundle?.hunter?.drawing2D) throw new Error('no drawing2D')
    if (!bundle.hunter.estimate?.total) throw new Error('no estimate')
  })
  await r.test('Hunter', 'admin sees hunter project', async () => {
    const all = listServiceProjects({ type: SERVICE_PROJECT_TYPES.HUNTER_IRRIGATION })
    if (!all.some((p) => p.id === spId)) throw new Error('admin list missing')
  })
  await r.test('Hunter', 'partner assign + complete', async () => {
    updateServiceProjectStatus(spId, 'assigned', 'p1')
    updateServiceProjectStatus(spId, 'in_progress', 'p1')
    updateServiceProjectStatus(spId, 'completed', 'p1')
    const p = listServiceProjects({ partnerId: 'p1' }).find((x) => x.id === spId)
    if (p?.status !== 'completed') throw new Error('partner flow status')
  })
}

async function runFurnitureCycle(r) {
  saveGlobalStore(createSeedState())
  const session = { clientId: 'c4', name: 'Серик', franchiseId: 'fr-atyrau', city: 'Атырау' }
  let spId
  await r.test('Furniture', 'create furniture project', async () => {
    createFurnitureProject(session, {
      roomWidth: 3, roomHeight: 2.7, furnitureLength: 2.4, furnitureDepth: 0.6,
      material: 'ldsp', facadeMaterial: 'ldsp_facade', color: 'white', submit: true,
    })
    spId = listServiceProjects({ type: SERVICE_PROJECT_TYPES.FURNITURE }).slice(-1)[0].id
    r.metrics.furnitureCreated++
  })
  await r.test('Furniture', 'franchise isolation', async () => {
    const uralsk = listServiceProjects({ type: SERVICE_PROJECT_TYPES.FURNITURE, franchiseId: 'fr-uralsk' })
    if (uralsk.some((p) => p.id === spId)) throw new Error('uralsk sees atyrau furniture')
  })
}

async function runMarketCycle(r) {
  saveGlobalStore(createSeedState())
  createShop({
    franchiseId: 'fr-uralsk', city: 'Уральск', partnerId: 'p1',
    shopName: 'QA Shop', ownerName: 'QA', phone: '+7701', address: 'QA',
  })
  const store = loadGlobalStore()
  const shop = store.shops.find((s) => s.partnerId === 'p1')
  createMarketProduct({
    franchiseId: 'fr-uralsk', city: 'Уральск', partnerId: 'p1', shopId: shop.id,
    categoryId: 'annuals', name: 'QA Петуния', price: 500, quantity: 100,
  })
  const prod = loadGlobalStore().marketProducts.find((p) => p.name === 'QA Петуния')
  let orderId
  await r.test('GP Market', 'create market order', async () => {
    createMarketOrder({
      franchiseId: 'fr-uralsk', city: 'Уральск', clientId: 'c1', clientName: 'Айдар',
      partnerId: 'p1', shopId: shop.id,
      items: [{ productId: prod.id, name: prod.name, price: prod.price, qty: 2, unit: 'шт' }],
      deliveryType: 'DELIVERY', deliveryAddress: 'QA', paymentMethod: 'cash', deliveryPrice: 1000,
    })
    orderId = loadGlobalStore().marketOrders.slice(-1)[0].id
    r.metrics.marketOrdersCreated++
  })
  await r.test('GP Market', 'partner sees market order', async () => {
    const list = marketOrdersForPartner(loadGlobalStore().marketOrders, 'p1')
    if (!list.some((o) => o.id === orderId)) throw new Error('partner missing market order')
  })
  await r.test('GP Market', 'admin sees + status flow', async () => {
    advanceMarketOrder(orderId)
    const o = loadGlobalStore().marketOrders.find((x) => x.id === orderId)
    if (o.status === 'NEW') throw new Error('status not advanced')
  })
}

async function runStress(r) {
  const base = createSeedState()
  const extraPartners = Array.from({ length: 50 }, (_, i) => ({
    id: `p_qa_${i}`,
    franchiseId: i % 2 === 0 ? 'fr-uralsk' : 'fr-atyrau',
    name: `Partner QA ${i}`,
    company: `QA Co ${i}`,
    phone: `+7701000${String(i).padStart(4, '0')}`,
    serviceIds: [],
    city: i % 2 === 0 ? 'Уральск' : 'Атырау',
    active: true, blocked: false, rating: 4, completedOrders: 0, earnings: 0, gpCommissionPaid: 0,
  }))
  const extraClients = Array.from({ length: 100 }, (_, i) => ({
    id: `c_qa_${i}`,
    franchiseId: i % 2 === 0 ? 'fr-uralsk' : 'fr-atyrau',
    name: `QA Client ${i}`,
    phone: `+7702000${String(i).padStart(4, '0')}`,
    address: `QA Address ${i}`,
    city: i % 2 === 0 ? 'Уральск' : 'Атырау',
    type: 'house',
    gpIdBonus: 0,
    freeFifthOrder: false,
    discountPercent: 0,
    totalSpent: 0,
    orderIds: [],
  }))
  base.partners = [...base.partners, ...extraPartners]
  base.clients = [...base.clients, ...extraClients]
  r.metrics.partnersGenerated = extraPartners.length
  r.metrics.testUsersGenerated = extraClients.length

  saveGlobalStore(base)

  await r.test('Stress', '100 generated clients in store', async () => {
    const n = loadGlobalStore().clients.filter((c) => c.id.startsWith('c_qa_')).length
    if (n < 100) throw new Error(`only ${n} QA clients`)
    assertUniqueIds(loadGlobalStore().clients, 'id', 'clients')
  })

  const hunterSession = { clientId: 'c1', name: 'Stress', franchiseId: 'fr-uralsk', city: 'Уральск' }
  const t0 = performance.now()
  for (let i = 0; i < 100; i++) {
    createHunterProject(hunterSession, {
      length: 8 + (i % 5), width: 6 + (i % 4), waterSource: 'city', pressure: 2, waterFlow: 1.5, submit: true,
    })
  }
  const hunterMs = performance.now() - t0
  r.metrics.hunterCreated += 100

  await r.test('Stress', '100 hunter projects persisted', async () => {
    const n = listServiceProjects({ type: SERVICE_PROJECT_TYPES.HUNTER_IRRIGATION }).length
    if (n < 100) throw new Error(`only ${n} hunter projects`)
    assertUniqueIds(loadGlobalStore().serviceProjects, 'id', 'serviceProjects')
  })
  if (hunterMs > 15000) r.warn('Stress', `100 hunter creates slow: ${Math.round(hunterMs)}ms`)

  const furnSession = { clientId: 'c4', name: 'Stress', franchiseId: 'fr-atyrau', city: 'Атырау' }
  for (let i = 0; i < 100; i++) {
    createFurnitureProject(furnSession, {
      roomWidth: 3, roomHeight: 2.7, furnitureLength: 2 + i * 0.01, furnitureDepth: 0.6,
      material: 'ldsp', facadeMaterial: 'ldsp_facade', color: 'white', submit: true,
    })
  }
  r.metrics.furnitureCreated += 100

  await r.test('Stress', '100 furniture projects', async () => {
    const n = listServiceProjects({ type: SERVICE_PROJECT_TYPES.FURNITURE }).length
    if (n < 100) throw new Error(`only ${n} furniture`)
  })

  const shop = loadGlobalStore().shops[0] || createShop({
    franchiseId: 'fr-atyrau', city: 'Атырау', partnerId: 'p3',
    shopName: 'Stress Shop', ownerName: 'M', phone: '1', address: 'A',
  }).shops[0]
  let prod = loadGlobalStore().marketProducts.find((p) => p.shopId === shop?.id)
  if (!prod) {
    createMarketProduct({
      franchiseId: shop.franchiseId, city: shop.city, partnerId: shop.partnerId, shopId: shop.id,
      categoryId: 'annuals', name: 'Stress Item', price: 100, quantity: 10000,
    })
    prod = loadGlobalStore().marketProducts.slice(-1)[0]
  }
  for (let i = 0; i < 100; i++) {
    createMarketOrder({
      franchiseId: shop.franchiseId, city: shop.city, clientId: 'c4', clientName: 'Stress',
      partnerId: shop.partnerId, shopId: shop.id,
      items: [{ productId: prod.id, name: prod.name, price: prod.price, qty: 1, unit: 'шт' }],
      deliveryType: 'PICKUP', deliveryAddress: '', paymentMethod: 'cash', deliveryPrice: 0,
    })
  }
  r.metrics.marketOrdersCreated += 100

  await r.test('Stress', '100 market orders + no duplicate ids', async () => {
    const orders = loadGlobalStore().marketOrders
    if (orders.length < 100) throw new Error(`market orders ${orders.length}`)
    assertUniqueIds(orders, 'id', 'marketOrders')
  })

  await r.test('Stress', 'status updates on sample', async () => {
    const sample = loadGlobalStore().marketOrders.slice(0, 10)
    for (const o of sample) advanceMarketOrder(o.id)
    const st = loadGlobalStore().marketOrders.find((x) => x.id === sample[0].id)
    if (st.status === 'NEW') throw new Error('status stuck')
  })
}

async function runStoreIntegrity(r) {
  const store = loadGlobalStore()
  await r.test('Data', 'store version and arrays', async () => {
    if (!store.franchises?.length) throw new Error('no franchises')
    if (!Array.isArray(store.marketProducts)) throw new Error('marketProducts missing')
    if (!Array.isArray(store.serviceProjects)) throw new Error('serviceProjects missing')
  })
  await r.test('Data', 'linked market products', async () => {
    const linked = (store.marketProducts || []).filter((p) => p.linkedServiceType)
    if (!linked.length) r.warn('Data', 'no linkedServiceType products in seed')
  })
}

async function runApi(r) {
  let anyOk = false
  for (const ep of API_ENDPOINTS) {
    await r.test('API', `${ep.method} ${ep.path}`, async () => {
      const res = await fetchApi(ep.method, ep.path, ep.body)
      r.recordApi(ep.method, ep.path, res.ms, res.ok, res.status, res.error)
      if (ep.path === '/health' && res.ok) anyOk = true
      if (!res.ok && ep.path === '/health') {
        r.warn('API', res.error || `HTTP ${res.status} — backend not running`)
        return
      }
      if (!res.ok && ep.path !== '/health') {
        r.warn('API', `${ep.path} → ${res.status || res.error} (API may be down)`)
      }
    })
  }
  r.metrics.apiReachable = anyOk
  if (!anyOk) r.warn('API', 'Backend offline — API tests skipped (demo store tests still valid)')
}

async function main() {
  const r = new QaReporter()
  r.log('=== GP QA + Stress Test Run ===')

  await runRoutes(r)
  await runAuth(r)
  await runServiceCycle(r)
  await runHunterCycle(r)
  await runFurnitureCycle(r)
  await runMarketCycle(r)
  await runStoreIntegrity(r)
  await runStress(r)
  await runApi(r)

  const report = r.buildReport()
  r.writeFiles(report)

  console.log('\n=== SUMMARY ===')
  console.log(`Tests: ${report.summary.totalTests} | Passed: ${report.summary.passed} | Failed: ${report.summary.failed}`)
  console.log(`Status: ${report.summary.systemStatus} | Hunter: ${report.metrics.hunterCreated} | Furniture: ${report.metrics.furnitureCreated} | Market: ${report.metrics.marketOrdersCreated}`)
  process.exit(report.summary.failed > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
