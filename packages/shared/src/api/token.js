/** Отдельный JWT для каждого приложения (partner / service / flutter) */
const APP =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_NAME
    ? import.meta.env.VITE_APP_NAME
    : 'gp'

const TOKEN_KEY = `gp-${APP}-access-token`
const REFRESH_KEY = `gp-${APP}-refresh-token`
const SESSION_ROLE_KEY = `gp-${APP}-session-role`
const DEVICE_ID_KEY = `gp-${APP}-device-id`

/** OTP refresh үшін (MinLength 8) */
export function getDeviceId() {
  try {
    const stored = localStorage.getItem(DEVICE_ID_KEY)
    if (stored && stored.length >= 8) return stored
    const random =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const next = `gp-${APP}-${random}`
    localStorage.setItem(DEVICE_ID_KEY, next)
    return next
  } catch {
    /* ignore */
  }
  return `gp-${APP}-web`
}

export function setDeviceId(deviceId) {
  try {
    if (deviceId && String(deviceId).length >= 8) {
      localStorage.setItem(DEVICE_ID_KEY, String(deviceId))
    }
  } catch {
    /* ignore */
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_KEY)
  } catch {
    return null
  }
}

export function setRefreshToken(token) {
  if (token) localStorage.setItem(REFRESH_KEY, token)
  else localStorage.removeItem(REFRESH_KEY)
}

export function clearRefreshToken() {
  localStorage.removeItem(REFRESH_KEY)
}

export function setSessionRole(role) {
  if (role) localStorage.setItem(SESSION_ROLE_KEY, role)
  else localStorage.removeItem(SESSION_ROLE_KEY)
}

export function getSessionRole() {
  try {
    return localStorage.getItem(SESSION_ROLE_KEY)
  } catch {
    return null
  }
}

export function clearSessionRole() {
  localStorage.removeItem(SESSION_ROLE_KEY)
}

export function getTokenStorageKey() {
  return TOKEN_KEY
}
