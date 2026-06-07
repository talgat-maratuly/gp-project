import {
  getToken,
  setToken,
  clearToken,
  getRefreshToken,
  setRefreshToken,
  clearRefreshToken,
  getDeviceId,
  getSessionRole,
  clearSessionRole,
} from './token.js'
import { ApiError, parseApiErrorBody, formatConnectionError, isNetworkError } from './errors.js'

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
  throw new Error('VITE_API_URL обязателен для GP frontend')
})()

/** Корень хоста без /api — для health и WebSocket */
export function getApiRootUrl() {
  return API_URL.replace(/\/api\/?$/i, '')
}

if (import.meta.env?.DEV) {
  console.log('[GP] API_URL =', API_URL)
}

async function parseJson(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    throw new ApiError('Некорректный ответ API', { code: 'PARSE' })
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
      body: JSON.stringify({
        refreshToken: refresh,
        deviceId: getDeviceId(),
        ...(getSessionRole() ? { sessionRole: getSessionRole() } : {}),
      }),
    })
      .then(async (res) => {
        const data = await parseJson(res)
        if (!res.ok) throw parseApiErrorBody(data, res.status)
        if (data.accessToken) setToken(data.accessToken)
        if (data.refreshToken) setRefreshToken(data.refreshToken)
        return true
      })
      .catch(() => {
        clearToken()
        clearRefreshToken()
        clearSessionRole()
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
  if (!res.ok) throw parseApiErrorBody(data, res.status)
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

/** multipart/form-data (do not set Content-Type — browser adds boundary) */
export async function uploadForm(path, formData, { auth = true, retryOn401 = true } = {}) {
  const headers = {}
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = `${API_URL}${normalizedPath}`

  let res
  try {
    res = await fetch(url, { method: 'POST', body: formData, headers })
  } catch (err) {
    if (isNetworkError(err)) throw new Error(formatConnectionError(url))
    throw err
  }

  if (res.status === 401 && auth && retryOn401) {
    const refreshed = await tryRefreshToken()
    if (refreshed) return uploadForm(path, formData, { auth, retryOn401: false })
  }

  const data = await parseJson(res)
  if (!res.ok) throw parseApiErrorBody(data, res.status)
  return data
}

export { request, parseJson }
export { ApiError, parseApiErrorBody, formatConnectionError, getErrorMessage, isRetryableError } from './errors.js'
