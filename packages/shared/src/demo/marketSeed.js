/** Демо-данные GP Market */

const now = Date.now()

function product({
  id, franchiseId, city, partnerId, shopId, categoryId, name, price, quantity = 10, unit = 'шт',
  linkedServiceType = null, brand = 'GP Market',
}) {
  return {
    id,
    franchiseId,
    city,
    partnerId,
    shopId,
    categoryId,
    name,
    description: `${name} — демо-товар GP Market`,
    price,
    oldPrice: null,
    quantity,
    unit,
    images: [`demo-${id}.jpg`],
    status: 'ACTIVE',
    deliveryAvailable: true,
    pickupAvailable: true,
    linkedServiceType,
    brand,
    createdAt: now - 86400000,
    updatedAt: now,
  }
}

export function buildMarketSeed() {
  const deliveryCompanies = [
    { id: 'del-gp', name: 'GP Delivery', city: 'Уральск', phone: '+77011112233', status: 'ACTIVE', priceType: 'FIXED', basePrice: 1500, isActive: true, franchiseId: 'fr-uralsk' },
    { id: 'del-yandex', name: 'Яндекс доставка', city: 'Алматы', phone: '+77015556677', status: 'ACTIVE', priceType: 'BY_DISTANCE', basePrice: 2000, isActive: true, franchiseId: null },
    { id: 'del-partner', name: 'Курьер партнёра', city: 'Уральск', phone: '+77012223344', status: 'ACTIVE', priceType: 'FIXED', basePrice: 1000, isActive: true, franchiseId: 'fr-uralsk' },
    { id: 'del-pickup', name: 'Самовывоз', city: 'Уральск', phone: '', status: 'ACTIVE', priceType: 'FIXED', basePrice: 0, isActive: true, franchiseId: null },
    { id: 'del-other', name: 'Другая компания', city: 'Атырау', phone: '+77013334455', status: 'ACTIVE', priceType: 'FIXED', basePrice: 1200, isActive: true, franchiseId: 'fr-atyrau' },
  ]

  const shops = [
    {
      id: 'shop-atyrau',
      franchiseId: 'fr-atyrau',
      city: 'Атырау',
      partnerId: 'p3',
      shopName: 'Green Market Атырау',
      ownerName: 'Марат',
      phone: '+77012223344',
      address: 'Атырау, пр. Достык 5',
      status: 'ACTIVE',
      kaspiPaymentInfo: 'demo-kaspi-atyrau',
      deliveryEnabled: true,
      createdAt: '2025-06-01',
    },
    {
      id: 'shop-aktobe',
      franchiseId: 'fr-aktobe',
      city: 'Актобе',
      partnerId: 'p4',
      shopName: 'AutoPoliv Aktobe',
      ownerName: 'Динара',
      phone: '+77013332211',
      address: 'Актобе, ул. Абая 12',
      status: 'ACTIVE',
      kaspiPaymentInfo: 'demo-kaspi-aktobe',
      deliveryEnabled: true,
      createdAt: '2025-07-01',
    },
  ]

  const marketProducts = [
    product({ id: 'mp-aty-1', franchiseId: 'fr-atyrau', city: 'Атырау', partnerId: 'p3', shopId: 'shop-atyrau', categoryId: 'annuals', name: 'Бархатцы', price: 450, quantity: 40 }),
    product({ id: 'mp-aty-2', franchiseId: 'fr-atyrau', city: 'Атырау', partnerId: 'p3', shopId: 'shop-atyrau', categoryId: 'lawn', name: 'Газонная трава', price: 3200, unit: 'кг', quantity: 15 }),
    product({ id: 'mp-akt-1', franchiseId: 'fr-aktobe', city: 'Актобе', partnerId: 'p4', shopId: 'shop-aktobe', categoryId: 'irrigation', name: 'Насос для автополива', price: 45000, quantity: 5 }),
    product({ id: 'mp-akt-2', franchiseId: 'fr-aktobe', city: 'Актобе', partnerId: 'p4', shopId: 'shop-aktobe', categoryId: 'filters', name: 'Фильтр для воды', price: 18500, quantity: 8 }),
    product({ id: 'mp-hunter-1', franchiseId: 'fr-uralsk', city: 'Уральск', partnerId: 'p2', shopId: 'shop-atyrau', categoryId: 'hunter_irrigation', name: 'Hunter MP Rotator 2000', price: 4200, quantity: 30, brand: 'Hunter', linkedServiceType: 'hunter_irrigation' }),
    product({ id: 'mp-hunter-2', franchiseId: 'fr-uralsk', city: 'Уральск', partnerId: 'p2', shopId: 'shop-atyrau', categoryId: 'hunter_irrigation', name: 'Контроллер Hunter X2', price: 28500, quantity: 10, brand: 'Hunter', linkedServiceType: 'hunter_irrigation' }),
    product({ id: 'mp-furn-1', franchiseId: 'fr-atyrau', city: 'Атырау', partnerId: 'p3', shopId: 'shop-atyrau', categoryId: 'furniture', name: 'ЛДСП 16мм', price: 8500, unit: 'м²', quantity: 50, linkedServiceType: 'furniture' }),
    product({ id: 'mp-furn-2', franchiseId: 'fr-atyrau', city: 'Атырау', partnerId: 'p3', shopId: 'shop-atyrau', categoryId: 'furniture', name: 'Петли Blum', price: 1200, quantity: 200, linkedServiceType: 'furniture' }),
  ]

  const marketOrders = []

  return { deliveryCompanies, shops, marketProducts, marketOrders }
}
