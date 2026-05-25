import { api } from '@gp/shared/api'
import { CATEGORY_TO_UI } from '@gp/shared/api/mappers'
import { ADMIN_ORDER_UI_TO_PRISMA } from '@gp/shared/constants'
import { loadGlobalStore } from '@gp/shared/demo'

const DEFAULT_FRANCHISE = {
  id: 'gp_network',
  name: 'GP Network',
  city: 'Казахстан',
  createdAt: new Date().toISOString().slice(0, 10),
}

const ADMIN_ORDER_STATUS = {
  NEW: 'new',
  ACCEPTED: 'assigned',
  ON_THE_WAY: 'in_progress',
  ARRIVED: 'in_progress',
  STARTED: 'in_work',
  LOADED: 'in_work',
  DISPOSAL_ARRIVED: 'in_work',
  DISPOSAL_COMPLETED: 'in_work',
  COMPLETED: 'completed',
  CLIENT_CONFIRMED: 'completed',
  CANCELLED: 'cancelled',
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
    partnerId: o.partnerId,
    partnerName: o.partner?.company || partnerUser?.name || null,
    franchiseId: DEFAULT_FRANCHISE.id,
    city: o.city || clientUser?.city || 'Уральск',
    address: o.address || '',
    serviceId: o.serviceId || null,
    serviceName: o.serviceName || '',
    subserviceId: o.subserviceId || null,
    subserviceName: null,
    status:
      o.partnerId && o.status === 'NEW'
        ? 'assigned'
        : ADMIN_ORDER_STATUS[o.status] || String(o.status).toLowerCase(),
    prismaStatus: o.status,
    amount: Number(o.total),
    gpCommission: Number(o.gpCommission) || 0,
    category: CATEGORY_TO_UI[o.category] || String(o.category || '').toLowerCase(),
    scheduledAt: o.preferredDate || o.createdAt,
    note: o.comment || '',
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

export async function fetchAdminStore() {
  const seed = loadGlobalStore()
  const [clients, partners, orders, qrStats, qrObjects, qrOrders] = await Promise.all([
    api.adminClients(),
    api.adminPartners(),
    api.adminOrders(),
    api.adminQrStats(),
    api.adminQrObjects(),
    api.adminQrOrders(),
  ])

  const objectsActive = (qrObjects || []).filter((o) => o.status === 'active').length

  return {
    ...seed,
    franchises: [DEFAULT_FRANCHISE],
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
    marketProducts: seed.marketProducts || [],
    marketOrders: seed.marketOrders || [],
    shops: seed.shops || [],
    deliveryCompanies: seed.deliveryCompanies || [],
  }
}
