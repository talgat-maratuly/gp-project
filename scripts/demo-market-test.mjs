#!/usr/bin/env node
import {
  createSeedState,
  saveGlobalStore,
  createShop,
  createMarketProduct,
  createMarketOrder,
  advanceMarketOrder,
  productsForClient,
  marketOrdersForPartner,
  scopeByFranchise,
} from '../packages/shared/src/demo/index.js'

let failed = 0
function ok(c, m) {
  if (!c) { console.error('FAIL:', m); failed++ } else console.log('OK:', m)
}

let store = saveGlobalStore(createSeedState())

store = createShop({
  franchiseId: 'fr-uralsk',
  city: 'Уральск',
  partnerId: 'p1',
  shopName: 'GP Garden Уральск',
  ownerName: 'Бауыржан',
  phone: '+77015551234',
  address: 'Уральск, ул. Садовая 1',
})
const shop = store.shops.find((s) => s.partnerId === 'p1')
ok(shop, 'магазин партнёра создан')

store = createMarketProduct({
  franchiseId: 'fr-uralsk',
  city: 'Уральск',
  partnerId: 'p1',
  shopId: shop.id,
  categoryId: 'annuals',
  name: 'Петуния',
  price: 890,
  quantity: 25,
  unit: 'шт',
})
const petunia = store.marketProducts.find((p) => p.name === 'Петуния')
ok(petunia, 'товар Петуния добавлен')

const uralskProducts = productsForClient(store.marketProducts, 'fr-uralsk')
ok(uralskProducts.some((p) => p.id === petunia.id), 'клиент Уральска видит Петунию')

const atyrauProducts = productsForClient(store.marketProducts, 'fr-atyrau')
ok(!atyrauProducts.some((p) => p.id === petunia.id), 'Атырау не видит Петунию Уральска')

store = createMarketOrder({
  franchiseId: 'fr-uralsk',
  city: 'Уральск',
  clientId: 'c1',
  clientName: 'Айдар',
  partnerId: 'p1',
  shopId: shop.id,
  items: [{ productId: petunia.id, name: 'Петуния', price: 890, qty: 2, unit: 'шт' }],
  deliveryType: 'DELIVERY',
  deliveryAddress: 'Уральск тест',
  paymentMethod: 'kaspi_qr',
  deliveryPrice: 1500,
  paymentStatus: 'PAID',
})
const order = store.marketOrders[store.marketOrders.length - 1]
ok(order, 'заказ создан')

const partnerOrders = marketOrdersForPartner(store.marketOrders, 'p1')
ok(partnerOrders.some((o) => o.id === order.id), 'партнёр видит заказ')

store = advanceMarketOrder(order.id)
let st = store.marketOrders.find((o) => o.id === order.id)?.status
while (st && st !== 'DELIVERED') {
  store = advanceMarketOrder(order.id)
  st = store.marketOrders.find((o) => o.id === order.id)?.status
}
ok(st === 'DELIVERED', 'заказ доставлен')

const adminUralsk = scopeByFranchise(store.marketOrders, 'fr-uralsk')
const adminAtyrau = scopeByFranchise(store.marketOrders, 'fr-atyrau')
ok(adminUralsk.some((o) => o.id === order.id), 'admin Уральск видит заказ')
ok(!adminAtyrau.some((o) => o.id === order.id), 'admin Атырау не видит')

console.log(failed ? `\n${failed} ошибок` : '\nMarket demo OK')
process.exit(failed ? 1 : 0)
