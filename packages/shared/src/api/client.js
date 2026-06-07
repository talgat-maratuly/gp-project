import { get, post, patch, del, request, uploadForm, API_URL, getApiRootUrl } from './apiClient.js'
import {
  getToken,
  setToken,
  clearToken,
  setRefreshToken,
  getRefreshToken,
  clearRefreshToken,
  getDeviceId,
} from './token.js'
import { persistAuthSession, clearAuthSession, getWebDeviceMeta } from './authSession.js'
import { mapOrder, mapProduct, mapPartnerUser, mapMarketOrder } from './mappers.js'

function withDeviceSession(body = {}) {
  const deviceId = getDeviceId()
  const { deviceName, platform } = getWebDeviceMeta()
  return { ...body, deviceId, deviceName, platform }
}

const mapOrdersForApp = (list) => {
  const forClient = import.meta.env?.VITE_APP_NAME === 'service'
  return list.map((o) => mapOrder(o, { forClient }))
}

export { API_URL, getApiRootUrl as apiUrl }

export const api = {
  sendOtp: (phone, channel = 'sms') =>
    post('/auth/mobile/otp/send', { phone, channel }, { auth: false }),

  verifyOtp: (body) =>
    post('/auth/mobile/otp/verify', body, { auth: false }).then((r) => {
      persistAuthSession(r, { deviceId: body?.deviceId || getDeviceId() })
      return r
    }),

  refreshSession: () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return Promise.reject(new Error('NO_REFRESH_SESSION'))
    return post(
      '/auth/mobile/refresh',
      { refreshToken, deviceId: getDeviceId(), sessionRole: 'CLIENT' },
      { auth: false },
    ).then((r) => {
      persistAuthSession(r, { deviceId: getDeviceId() })
      return r
    })
  },

  registerClient: (body) =>
    post('/auth/register/client', withDeviceSession(body), { auth: false }).then((r) => {
      persistAuthSession(r, { deviceId: getDeviceId() })
      return r
    }),

  registerPartner: (body) =>
    post('/auth/register/partner', withDeviceSession(body), { auth: false }).then((r) => {
      persistAuthSession(r, { deviceId: getDeviceId() })
      return r
    }),

  login: (email, password) => {
    const deviceId = getDeviceId()
    clearRefreshToken()
    return post('/auth/login', withDeviceSession({ email, password }), { auth: false }).then((r) => {
      persistAuthSession(r, { deviceId })
      return r
    })
  },

  forgotPassword: (body) => post('/auth/forgot-password', body, { auth: false }),

  verifyResetOtp: (body) => post('/auth/verify-reset-otp', body, { auth: false }),

  resetPassword: (body) => post('/auth/reset-password', body, { auth: false }),

  logout: () => clearAuthSession(),

  me: () => get('/auth/me'),

  bindLegalEcp: (body) => post('/auth/legal/ecp/bind', body),

  checkLegalCompany: (body) => post('/auth/legal/company/check', body, { auth: false }),

  getProducts: async (params = {}) => {
    const q = new URLSearchParams(params).toString()
    const list = await get(`/products${q ? `?${q}` : ''}`, { auth: false })
    if (!Array.isArray(list)) throw new Error('Ожидался массив товаров от API')
    return list.map(mapProduct)
  },

  getServiceAvailability: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return get(`/availability/services${q ? `?${q}` : ''}`, { auth: false })
  },

  adminAvailabilitySummary: () => get('/availability/admin/summary'),

  createProduct: (body) => post('/products', body).then(mapProduct),

  getOrders: async (params = {}) => {
    const q = new URLSearchParams(params).toString()
    const list = await get(`/orders${q ? `?${q}` : ''}`)
    if (!Array.isArray(list)) return []
    return mapOrdersForApp(list)
  },

  getPartnerOrders: async (params = {}) => {
    const q = new URLSearchParams(params).toString()
    const list = await get(`/partner/orders${q ? `?${q}` : ''}`)
    if (!Array.isArray(list)) return []
    return list.map((o) => mapOrder(o, { forClient: false }))
  },

  getPartnerNewOrders: async () => {
    const list = await get('/partner/orders/new')
    if (!Array.isArray(list)) return []
    return list.map((o) => mapOrder(o, { forClient: false }))
  },

  // Лента доступных заказов из пула (matching на бэкенде)
  getSpecialistFeed: async () => {
    const list = await get('/specialist/orders/feed')
    if (!Array.isArray(list)) return []
    return list.map((o) => mapOrder(o, { forClient: false }))
  },

  // Приём заказа из пула (race-protection на бэкенде)
  acceptOrderFromPool: (id) =>
    patch(`/orders/${id}/accept`, {}).then((o) => mapOrder(o, { forClient: false })),

  acceptPartnerOrder: (id) =>
    patch(`/partner/orders/${id}/accept`, {}).then((o) => mapOrder(o, { forClient: false })),

  rejectPartnerOrder: (id, cancelReason) =>
    patch(`/partner/orders/${id}/reject`, { cancelReason }).then((o) => mapOrder(o, { forClient: false })),

  updatePartnerOrderStatus: (id, body) =>
    patch(`/partner/orders/${id}/status`, body).then((o) => mapOrder(o, { forClient: false })),

  getOrder: (id) =>
    get(`/orders/${id}`).then((o) =>
      mapOrder(o, { forClient: import.meta.env?.VITE_APP_NAME === 'service' }),
    ),

  createOrder: (body) =>
    post('/orders', body).then((o) => mapOrder(o, { forClient: true })),

  createMarketOrder: (body) =>
    post('/market/orders', body).then(mapMarketOrder),

  getMarketOrders: async () => {
    const list = await get('/market/orders')
    if (!Array.isArray(list)) return []
    return list.map(mapMarketOrder)
  },

  getNurseryProducts: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return get(`/nursery/products${q ? `?${q}` : ''}`, { auth: false })
  },

  createNurseryRequest: (body) => post('/nursery/requests', body),

  getMyNurseryRequests: () => get('/nursery/requests/mine'),

  acceptNurseryOffer: (id) => patch(`/nursery/offers/${id}/accept`, {}),

  createGrowingPreorder: (body) => post('/nursery/preorders', body),

  getMyGrowingPreorders: () => get('/nursery/preorders/mine'),

  acceptGrowingPreorderOffer: (id) => patch(`/nursery/preorder-offers/${id}/accept`, {}),

  partnerNurseryApply: (body) => post('/partner/nursery/apply', body),

  partnerNurseryMe: () => get('/partner/nursery/me'),

  partnerNurseryProducts: () => get('/partner/nursery/products'),

  partnerNurseryCreateProduct: (body) => post('/partner/nursery/products', body),

  partnerNurseryRequestFeed: () => get('/partner/nursery/requests/feed'),

  partnerNurseryCreateOffer: (requestId, body) => post(`/partner/nursery/requests/${requestId}/offers`, body),

  partnerGrowingPreorderFeed: () => get('/partner/nursery/preorders/feed'),

  partnerGrowingPreorderOffer: (preorderId, body) => post(`/partner/nursery/preorders/${preorderId}/offers`, body),

  getDeliveryRoutes: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return get(`/delivery/routes${q ? `?${q}` : ''}`, { auth: false })
  },

  createDeliveryOrder: (body) => post('/delivery/orders', body),

  getMyDeliveryOrders: () => get('/delivery/orders/mine'),

  acceptDeliveryOffer: (id) => patch(`/delivery/offers/${id}/accept`, {}),

  partnerDeliveryApply: (body) => post('/partner/delivery/apply', body),

  partnerDeliveryMe: () => get('/partner/delivery/me'),

  partnerDeliveryCreateRoute: (body) => post('/partner/delivery/routes', body),

  partnerDeliveryOrderFeed: () => get('/partner/delivery/orders/feed'),

  partnerDeliveryCreateOffer: (orderId, body) => post(`/partner/delivery/orders/${orderId}/offers`, body),

  adminNurseryPartners: (status) => get(`/admin/nursery/partners${status ? `?status=${encodeURIComponent(status)}` : ''}`),

  adminApproveNursery: (id) => patch(`/admin/nursery/partners/${id}/approve`, {}),

  adminRejectNursery: (id) => patch(`/admin/nursery/partners/${id}/reject`, {}),

  adminNurseryRequests: () => get('/admin/nursery/requests'),

  adminGrowingPreorders: () => get('/admin/nursery/preorders'),

  adminDeliveryPartners: (status) => get(`/admin/delivery/partners${status ? `?status=${encodeURIComponent(status)}` : ''}`),

  adminApproveDeliveryPartner: (id) => patch(`/admin/delivery/partners/${id}/approve`, {}),

  adminRejectDeliveryPartner: (id) => patch(`/admin/delivery/partners/${id}/reject`, {}),

  adminDeliveryOrders: () => get('/admin/delivery/orders'),

  updateOrderStatus: (id, body) =>
    patch(`/orders/${id}/status`, body).then((o) => mapOrder(o, { forClient: false })),

  confirmOrder: (id) => patch(`/orders/${id}/confirm`).then((o) => mapOrder(o, { forClient: true })),

  cancelOrder: (id, cancelReason) =>
    patch(`/orders/${id}/cancel`, { cancelReason }).then((o) => mapOrder(o, { forClient: true })),

  recreateOrder: (id) =>
    post(`/orders/${id}/recreate`, {}).then((o) => mapOrder(o, { forClient: true })),

  getOrderEvents: (id) => get(`/orders/${id}/events`),

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

  /** Shop partners only — specialists use submitSpecialistApplication */
  partnerApply: (body) => post('/partner/apply', body),

  partnerResubmit: (body) => patch('/partner/me/resubmit', body),

  getSpecialistOnboardingCatalog: () =>
    get('/specialist/onboarding/catalog', { auth: false }),

  getSpecialistOnboardingSubservices: (cityId, mainServiceId) =>
    get(
      `/specialist/onboarding/subservices?cityId=${encodeURIComponent(cityId)}&mainServiceId=${encodeURIComponent(mainServiceId)}`,
      { auth: false },
    ),

  getSpecialistOnboardingMainServices: (cityId) =>
    get(`/specialist/onboarding/main-services?cityId=${encodeURIComponent(cityId)}`, { auth: false }),

  getSpecialistApplications: () => get('/specialist/applications'),

  getSpecialistApplication: (id) => get(`/specialist/applications/${id}`),

  submitSpecialistApplication: (body) => post('/specialist/applications', body),

  uploadSpecialistPhoto: (file, kind) => {
    const fd = new FormData()
    fd.append('file', file)
    return uploadForm(`/uploads/specialist-photo?kind=${encodeURIComponent(kind)}`, fd)
  },

  createPlantCase: (file, body = {}) => {
    const fd = new FormData()
    fd.append('file', file)
    if (body.city) fd.append('city', body.city)
    if (body.description) fd.append('description', body.description)
    return uploadForm('/plant-doctor/cases', fd)
  },

  getMyPlantCases: () => get('/plant-doctor/cases/mine'),

  getPartnerPlantCases: () => get('/plant-doctor/partner/cases'),

  acceptPartnerPlantCase: (id) => patch(`/plant-doctor/partner/cases/${id}/accept`, {}),

  confirmPartnerPlantCase: (id, body) => patch(`/plant-doctor/partner/cases/${id}/confirm`, body),

  adminPlantCases: () => get('/plant-doctor/admin/cases'),

  adminApprovePlantCase: (id, addToKnowledgeBase = false) =>
    patch(`/plant-doctor/admin/cases/${id}/approve`, { addToKnowledgeBase }),

  moderatorListSpecialistRequests: (opts = {}) => {
    const params = new URLSearchParams()
    if (opts.status) params.set('status', opts.status)
    if (opts.page) params.set('page', String(opts.page))
    if (opts.limit) params.set('limit', String(opts.limit))
    if (opts.city) params.set('city', opts.city)
    if (opts.specialistName) params.set('specialistName', opts.specialistName)
    if (opts.phoneNumber) params.set('phoneNumber', opts.phoneNumber)
    const q = params.toString() ? `?${params.toString()}` : ''
    return get(`/moderator/specialist-requests${q}`)
  },

  moderatorGetSpecialistRequest: (id) => get(`/moderator/specialist-requests/${id}`),

  moderatorApproveSpecialistRequest: (id) =>
    patch(`/moderator/specialist-requests/${id}/approve`, {}),

  moderatorRejectSpecialistRequest: (id, body) =>
    patch(`/moderator/specialist-requests/${id}/reject`, body),

  getRegions: () => get('/regions', { auth: false }),

  adminModerationPartners: (status, opts = {}) => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (opts.scope) params.set('scope', opts.scope)
    if (opts.partnerRole) params.set('partnerRole', opts.partnerRole)
    if (opts.regionId) params.set('regionId', opts.regionId)
    if (opts.city) params.set('city', opts.city)
    if (opts.q) params.set('q', opts.q)
    const q = params.toString() ? `?${params.toString()}` : ''
    return get(`/admin/moderation/partners${q}`)
  },

  adminModerationPending: () => get('/admin/moderation/pending'),

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

  adminLegalClients: (status) => {
    const q = status ? `?status=${encodeURIComponent(status)}` : ''
    return get(`/admin/clients/legal${q}`)
  },

  adminUpdateLegalClient: (clientProfileId, body) =>
    patch(`/admin/clients/legal/${clientProfileId}`, body),

  adminPartners: () => get('/admin/partners'),

  adminOrders: () => get('/admin/orders'),

  adminAssignOrder: (orderId, assignedPartnerId) =>
    patch(`/admin/orders/${orderId}/assign`, { assignedPartnerId }),

  adminUpdateOrderStatus: (orderId, body) =>
    patch(`/admin/orders/${orderId}/status`, body),

  adminMarketProducts: (opts = {}) => {
    const params = new URLSearchParams()
    if (opts.regionId) params.set('regionId', opts.regionId)
    if (opts.storeId) params.set('storeId', opts.storeId)
    if (opts.q) params.set('q', opts.q)
    if (opts.isActive !== undefined) params.set('isActive', String(opts.isActive))
    const q = params.toString() ? `?${params.toString()}` : ''
    return get(`/admin/market/products${q}`)
  },

  adminMarketOrders: (opts = {}) => {
    const params = new URLSearchParams()
    if (opts.regionId) params.set('regionId', opts.regionId)
    if (opts.storeId) params.set('storeId', opts.storeId)
    const q = params.toString() ? `?${params.toString()}` : ''
    return get(`/admin/market/orders${q}`).then((list) => (Array.isArray(list) ? list.map(mapMarketOrder) : []))
  },

  adminMarketStores: (opts = {}) => {
    const params = new URLSearchParams()
    if (opts.regionId) params.set('regionId', opts.regionId)
    const q = params.toString() ? `?${params.toString()}` : ''
    return get(`/admin/market/stores${q}`)
  },

  adminCreateMarketProduct: (body) => post('/admin/market/products', body),

  adminModerateMarketProduct: (productId, body) =>
    patch(`/admin/market/products/${productId}`, body),

  listPartnerStores: () => get('/partner/stores'),

  createPartnerStore: (body) => post('/partner/stores', body),

  getPartnerMarketOrders: () =>
    get('/partner/market/orders').then((list) => (Array.isArray(list) ? list.map(mapMarketOrder) : [])),

  getPartnerMarketProducts: () =>
    get('/partner/products').then((list) => (Array.isArray(list) ? list.map(mapProduct) : [])),

  createPartnerMarketProduct: (body) =>
    post('/partner/products', body).then(mapProduct),

  updatePartnerMarketProduct: (id, body) =>
    patch(`/partner/products/${id}`, body).then(mapProduct),

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

  getServiceCatalog: (franchiseId, cityId) => {
    const opts = franchiseId && typeof franchiseId === 'object'
      ? franchiseId
      : { franchiseId, cityId }
    const params = new URLSearchParams()
    if (opts.franchiseId) params.set('franchiseId', opts.franchiseId)
    if (opts.cityId) params.set('cityId', opts.cityId)
    const q = params.toString()
    return get(`/services/catalog${q ? `?${q}` : ''}`, { auth: false })
  },

  listServiceFranchises: () => get('/services/franchises', { auth: false }),

  adminFranchises: () => get('/admin/services/franchises'),

  adminServices: (franchiseId) => {
    const q = franchiseId ? `?franchiseId=${encodeURIComponent(franchiseId)}` : ''
    return get(`/admin/services${q}`)
  },

  adminCreateService: (body) => post('/admin/services', body),

  adminUpdateService: (serviceId, body) => patch(`/admin/services/${serviceId}`, body),

  adminRemoveService: (serviceId) => del(`/admin/services/${serviceId}`),

  adminAddSubservice: (serviceId, body) => post(`/admin/services/${serviceId}/subservices`, body),

  adminUpdateSubservice: (serviceId, subId, body) =>
    patch(`/admin/services/${serviceId}/subservices/${subId}`, body),

  adminRemoveSubservice: (serviceId, subId) =>
    del(`/admin/services/${serviceId}/subservices/${subId}`),

  adminServiceTypes: (code) => {
    const q = code ? `?code=${encodeURIComponent(code)}` : ''
    return get(`/admin/service-types${q}`)
  },

  adminCreateServiceType: (body) => post('/admin/service-types', body),

  adminUpdateServiceType: (id, body) => patch(`/admin/service-types/${id}`, body),

  adminRemoveServiceType: (id) => del(`/admin/service-types/${id}`),

  adminAddSubserviceType: (serviceTypeId, body) =>
    post(`/admin/service-types/${serviceTypeId}/subservices`, body),

  adminUpdateSubserviceType: (serviceTypeId, subId, body) =>
    patch(`/admin/service-types/${serviceTypeId}/subservices/${subId}`, body),

  adminRemoveSubserviceType: (serviceTypeId, subId) =>
    del(`/admin/service-types/${serviceTypeId}/subservices/${subId}`),

  adminSubservices: (serviceCode) => {
    const q = serviceCode ? `?serviceCode=${encodeURIComponent(serviceCode)}` : ''
    return get(`/admin/subservices${q}`)
  },

  adminGetSubservice: (id) => get(`/admin/subservices/${id}`),

  adminCreateSubservice: (body) => post('/admin/subservices', body),

  adminUpdateStandaloneSubservice: (id, body) => patch(`/admin/subservices/${id}`, body),

  adminRemoveStandaloneSubservice: (id) => del(`/admin/subservices/${id}`),

  adminCityPrices: (opts = {}) => {
    const params = new URLSearchParams()
    if (opts.serviceCode) params.set('serviceCode', opts.serviceCode)
    if (opts.cityId) params.set('cityId', opts.cityId)
    if (opts.franchiseId) params.set('franchiseId', opts.franchiseId)
    if (opts.oblastId) params.set('oblastId', opts.oblastId)
    const q = params.toString() ? `?${params.toString()}` : ''
    return get(`/admin/city-prices${q}`)
  },

  adminCreateCityPrice: (body) => post('/admin/city-prices', body),

  adminUpdateCityPrice: (id, body) => patch(`/admin/city-prices/${id}`, body),

  adminRemoveCityPrice: (id) => del(`/admin/city-prices/${id}`),

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

export { getToken, setToken, clearToken, setRefreshToken, clearRefreshToken, mapOrder, mapProduct, mapMarketOrder, mapPartnerUser, request, get, post, patch, del }
