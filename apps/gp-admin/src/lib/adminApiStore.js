import { api } from '@gp/shared/api'
import { CATEGORY_TO_UI } from '@gp/shared/api/mappers'
import { loadGlobalStore } from '@gp/shared/demo'

const DEFAULT_FRANCHISE = {
  id: 'gp_network',
  name: 'GP Network',
  city: 'Казахстан',
  createdAt: new Date().toISOString().slice(0, 10),
}

const REGION_TO_FRANCHISE = {
  uralsk: 'fr-uralsk',
  aktobe: 'fr-aktobe',
  atyrau: 'fr-atyrau',
  almaty: 'fr-almaty',
  astana: 'fr-astana',
}

function franchiseIdForRegion(region) {
  return REGION_TO_FRANCHISE[region?.code] || DEFAULT_FRANCHISE.id
}

const ADMIN_ORDER_STATUS = {
  NEW: 'new',
  ACCEPTED: 'accepted',
  ON_WAY: 'on_way',
  IN_PROCESS: 'in_process',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  CANCELED_BY_CLIENT: 'canceled_by_client',
  CANCELED_BY_SPEC: 'canceled_by_spec',
  NO_SHOW: 'no_show',
}

function mapClient(u) {
  const profile = u.clientProfile || {}
  return {
    id: profile.id || u.id,
    userId: u.id,
    name: u.name || u.email,
    email: u.email,
    phone: u.phone || '',
    city: profile.city || 'Уральск',
    franchiseId: DEFAULT_FRANCHISE.id,
    orderIds: [],
    totalSpent: 0,
    gpIdBonus: 0,
    freeFifthOrder: false,
    discountPercent: 0,
    createdAt: u.createdAt,
  }
}

function mapPartner(p) {
  const u = p.user || {}
  const approved = p.status === 'APPROVED'
  return {
    id: p.id,
    name: u.name || p.company,
    company: p.company || u.name,
    email: u.email,
    phone: u.phone || '',
    city: 'Уральск',
    franchiseId: DEFAULT_FRANCHISE.id,
    directions: (p.directions || []).map((d) => CATEGORY_TO_UI[d] || String(d).toLowerCase()),
    serviceIds: [],
    active: approved,
    blocked: p.status === 'SUSPENDED' || p.status === 'REJECTED',
    partnerStatus: p.status,
    partnerRole: p.partnerRole,
    isOnline: !!p.isOnline,
    rating: 5,
    completedCount: 0,
    earnings: Number(p.balance) || 0,
    balance: Number(p.balance) || 0,
    serviceOfferings: p.serviceOfferings || [],
  }
}

function mapOrder(o) {
  const clientUser = o.client?.user
  const partnerUser = o.partner?.user
  return {
    id: o.id,
    clientId: o.clientId,
    clientName: clientUser?.name || 'Клиент',
    clientPhone: clientUser?.phone || '',
    assignedPartnerId: o.assignedPartnerId ?? o.partnerId,
    partnerId: o.assignedPartnerId ?? o.partnerId,
    partnerName: o.partner?.company || partnerUser?.name || null,
    franchiseId: DEFAULT_FRANCHISE.id,
    city: o.city || clientUser?.city || 'Уральск',
    address: o.address || '',
    serviceId: o.serviceId || null,
    serviceName: o.serviceName || '',
    subserviceId: o.subserviceId || null,
    subserviceName: null,
    status: ADMIN_ORDER_STATUS[o.status] || String(o.status).toLowerCase(),
    isAssigned: Boolean(o.assignedPartnerId ?? o.partnerId),
    prismaStatus: o.status,
    amount: Number(o.total),
    gpCommission: Number(o.gpCommission) || 0,
    category: CATEGORY_TO_UI[o.category] || String(o.category || '').toLowerCase(),
    scheduledAt: o.preferredDate || o.createdAt,
    note: o.comment || '',
    eventLogs: o.eventLogs || [],
    createdAt: o.createdAt,
  }
}

function mapQrObject(obj) {
  return {
    id: obj.id,
    qrCode: obj.qrCode,
    title: obj.title,
    type: obj.type,
    serviceType: obj.serviceType,
    status: obj.status,
    address: obj.address,
    city: obj.city,
    franchiseId: obj.franchiseId || DEFAULT_FRANCHISE.id,
    partnerId: obj.partnerId,
    productId: obj.productId,
    phone: obj.phone,
    lastServiceDate: obj.lastServiceDate,
    nextServiceDate: obj.nextServiceDate,
    ordersCount: obj._count?.orders ?? 0,
    scansCount: obj._count?.scanLogs ?? 0,
  }
}

function mapQrOrder(o) {
  return {
    id: o.id,
    qrCodeObjectId: o.qrCodeObjectId,
    qrCode: o.qrCode,
    serviceType: o.serviceType,
    clientName: o.clientName,
    phone: o.phone,
    address: o.address,
    status: o.status,
    totalPrice: Number(o.totalPrice),
    gpCommission: Number(o.gpCommission),
    franchiseId: o.franchiseId || DEFAULT_FRANCHISE.id,
    assignedPartnerId: o.assignedPartnerId,
    createdAt: o.createdAt,
  }
}

function mapMarketStore(s) {
  const franchiseId = franchiseIdForRegion(s.region)
  return {
    ...s,
    id: s.id,
    shopName: s.name,
    ownerName: s.owner?.name || s.owner?.email || '',
    phone: s.phone || s.owner?.phone || '',
    city: s.region?.name || '',
    franchiseId,
    status: s.status === 'APPROVED' ? 'ACTIVE' : s.status,
    productsCount: s._count?.products ?? 0,
    ordersCount: s._count?.orders ?? 0,
  }
}

function mapMarketProduct(p) {
  const qty = Number(p.stock?.quantity ?? p.quantity ?? 0)
  const reserved = Number(p.stock?.reservedQuantity ?? 0)
  return {
    ...p,
    id: p.id,
    shopId: p.storeId,
    shopName: p.store?.name || '',
    city: p.store?.region?.name || p.region?.name || '',
    franchiseId: franchiseIdForRegion(p.store?.region || p.region),
    categoryId: p.categoryId,
    price: Number(p.price),
    quantity: Math.max(0, qty - reserved),
    status: p.isActive ? 'ACTIVE' : 'INACTIVE',
  }
}

function mapMarketOrder(o) {
  const total = Number(o.totalAmount ?? o.total ?? 0)
  return {
    ...o,
    id: o.id,
    orderNumber: o.id.slice(0, 8),
    shopId: o.storeId,
    shopName: o.store?.name || '',
    clientName: o.customer?.name || o.customer?.email || 'Клиент',
    city: o.region?.name || '',
    franchiseId: franchiseIdForRegion(o.region),
    finalAmount: total,
    total,
    paymentStatus: 'DIRECT_TO_PARTNER',
  }
}

export async function fetchAdminStore() {
  const seed = loadGlobalStore()
  const [clients, partners, orders, qrStats, qrObjects, qrOrders, services, franchises, marketProducts, marketOrders, marketStores] = await Promise.all([
    api.adminClients(),
    api.adminPartners(),
    api.adminOrders(),
    api.adminQrStats(),
    api.adminQrObjects(),
    api.adminQrOrders(),
    api.adminServices().catch(() => []),
    api.adminFranchises().catch(() => []),
    api.adminMarketProducts().catch(() => []),
    api.adminMarketOrders().catch(() => []),
    api.adminMarketStores().catch(() => []),
  ])

  const objectsActive = (qrObjects || []).filter((o) => o.status === 'active').length

  return {
    ...seed,
    franchises: franchises?.length ? franchises : seed.franchises,
    services: Array.isArray(services) ? services : seed.services,
    clients: clients.map(mapClient),
    partners: partners.map(mapPartner),
    orders: orders.map(mapOrder),
    qrCodeObjects: (qrObjects || []).map(mapQrObject),
    qrServiceOrders: (qrOrders || []).map(mapQrOrder),
    qrScanLogs: [],
    qrStats: {
      ...qrStats,
      objectsActive,
    },
    marketProducts: (marketProducts || []).map(mapMarketProduct),
    marketOrders: (marketOrders || []).map(mapMarketOrder),
    shops: (marketStores || []).map(mapMarketStore),
    deliveryCompanies: seed.deliveryCompanies || [],
  }
}
