import { getToken, setToken, clearToken } from './token.js'
import { mapOrder, mapProduct, mapPartnerUser } from './mappers.js'

const mapOrdersForApp = (list) => {
  const forClient = import.meta.env?.VITE_APP_NAME === 'service'
  return list.map((o) => mapOrder(o, { forClient }))
}

const DEV_API_DEFAULT = 'http://localhost:4000'

/**
 * Базовый URL API (без слэша в конце).
 * Dev: http://localhost:4000 (или VITE_API_URL из .env)
 * Production: VITE_API_URL=https://your-api.onrender.com
 */
export const API_URL = (() => {
  const raw = import.meta.env?.VITE_API_URL
  const fromEnv = typeof raw === 'string' ? raw.trim() : ''
  if (fromEnv) {
    const url = fromEnv.replace(/\/$/, '')
    if (/^https?:\/\//i.test(url)) return url
    console.warn('[GP] VITE_API_URL должен начинаться с http:// или https://, используем dev default')
  }
  if (import.meta.env?.DEV) return DEV_API_DEFAULT
  if (import.meta.env?.PROD) {
    console.error('[GP] VITE_API_URL не задан для production build.')
    return ''
  }
  return DEV_API_DEFAULT
})()

if (import.meta.env?.DEV) {
  console.log('[GP] API_URL =', API_URL)
}

const EXPECTED_DEV_API = 'http://localhost:4000'

function isNetworkError(err) {
  return (
    err instanceof TypeError ||
    err?.name === 'TypeError' ||
    String(err?.message || '').toLowerCase().includes('failed to fetch')
  )
}

function isWrongApiUrl(url) {
  if (!url || url === EXPECTED_DEV_API) return false
  if (import.meta.env?.PROD) return false
  return !url.includes('localhost:4000') && !url.includes('127.0.0.1:4000')
}

function formatConnectionError(url) {
  const lines = [
    `Не удалось подключиться к API (${url}).`,
    '• API не запущен → npm run dev:api:safe или npm run dev:all',
    '• Порт 4000 занят (EADDRINUSE) → npm run kill:ports && npm run dev:all',
  ]
  if (isWrongApiUrl(url)) {
    lines.push(`• Неверный URL → задайте VITE_API_URL=${EXPECTED_DEV_API} в .env.development`)
  } else if (import.meta.env?.DEV && url !== EXPECTED_DEV_API) {
    lines.push(`• Ожидается ${EXPECTED_DEV_API} (сейчас: ${url})`)
  }
  return lines.join('\n')
}

function parsePrismaHint(data) {
  const raw = [data?.message, data?.error, ...(Array.isArray(data?.message) ? data.message : [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  if (
    raw.includes('prisma') ||
    raw.includes('database') ||
    raw.includes('p1001') ||
    raw.includes('postgresql') ||
    raw.includes('connect econnrefused')
  ) {
    return 'Ошибка базы данных (Prisma). Запустите PostgreSQL: docker compose -f apps/api/docker-compose.yml up -d && npm run prisma:migrate:deploy'
  }
  return null
}

function parseError(data, status) {
  const prismaHint = parsePrismaHint(data)
  if (prismaHint && status >= 500) return prismaHint
  if (Array.isArray(data?.message)) return data.message.join(', ')
  if (typeof data?.message === 'string') return data.message
  if (status === 401) return 'Войдите в аккаунт'
  if (status === 403) return 'Недостаточно прав для этого действия'
  if (status === 502 || status === 503) {
    return prismaHint || 'API временно недоступен. Проверьте, что backend запущен (npm run dev:api:safe).'
  }
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

  const url = `${API_URL}${path}`
  const method = options.method || 'GET'
  if (import.meta.env?.DEV) {
    console.log('[GP API]', method, url)
  }

  let res
  try {
    res = await fetch(url, { ...options, headers })
  } catch (err) {
    if (isNetworkError(err)) {
      throw new Error(formatConnectionError(url))
    }
    throw err
  }

  const data = await parseJson(res)
  if (!res.ok) throw new Error(parseError(data, res.status))
  return data
}

export const api = {
  registerClient: (body) =>
    request('/auth/register/client', { method: 'POST', body: JSON.stringify(body) }, { auth: false }).then((r) => {
      setToken(r.accessToken)
      return r
    }),

  registerPartner: (body) =>
    request('/auth/register/partner', { method: 'POST', body: JSON.stringify(body) }, { auth: false }).then((r) => {
      setToken(r.accessToken)
      return r
    }),

  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, { auth: false }).then((r) => {
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
    serviceAccess: p.serviceAccess || [],
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
      serviceAccess: p.serviceAccess || [],
    })),

  getFurnitureExecutorOrders: (serviceType) => {
    const q = serviceType ? `?serviceType=${encodeURIComponent(serviceType)}` : ''
    return request(`/furniture-executor/partner/orders${q}`)
  },

  acceptFurnitureExecutorOrder: (orderId) =>
    request(`/furniture-executor/partner/orders/${orderId}/accept`, { method: 'POST' }),

  updateFurnitureExecutorOrderStatus: (orderId, status) =>
    request(`/furniture-executor/partner/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  declineFurnitureExecutorOrder: (orderId) =>
    request(`/furniture-executor/partner/orders/${orderId}/decline`, { method: 'POST' }),

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

  getGeofences: () => request('/geo/geofences'),

  postGps: (body) => request('/geo/gps', { method: 'POST', body: JSON.stringify(body) }),

  getOrderGpsHistory: (orderId) => request(`/geo/orders/${orderId}/history`),

  getAdminFleet: () => request('/geo/admin/fleet'),

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

  healthFull: async () => {
    const url = `${API_URL}/health/full`
    try {
      const res = await fetch(url)
      const data = await parseJson(res)
      if (!res.ok) throw new Error(parseError(data, res.status))
      return data
    } catch (err) {
      if (isNetworkError(err)) throw new Error(formatConnectionError(url))
      throw err
    }
  },

  getServiceProjects: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/service-projects${q ? `?${q}` : ''}`)
  },

  getServiceProject: (id) => request(`/service-projects/${id}`),

  patchServiceProjectStatus: (id, status) =>
    request(`/service-projects/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  createHunterProject: (body) =>
    request('/hunter-projects', { method: 'POST', body: JSON.stringify(body) }),

  getHunterProjects: () => request('/hunter-projects'),

  getHunterProject: (id) => request(`/hunter-projects/${id}`),

  createFurnitureProject: (body) =>
    request('/furniture-projects', { method: 'POST', body: JSON.stringify(body) }),

  getFurnitureProjects: () => request('/furniture-projects'),

  getFurnitureProject: (id) => request(`/furniture-projects/${id}`),

  getMarketProducts: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/market/products${q ? `?${q}` : ''}`).then((list) => list.map(mapProduct))
  },

  health: async () => {
    const url = `${API_URL}/health`
    try {
      const res = await fetch(url)
      if (!res.ok) {
        const data = await parseJson(res).catch(() => null)
        return { status: 'error', message: parseError(data, res.status) }
      }
      return res.json()
    } catch (err) {
      return {
        status: 'error',
        message: isNetworkError(err) ? formatConnectionError(url) : (err?.message || 'API недоступен'),
      }
    }
  },
}

export { getToken, setToken, clearToken, mapOrder, mapProduct, mapPartnerUser, API_URL as apiUrl }
