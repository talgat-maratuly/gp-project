/** Демо-данные GP Admin v2 — франшизы, права, franchiseId на всех сущностях */

export const STORE_VERSION = 2

export const FRANCHISE_STATUS = ['ACTIVE', 'INACTIVE', 'BLOCKED']

export const DEMO_USERS = [
  { username: 'superadmin', password: '1234', role: 'SUPER_ADMIN', name: 'GP Super Admin', franchiseId: null },
  { username: 'atyrau_admin', password: '1234', role: 'FRANCHISE_ADMIN', name: 'Админ Атырау', franchiseId: 'fr-atyrau' },
  { username: 'aktobe_admin', password: '1234', role: 'FRANCHISE_ADMIN', name: 'Админ Актобе', franchiseId: 'fr-aktobe' },
  { username: 'uralsk_admin', password: '1234', role: 'FRANCHISE_ADMIN', name: 'Админ Уральск', franchiseId: 'fr-uralsk' },
  { username: 'manager', password: '1234', role: 'MANAGER', name: 'Менеджер Уральск', franchiseId: 'fr-uralsk' },
  { username: 'finance', password: '1234', role: 'FINANCE', name: 'Финансы Уральск', franchiseId: 'fr-uralsk' },
  { username: 'support', password: '1234', role: 'SUPPORT', name: 'Поддержка Уральск', franchiseId: 'fr-uralsk' },
]

export const ORDER_STATUSES = [
  { id: 'new', color: 'sky' },
  { id: 'assigned', color: 'violet' },
  { id: 'in_progress', color: 'amber' },
  { id: 'completed', color: 'emerald' },
  { id: 'cancelled', color: 'slate' },
  { id: 'problem', color: 'red' },
]

export const CLIENT_TYPES = ['apartment', 'house', 'legal']

export const DISCOUNT_TYPES = ['PERCENT', 'FIXED', 'FREE_ORDER']

export const DEFAULT_SETTINGS = {
  defaultCommissionPercent: 12,
}

export const FRANCHISES_SEED = [
  { id: 'fr-uralsk', name: 'GP Уральск', city: 'Уральск', ownerName: 'Нұрлан Бек', phone: '+77011110001', status: 'ACTIVE', createdAt: '2025-01-10' },
  { id: 'fr-aktobe', name: 'GP Актобе', city: 'Актобе', ownerName: 'Айгүл Сәрсен', phone: '+77011110002', status: 'ACTIVE', createdAt: '2025-02-15' },
  { id: 'fr-atyrau', name: 'GP Атырау', city: 'Атырау', ownerName: 'Ерлан Қасым', phone: '+77011110003', status: 'ACTIVE', createdAt: '2025-03-01' },
  { id: 'fr-almaty', name: 'GP Алматы', city: 'Алматы', ownerName: 'Дана Оспан', phone: '+77011110004', status: 'ACTIVE', createdAt: '2025-04-20' },
  { id: 'fr-astana', name: 'GP Астана', city: 'Астана', ownerName: 'Арман Жұма', phone: '+77011110005', status: 'INACTIVE', createdAt: '2025-05-01' },
]

function subs(id, name, price, commission) {
  return { id, name, price, gpCommission: commission, active: true }
}

function serviceTemplate(franchiseId, id, name, basePrice, gpCommission, active, subservices) {
  return {
    id: `${id}_${franchiseId}`,
    templateId: id,
    franchiseId,
    name,
    basePrice,
    gpCommission,
    active,
    subservices,
  }
}

function buildServicesForFranchise(franchiseId) {
  return [
    serviceTemplate(franchiseId, 'septic', 'Откачка септика', 8000, 300, true, [
      subs(`sub_3m_${franchiseId}`, '3 куба', 8000, 300),
      subs(`sub_5m_${franchiseId}`, '5 кубов', 12000, 400),
      subs(`sub_10m_${franchiseId}`, '10 кубов', 20000, 600),
      subs(`sub_urgent_${franchiseId}`, 'Срочный вызов', 15000, 500),
      subs(`sub_night_${franchiseId}`, 'Ночной вызов', 18000, 600),
    ]),
    serviceTemplate(franchiseId, 'lawn', 'Стрижка газона', 15000, 1000, true, [
      subs(`sub_100_${franchiseId}`, 'до 100 м²', 12000, 800),
      subs(`sub_500_${franchiseId}`, '100–500 м²', 18000, 1000),
      subs(`sub_1000_${franchiseId}`, '500–1000 м²', 28000, 1500),
      subs(`sub_mow_${franchiseId}`, 'Покос травы', 10000, 600),
      subs(`sub_haul_${franchiseId}`, 'Вывоз травы', 8000, 400),
    ]),
    serviceTemplate(franchiseId, 'filter', 'Замена фильтра', 6000, 1000, true, [
      subs(`sub_std_${franchiseId}`, 'Стандарт', 6000, 1000),
      subs(`sub_prem_${franchiseId}`, 'Премиум', 9000, 1200),
    ]),
    serviceTemplate(franchiseId, 'irrigation', 'Автополив', 20000, 1000, true, []),
    serviceTemplate(franchiseId, 'cleaning', 'Клининг', 12000, 800, true, []),
    serviceTemplate(franchiseId, 'landscape', 'Озеленение', 25000, 1500, true, []),
    serviceTemplate(franchiseId, 'rental', 'Аренда оборудования', 10000, 500, false, []),
  ]
}

function mkId(prefix, n) {
  return `${prefix}-${String(n).padStart(4, '0')}`
}

export function createSeedState() {
  const franchises = FRANCHISES_SEED.map((f) => ({ ...f }))
  const services = franchises.flatMap((f) => buildServicesForFranchise(f.id))

  const now = Date.now()

  const clients = [
    { id: 'c1', franchiseId: 'fr-uralsk', name: 'Айдар Клиент', phone: '+77012236262', address: 'ул. Мухит 112', city: 'Уральск', type: 'house', gpIdBonus: 120, freeFifthOrder: false, discountPercent: 0, totalSpent: 0, orderIds: [] },
    { id: 'c2', franchiseId: 'fr-uralsk', name: 'Мария Садыкова', phone: '+77015550101', address: 'ЖМ Астана 45', city: 'Уральск', type: 'apartment', gpIdBonus: 80, freeFifthOrder: true, discountPercent: 5, totalSpent: 0, orderIds: [] },
    { id: 'c3', franchiseId: 'fr-atyrau', name: 'ТОО «Береке»', phone: '+77017778899', address: 'пр. Достык 12', city: 'Атырау', type: 'legal', gpIdBonus: 200, freeFifthOrder: false, discountPercent: 10, totalSpent: 0, orderIds: [] },
    { id: 'c4', franchiseId: 'fr-atyrau', name: 'Серик Атырау', phone: '+77013334455', address: 'мкр. Балықшы', city: 'Атырау', type: 'house', gpIdBonus: 45, freeFifthOrder: false, discountPercent: 0, totalSpent: 0, orderIds: [] },
    { id: 'c5', franchiseId: 'fr-aktobe', name: 'Гүлнар Актобе', phone: '+77014445566', address: 'ул. Абая 8', city: 'Актобе', type: 'apartment', gpIdBonus: 60, freeFifthOrder: false, discountPercent: 0, totalSpent: 0, orderIds: [] },
    { id: 'c6', franchiseId: 'fr-almaty', name: 'Алмас Алматы', phone: '+77019998877', address: 'пр. Абая 100', city: 'Алматы', type: 'house', gpIdBonus: 150, freeFifthOrder: false, discountPercent: 0, totalSpent: 0, orderIds: [] },
  ]

  const partners = [
    { id: 'p1', franchiseId: 'fr-uralsk', name: 'Бауыржан', company: 'GP Услуги Уральск', phone: '+77015551234', serviceIds: [`septic_fr-uralsk`, `lawn_fr-uralsk`], city: 'Уральск', active: true, blocked: false, rating: 4.8, completedOrders: 0, earnings: 0, gpCommissionPaid: 0 },
    { id: 'p2', franchiseId: 'fr-uralsk', name: 'Асхат', company: 'AquaPro', phone: '+77019990011', serviceIds: [`irrigation_fr-uralsk`, `filter_fr-uralsk`], city: 'Уральск', active: true, blocked: false, rating: 4.6, completedOrders: 0, earnings: 0, gpCommissionPaid: 0 },
    { id: 'p3', franchiseId: 'fr-atyrau', name: 'Марат', company: 'Atyrau Service', phone: '+77012223344', serviceIds: [`septic_fr-atyrau`], city: 'Атырау', active: true, blocked: false, rating: 4.5, completedOrders: 0, earnings: 0, gpCommissionPaid: 0 },
    { id: 'p4', franchiseId: 'fr-aktobe', name: 'Динара', company: 'Aktobe Green', phone: '+77013332211', serviceIds: [`lawn_fr-aktobe`], city: 'Актобе', active: true, blocked: false, rating: 4.7, completedOrders: 0, earnings: 0, gpCommissionPaid: 0 },
  ]

  const septicUralsk = `septic_fr-uralsk`
  const sub3m = `sub_3m_fr-uralsk`
  const lawnUralsk = `lawn_fr-uralsk`

  const orders = [
    { id: mkId('ord', 1), franchiseId: 'fr-uralsk', clientId: 'c1', clientName: 'Айдар Клиент', clientPhone: '+77012236262', address: 'Уральск, ул. Мухит 112', city: 'Уральск', serviceId: septicUralsk, serviceName: 'Откачка септика', subserviceId: sub3m, subserviceName: '3 куба', scheduledAt: '2026-05-21', status: 'new', partnerId: null, partnerName: null, amount: 8000, gpCommission: 300, note: '', createdAt: now - 3600000 },
    { id: mkId('ord', 2), franchiseId: 'fr-uralsk', clientId: 'c2', clientName: 'Мария Садыкова', clientPhone: '+77015550101', address: 'Уральск, ЖМ Астана 45', city: 'Уральск', serviceId: lawnUralsk, serviceName: 'Стрижка газона', subserviceId: `sub_500_fr-uralsk`, subserviceName: '100–500 м²', scheduledAt: '2026-05-22', status: 'assigned', partnerId: 'p1', partnerName: 'GP Услуги Уральск', amount: 18000, gpCommission: 1000, note: '', createdAt: now - 7200000 },
    { id: mkId('ord', 3), franchiseId: 'fr-atyrau', clientId: 'c3', clientName: 'ТОО «Береке»', clientPhone: '+77017778899', address: 'Атырау, пр. Достык 12', city: 'Атырау', serviceId: `septic_fr-atyrau`, serviceName: 'Откачка септика', subserviceId: `sub_5m_fr-atyrau`, subserviceName: '5 кубов', scheduledAt: '2026-05-20', status: 'in_progress', partnerId: 'p3', partnerName: 'Atyrau Service', amount: 12000, gpCommission: 400, note: '', createdAt: now - 86400000 },
    { id: mkId('ord', 4), franchiseId: 'fr-uralsk', clientId: 'c1', clientName: 'Айдар Клиент', clientPhone: '+77012236262', address: 'Уральск, ул. Мухит 112', city: 'Уральск', serviceId: `filter_fr-uralsk`, serviceName: 'Замена фильтра', subserviceId: null, subserviceName: null, scheduledAt: '2026-05-18', status: 'completed', partnerId: 'p2', partnerName: 'AquaPro', amount: 6000, gpCommission: 1000, note: '', createdAt: now - 172800000 },
    { id: mkId('ord', 5), franchiseId: 'fr-atyrau', clientId: 'c4', clientName: 'Серик Атырау', clientPhone: '+77013334455', address: 'Атырау, мкр. Балықшы', city: 'Атырау', serviceId: `septic_fr-atyrau`, serviceName: 'Откачка септика', subserviceId: null, subserviceName: null, scheduledAt: '2026-05-19', status: 'problem', partnerId: 'p3', partnerName: 'Atyrau Service', amount: 8000, gpCommission: 300, note: 'Жалоба клиента', createdAt: now - 129600000 },
    { id: mkId('ord', 6), franchiseId: 'fr-aktobe', clientId: 'c5', clientName: 'Гүлнар Актобе', clientPhone: '+77014445566', address: 'Актобе, ул. Абая 8', city: 'Актобе', serviceId: `lawn_fr-aktobe`, serviceName: 'Стрижка газона', subserviceId: `sub_100_fr-aktobe`, subserviceName: 'до 100 м²', scheduledAt: '2026-05-17', status: 'completed', partnerId: 'p4', partnerName: 'Aktobe Green', amount: 12000, gpCommission: 800, note: '', createdAt: now - 200000000 },
  ]

  const reviews = [
    { id: 'r1', franchiseId: 'fr-uralsk', clientId: 'c1', clientName: 'Айдар Клиент', orderId: mkId('ord', 4), partnerId: 'p2', partnerName: 'AquaPro', rating: 5, text: 'Всё сделали быстро.', status: 'resolved', createdAt: now - 86400000 },
    { id: 'r2', franchiseId: 'fr-atyrau', clientId: 'c3', clientName: 'ТОО «Береке»', orderId: mkId('ord', 5), partnerId: 'p3', partnerName: 'Atyrau Service', rating: 2, text: 'Жалоба: не полная откачка.', status: 'attention', createdAt: now - 43200000 },
  ]

  const discounts = [
    { id: 'd1', franchiseId: 'fr-uralsk', name: '5-й заказ бесплатно', type: 'FREE_ORDER', value: 0, clientId: null, active: true, startsAt: '2026-01-01', endsAt: '2026-12-31' },
    { id: 'd2', franchiseId: 'fr-uralsk', name: 'GP ID скидка 10%', type: 'PERCENT', value: 10, clientId: null, active: true, startsAt: '2026-01-01', endsAt: '2026-12-31' },
    { id: 'd3', franchiseId: 'fr-atyrau', name: 'Персональная -5000₸', type: 'FIXED', value: 5000, clientId: 'c3', active: true, startsAt: '2026-05-01', endsAt: '2026-08-01' },
  ]

  const payouts = [
    { id: 'pay1', franchiseId: 'fr-uralsk', partnerId: 'p2', partnerName: 'AquaPro', amount: 5000, date: '2026-05-01', status: 'paid' },
    { id: 'pay2', franchiseId: 'fr-uralsk', partnerId: 'p1', partnerName: 'GP Услуги Уральск', amount: 11200, date: '2026-05-10', status: 'pending' },
  ]

  const state = {
    version: STORE_VERSION,
    settings: { ...DEFAULT_SETTINGS },
    franchises,
    services,
    clients,
    partners,
    orders,
    reviews,
    discounts,
    payouts,
  }

  return recalcAggregates(state)
}

export function recalcAggregates(state) {
  const next = { ...state }
  next.clients = next.clients.map((c) => {
    const clientOrders = next.orders.filter((o) => o.clientId === c.id)
    return {
      ...c,
      orderIds: clientOrders.map((o) => o.id),
      totalSpent: clientOrders.filter((o) => o.status === 'completed').reduce((s, o) => s + o.amount, 0),
    }
  })
  next.partners = next.partners.map((p) => {
    const done = next.orders.filter((o) => o.partnerId === p.id && o.status === 'completed')
    return {
      ...p,
      completedOrders: done.length,
      gpCommissionPaid: done.reduce((s, o) => s + o.gpCommission, 0),
      earnings: done.reduce((s, o) => s + Math.max(0, o.amount - o.gpCommission), 0),
    }
  })
  return next
}
