import { getToken, setToken, clearToken, getRefreshToken, setRefreshToken, clearRefreshToken } from './token.js'

const DEV_API_DEFAULT = 'http://localhost:4000/api'
const PROD_API_DEFAULT = 'https://api.gp-service.kz/api'

/**
 * Базовый URL API (с суффиксом /api, без слэша в конце).
 */
export const API_URL = (() => {
  const raw = import.meta.env?.VITE_API_URL
  const fromEnv = typeof raw === 'string' ? raw.trim() : ''
  if (fromEnv) {
    const url = fromEnv.replace(/\/$/, '')
    if (/^https?:\/\//i.test(url)) return url
    console.warn('[GP] VITE_API_URL должен начинаться с http:// или https://')
  }
  if (import.meta.env?.DEV) return DEV_API_DEFAULT
  if (import.meta.env?.PROD) return PROD_API_DEFAULT
  return DEV_API_DEFAULT
})()

/** Корень хоста без /api — для health и WebSocket */
export function getApiRootUrl() {
  return API_URL.replace(/\/api\/?$/i, '') || 'http://localhost:4000'
}

if (import.meta.env?.DEV) {
  console.log('[GP] API_URL =', API_URL)
}

function isNetworkError(err) {
  return (
    err instanceof TypeError ||
    err?.name === 'TypeError' ||
    String(err?.message || '').toLowerCase().includes('failed to fetch')
  )
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
    return 'Ошибка базы данных. Запустите PostgreSQL: docker compose -f apps/api/docker-compose.yml up -d'
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
    return prismaHint || 'API временно недоступен. Проверьте backend (npm run dev:api:safe).'
  }
  return data?.error || `Ошибка API (${status})`
}

function formatConnectionError(url) {
  return [
    `Не удалось подключиться к API (${url}).`,
    '• API не запущен → npm run dev:api:safe или npm run dev:all',
    '• Порт 4000 занят → npm run kill:ports && npm run dev:all',
    `• Проверьте VITE_API_URL=${DEV_API_DEFAULT}`,
  ].join('\n')
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

let refreshInFlight = null

async function tryRefreshToken() {
  const refresh = getRefreshToken()
  if (!refresh) return false
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_URL}/auth/mobile/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    })
      .then(async (res) => {
        const data = await parseJson(res)
        if (!res.ok) throw new Error(parseError(data, res.status))
        if (data.accessToken) setToken(data.accessToken)
        if (data.refreshToken) setRefreshToken(data.refreshToken)
        return true
      })
      .catch(() => {
        clearToken()
        clearRefreshToken()
        return false
      })
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

async function request(path, options = {}, { auth = true, retryOn401 = true } = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = `${API_URL}${normalizedPath}`
  const method = options.method || 'GET'
  if (import.meta.env?.DEV) {
    console.log('[GP API]', method, url)
  }

  let res
  try {
    res = await fetch(url, { ...options, headers })
  } catch (err) {
    if (isNetworkError(err)) throw new Error(formatConnectionError(url))
    throw err
  }

  if (res.status === 401 && auth && retryOn401) {
    const refreshed = await tryRefreshToken()
    if (refreshed) {
      return request(path, options, { auth, retryOn401: false })
    }
  }

  const data = await parseJson(res)
  if (!res.ok) throw new Error(parseError(data, res.status))
  return data
}

export function get(path, opts) {
  return request(path, { method: 'GET', ...opts })
}

export function post(path, body, opts) {
  return request(path, {
    method: 'POST',
    body: body != null ? JSON.stringify(body) : undefined,
    ...opts,
  })
}

export function patch(path, body, opts) {
  return request(path, {
    method: 'PATCH',
    body: body != null ? JSON.stringify(body) : undefined,
    ...opts,
  })
}

export function del(path, opts) {
  return request(path, { method: 'DELETE', ...opts })
}

export { request, parseError, formatConnectionError, isNetworkError, parseJson }
