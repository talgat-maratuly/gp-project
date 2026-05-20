/** Отдельный JWT для каждого приложения (partner / service / flutter) */
const APP =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_NAME
    ? import.meta.env.VITE_APP_NAME
    : 'gp'

const TOKEN_KEY = `gp-${APP}-access-token`

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

export function getTokenStorageKey() {
  return TOKEN_KEY
}
