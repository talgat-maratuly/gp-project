#!/usr/bin/env node
/**
 * Автопроверка demo-цикла GP (store logic, без браузера).
 * Запуск: npm run demo:test
 */
import {
  createSeedState,
  ordersForClient,
  ordersForPartner,
  scopeByFranchise,
} from '../packages/shared/src/demo/index.js'

let failed = 0
function ok(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg)
    failed++
  } else {
    console.log('OK:', msg)
  }
}

let store = createSeedState()

function addOrder(payload) {
  const order = {
    id: `ord_test_${Date.now()}`,
    franchiseId: payload.franchiseId,
    clientId: payload.clientId,
    clientName: payload.clientName,
    clientPhone: payload.clientPhone,
    address: payload.address,
    city: payload.city,
    serviceId: `lawn_${payload.franchiseId}`,
    serviceName: 'Стрижка газона',
    subserviceId: `sub_500_${payload.franchiseId}`,
    subserviceName: '100–500 м²',
    scheduledAt: '2026-06-01',
    status: 'new',
    partnerId: null,
    partnerName: null,
    amount: 18000,
    gpCommission: 0,
    note: '',
    createdAt: Date.now(),
  }
  store = { ...store, orders: [...store.orders, order] }
  return order
}

const order = addOrder({
  franchiseId: 'fr-uralsk',
  clientId: 'c1',
  clientName: 'Айдар Клиент',
  clientPhone: '+77012236262',
  address: 'Уральск тест',
  city: 'Уральск',
})

ok(order.franchiseId === 'fr-uralsk', 'заявка в Уральске')

const uralskAdminOrders = scopeByFranchise(store.orders, 'fr-uralsk')
const atyrauAdminOrders = scopeByFranchise(store.orders, 'fr-atyrau')
ok(uralskAdminOrders.some((o) => o.id === order.id), 'uralsk_admin видит заявку')
ok(!atyrauAdminOrders.some((o) => o.id === order.id), 'atyrau_admin НЕ видит заявку Уральска')

const beforeAssignUralsk = ordersForPartner(store.orders, 'p1', 'fr-uralsk')
const beforeAssignAtyrau = ordersForPartner(store.orders, 'p3', 'fr-atyrau')
ok(!beforeAssignUralsk.some((o) => o.id === order.id), 'uralsk_partner НЕ видит до назначения')
ok(!beforeAssignAtyrau.some((o) => o.id === order.id), 'atyrau_partner НЕ видит чужую')

store = {
  ...store,
  orders: store.orders.map((o) =>
    o.id === order.id
      ? { ...o, partnerId: 'p1', partnerName: 'GP Услуги', status: 'assigned' }
      : o,
  ),
}
ok(store.orders.find((o) => o.id === order.id)?.partnerId === 'p1', 'партнёр назначен')

const uralskPartner = ordersForPartner(store.orders, 'p1', 'fr-uralsk')
const atyrauPartner = ordersForPartner(store.orders, 'p3', 'fr-atyrau')
ok(uralskPartner.some((o) => o.id === order.id), 'uralsk_partner видит после назначения')
ok(!atyrauPartner.some((o) => o.id === order.id), 'atyrau_partner НЕ видит Уральск')

store = {
  ...store,
  orders: store.orders.map((o) =>
    o.id === order.id ? { ...o, status: 'completed', gpCommission: 1000 } : o,
  ),
}

const clientOrders = ordersForClient(store.orders, 'c1')
ok(clientOrders.find((o) => o.id === order.id)?.status === 'completed', 'клиент видит completed')

const otherClient = ordersForClient(store.orders, 'c2')
ok(!otherClient.some((o) => o.id === order.id), 'другой клиент не видит чужую заявку')

console.log(failed ? `\n${failed} ошибок` : '\nВсе проверки пройдены')
process.exit(failed ? 1 : 0)
