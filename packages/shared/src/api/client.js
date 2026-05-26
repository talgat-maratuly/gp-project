import { get, post, patch, del, request, API_URL, getApiRootUrl } from './apiClient.js'
import { setToken, clearToken, setRefreshToken, clearRefreshToken, getToken } from './token.js'
import { mapOrder, mapProduct, mapPartnerUser } from './mappers.js'

const mapOrdersForApp = (list) => {
  const forClient = import.meta.env?.VITE_APP_NAME === 'service'
  return list.map((o) => mapOrder(o, { forClient }))
}

export { API_URL, getApiRootUrl as apiUrl }

export const api = {
  registerClient: (body) =>
    post('/auth/register/client', body, { auth: false }).then((r) => {
      setToken(r.accessToken)
      return r
    }),

  registerPartner: (body) =>
    post('/auth/register/partner', body, { auth: false }).then((r) => {
      setToken(r.accessToken)
      return r
    }),

  login: (email, password) =>
    post('/auth/login', { email, password }, { auth: false }).then((r) => {
      setToken(r.accessToken)
      return r
    }),

  logout: () => {
    clearToken()
    clearRefreshToken()
  },

  me: () => get('/auth/me'),

  getProducts: async (params = {}) => {
    const q = new URLSearchParams(params).toString()
    const list = await get(`/products${q ? `?${q}` : ''}`, { auth: false })
    if (!Array.isArray(list)) throw new Error('Ожидался массив товаров от API')
    return list.map(mapProduct)
  },

  createProduct: (body) => post('/products', body).then(mapProduct),

  getOrders: async (params = {}) => {
    const q = new URLSearchParams(params).toString()
    const list = await get(`/orders${q ? `?${q}` : ''}`)
    if (!Array.isArray(list)) return []
    return mapOrdersForApp(list)
  },

  getOrder: (id) =>
    get(`/orders/${id}`).then((o) =>
      mapOrder(o, { forClient: import.meta.env?.VITE_APP_NAME === 'service' }),
    ),

  createOrder: (body) =>
    post('/orders', body).then((o) => mapOrder(o, { forClient: true })),

  updateOrderStatus: (id, body) =>
    patch(`/orders/${id}/status`, body).then((o) => mapOrder(o, { forClient: false })),

  confirmOrder: (id) => patch(`/orders/${id}/confirm`).then((o) => mapOrder(o, { forClient: true })),

  getPartnerMe: () =>
    get('/partners/me').then((p) => ({
      ...p,
      balance: Number(p.balance),
      directions: p.directions || [],
      serviceOfferings: p.serviceOfferings || [],
      serviceAccess: p.serviceAccess || [],
      accountType: p.accountType,
      bin: p.bin,
      legalAddress: p.legalAddress,
      idDocumentNumber: p.idDocumentNumber,
      documents: p.documents,
      status: p.status,
      partnerType: p.partnerType,
      rejectionReason: p.rejectionReason,
      revisionComment: p.revisionComment,
    })),

  getPartnerApplication: () => get('/partner/me'),

  partnerApply: (body) => post('/partner/apply', body),

  partnerResubmit: (body) => patch('/partner/me/resubmit', body),

  getRegions: () => get('/regions', { auth: false }),

  adminModerationPartners: (status, opts = {}) => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (opts.scope) params.set('scope', opts.scope)
    if (opts.partnerRole) params.set('partnerRole', opts.partnerRole)
    const q = params.toString() ? `?${params.toString()}` : ''
    return get(`/admin/moderation/partners${q}`)
  },

  adminModerationPartner: (id) => get(`/admin/moderation/partners/${id}`),

  adminApprovePartner: (id) => patch(`/admin/moderation/partners/${id}/approve`, {}),

  adminRejectPartner: (id, reason) =>
    patch(`/admin/moderation/partners/${id}/reject`, { reason }),

  adminRevisionPartner: (id, comment) =>
    patch(`/admin/moderation/partners/${id}/revision`, { comment }),

  adminSuspendPartner: (id, reason) =>
    patch(`/admin/moderation/partners/${id}/suspend`, reason ? { reason } : {}),

  adminRestorePartner: (id) => patch(`/admin/moderation/partners/${id}/restore`, {}),

  adminApproveStore: (id) => patch(`/admin/moderation/stores/${id}/approve`, {}),

  patchPartnerMe: (body) => patch('/partners/me', body),

  addPartnerOfferings: (subserviceIds) =>
    post('/partners/me/offerings', { subserviceIds }).then((p) => ({
      ...p,
      balance: Number(p.balance),
      directions: p.directions || [],
      serviceOfferings: p.serviceOfferings || [],
      serviceAccess: p.serviceAccess || [],
    })),

  getFurnitureExecutorOrders: (serviceType) => {
    const q = serviceType ? `?serviceType=${encodeURIComponent(serviceType)}` : ''
    return get(`/furniture-executor/partner/orders${q}`)
  },

  acceptFurnitureExecutorOrder: (orderId) =>
    post(`/furniture-executor/partner/orders/${orderId}/accept`),

  updateFurnitureExecutorOrderStatus: (orderId, status) =>
    patch(`/furniture-executor/partner/orders/${orderId}/status`, { status }),

  declineFurnitureExecutorOrder: (orderId) =>
    post(`/furniture-executor/partner/orders/${orderId}/decline`),

  getBalance: () => get('/partners/balance').then((r) => ({ balance: Number(r.balance) })),

  getTransactions: () =>
    get('/partners/balance/transactions').then((list) =>
      list.map((t) => ({ ...t, amount: Number(t.amount) })),
    ),

  topupBalance: (amount, note) => post('/partners/balance/topup', { amount, note }),

  getOrderTracking: (orderId) => get(`/geo/orders/${orderId}/tracking`),

  getGeofences: () => get('/geo/geofences'),

  postGps: (body) => post('/geo/gps', body),

  getOrderGpsHistory: (orderId) => get(`/geo/orders/${orderId}/history`),

  getAdminFleet: () => get('/geo/admin/fleet'),

  updateGeoLocation: (body) => patch('/geo/location', body),

  mockMove: (orderId) => post(`/geo/orders/${orderId}/mock-move`),

  getNotifications: () => get('/notifications'),

  getPaymentArchitecture: () => get('/payments/architecture'),

  adminDashboard: () =>
    get('/admin/dashboard').then((d) => ({
      ...d,
      totalCommission: Number(d.totalCommission ?? 0),
    })),

  adminClients: () => get('/admin/clients'),

  adminPartners: () => get('/admin/partners'),

  adminOrders: () => get('/admin/orders'),

  adminAssignOrder: (orderId, assignedPartnerId) =>
    patch(`/admin/orders/${orderId}/assign`, { assignedPartnerId }),

  adminUpdateOrderStatus: (orderId, body) =>
    patch(`/admin/orders/${orderId}/status`, body),

  adminMarketProducts: () => get('/admin/market/products'),

  adminModerateMarketProduct: (productId, body) =>
    patch(`/admin/market/products/${productId}`, body),

  adminOfferings: (status, opts = {}) => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (opts.scope) params.set('scope', opts.scope)
    const q = params.toString() ? `?${params.toString()}` : ''
    return get(`/admin/offerings${q}`)
  },

  adminCommissions: () =>
    get('/admin/commissions').then((list) =>
      list.map((t) => ({ ...t, amount: Number(t.amount) })),
    ),

  adminUpdateOfferingStatus: (offeringId, body) =>
    patch(`/admin/offerings/${offeringId}`, body),

  adminQrStats: () => get('/qr/admin/stats'),

  adminQrObjects: () => get('/qr/admin/objects'),

  adminQrObject: (id) => get(`/qr/admin/objects/${id}`),

  adminCreateQrObject: (body) => post('/qr/admin/objects', body),

  adminUpdateQrObject: (id, body) => patch(`/qr/admin/objects/${id}`, body),

  adminQrOrders: () => get('/qr/admin/orders'),

  getQrPublic: (qrCode) => get(`/qr/public/${encodeURIComponent(qrCode)}`, { auth: false }),

  createQrOrder: (qrCode, body) =>
    post(`/qr/public/${encodeURIComponent(qrCode)}/orders`, body, { auth: false }),

  getQrPartnerOrders: (serviceType) => {
    const q = serviceType ? `?serviceType=${encodeURIComponent(serviceType)}` : ''
    return get(`/qr/partner/orders${q}`)
  },

  patchQrPartnerOrderStatus: (orderId, status) =>
    patch(`/qr/partner/orders/${orderId}/status`, { status }),

  healthFull: async () => {
    const url = `${getApiRootUrl()}/health/full`
    const res = await fetch(url)
    const text = await res.text()
    const data = text ? JSON.parse(text) : null
    if (!res.ok) throw new Error(data?.message || `Health check failed (${res.status})`)
    return data
  },

  getServiceProjects: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return get(`/service-projects${q ? `?${q}` : ''}`)
  },

  getServiceProject: (id) => get(`/service-projects/${id}`),

  patchServiceProjectStatus: (id, status) =>
    patch(`/service-projects/${id}/status`, { status }),

  createHunterProject: (body) => post('/hunter-projects', body),

  getHunterProjects: () => get('/hunter-projects'),

  getHunterProject: (id) => get(`/hunter-projects/${id}`),

  createFurnitureProject: (body) => post('/furniture-projects', body),

  getFurnitureProjects: () => get('/furniture-projects'),

  getFurnitureProject: (id) => get(`/furniture-projects/${id}`),

  getMarketProducts: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return get(`/market/products${q ? `?${q}` : ''}`, { auth: false }).then((list) => list.map(mapProduct))
  },

  health: async () => {
    const url = `${getApiRootUrl()}/health`
    try {
      const res = await fetch(url)
      if (!res.ok) return { status: 'error', message: `HTTP ${res.status}` }
      return res.json()
    } catch (err) {
      return { status: 'error', message: err?.message || 'API недоступен' }
    }
  },
}

export { getToken, setToken, clearToken, setRefreshToken, clearRefreshToken, mapOrder, mapProduct, mapPartnerUser, request, get, post, patch, del }
