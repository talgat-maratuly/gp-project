import { getToken, setToken, clearToken } from './token.js'
import { mapOrder, mapProduct, mapPartnerUser } from './mappers.js'

const mapOrdersForApp = (list) => {
  const forClient = import.meta.env?.VITE_APP_NAME === 'service'
  return list.map((o) => mapOrder(o, { forClient }))
}

/**
 * Базовый URL API.
 * Production (Vercel): задайте VITE_API_URL=https://gp-api.onrender.com
 * Dev: пустая строка → относительные пути + Vite proxy (packages/shared/vite.proxy.js)
 */
export const API_URL = (() => {
  const fromEnv = import.meta.env?.VITE_API_URL
  if (fromEnv) return String(fromEnv).replace(/\/$/, '')
  if (import.meta.env?.DEV) return ''
  if (import.meta.env?.PROD) {
    console.error('[GP] VITE_API_URL не задан. Укажите URL API в настройках Vercel.')
    return ''
  }
  return ''
})()

function parseError(data, status) {
  if (Array.isArray(data?.message)) return data.message.join(', ')
  if (typeof data?.message === 'string') return data.message
  if (status === 401) return 'Войдите в аккаунт'
  if (status === 403) return 'Недостаточно прав для этого действия'
  return data?.error || `Ошибка API (${status})`
}

async function parseJson(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Некорректный ответ API')
  }
}

async function request(path, options = {}, { auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error('Не удалось подключиться к API. Убедитесь, что backend запущен (npm run dev:api).')
  }

  const data = await parseJson(res)
  if (!res.ok) throw new Error(parseError(data, res.status))
  return data
}

export const api = {
  registerClient: (body) =>
    request('/auth/register/client', { method: 'POST', body: JSON.stringify(body) }).then((r) => {
      setToken(r.accessToken)
      return r
    }),

  registerPartner: (body) =>
    request('/auth/register/partner', { method: 'POST', body: JSON.stringify(body) }).then((r) => {
      setToken(r.accessToken)
      return r
    }),

  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }).then((r) => {
      setToken(r.accessToken)
      return r
    }),

  logout: () => {
    clearToken()
  },

  me: () => request('/auth/me'),

  getProducts: async (params = {}) => {
    const q = new URLSearchParams(params).toString()
    const list = await request(`/products${q ? `?${q}` : ''}`, {}, { auth: false })
    if (!Array.isArray(list)) throw new Error('Ожидался массив товаров от API')
    return list.map(mapProduct)
  },

  createProduct: (body) =>
    request('/products', { method: 'POST', body: JSON.stringify(body) }).then(mapProduct),

  getOrders: async (params = {}) => {
    const q = new URLSearchParams(params).toString()
    const list = await request(`/orders${q ? `?${q}` : ''}`)
    if (!Array.isArray(list)) return []
    return mapOrdersForApp(list)
  },

  getOrder: (id) => request(`/orders/${id}`).then((o) => mapOrder(o, { forClient: import.meta.env?.VITE_APP_NAME === 'service' })),

  createOrder: (body) =>
    request('/orders', { method: 'POST', body: JSON.stringify(body) }).then((o) =>
      mapOrder(o, { forClient: true }),
    ),

  updateOrderStatus: (id, body) =>
    request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) }).then((o) =>
      mapOrder(o, { forClient: false }),
    ),

  confirmOrder: (id) =>
    request(`/orders/${id}/confirm`, { method: 'PATCH' }).then((o) => mapOrder(o, { forClient: true })),

  getPartnerMe: () => request('/partners/me').then((p) => ({
    ...p,
    balance: Number(p.balance),
    directions: p.directions || [],
    serviceOfferings: p.serviceOfferings || [],
    accountType: p.accountType,
    bin: p.bin,
    legalAddress: p.legalAddress,
    idDocumentNumber: p.idDocumentNumber,
    documents: p.documents,
  })),

  patchPartnerMe: (body) => request('/partners/me', { method: 'PATCH', body: JSON.stringify(body) }),

  addPartnerOfferings: (subserviceIds) =>
    request('/partners/me/offerings', {
      method: 'POST',
      body: JSON.stringify({ subserviceIds }),
    }).then((p) => ({
      ...p,
      balance: Number(p.balance),
      directions: p.directions || [],
      serviceOfferings: p.serviceOfferings || [],
    })),

  getBalance: () => request('/partners/balance').then((r) => ({ balance: Number(r.balance) })),

  getTransactions: () =>
    request('/partners/balance/transactions').then((list) =>
      list.map((t) => ({ ...t, amount: Number(t.amount) })),
    ),

  topupBalance: (amount, note) =>
    request('/partners/balance/topup', {
      method: 'POST',
      body: JSON.stringify({ amount, note }),
    }),

  getOrderTracking: (orderId) => request(`/geo/orders/${orderId}/tracking`),

  updateGeoLocation: (body) => request('/geo/location', { method: 'PATCH', body: JSON.stringify(body) }),

  mockMove: (orderId) => request(`/geo/orders/${orderId}/mock-move`, { method: 'POST' }),

  getNotifications: () => request('/notifications'),

  getPaymentArchitecture: () => request('/payments/architecture'),

  adminDashboard: () =>
    request('/admin/dashboard').then((d) => ({
      ...d,
      totalCommission: Number(d.totalCommission ?? 0),
    })),

  adminClients: () => request('/admin/clients'),

  adminPartners: () => request('/admin/partners'),

  adminOrders: () => request('/admin/orders'),

  adminCommissions: () =>
    request('/admin/commissions').then((list) =>
      list.map((t) => ({ ...t, amount: Number(t.amount) })),
    ),

  adminUpdateOfferingStatus: (offeringId, body) =>
    request(`/admin/offerings/${offeringId}`, { method: 'PATCH', body: JSON.stringify(body) }),

  health: async () => {
    try {
      const res = await fetch(`${API_URL}/health`)
      return res.json()
    } catch {
      return { status: 'error' }
    }
  },
}

export { getToken, setToken, clearToken, mapOrder, mapProduct, mapPartnerUser, API_URL as apiUrl }
