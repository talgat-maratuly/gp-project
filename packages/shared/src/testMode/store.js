import { buildTestClientCredentials } from '../utils/testAuthCredentials.js'
import { setToken, clearToken, getToken } from '../api/token.js'

export const TEST_MODE_ACTIVE_KEY = 'gp-test-mode-active'
export const TEST_MODE_USERS_KEY = 'gp-test-mode-users'
export const TEST_MODE_SESSION_KEY = 'gp-test-mode-session'

function loadUsers() {
  try {
    const raw = localStorage.getItem(TEST_MODE_USERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveUsers(users) {
  localStorage.setItem(TEST_MODE_USERS_KEY, JSON.stringify(users))
}

/** Разрешён ли fallback в LocalStorage (по умолчанию в dev — да) */
export function isTestModeFallbackEnabled() {
  const flag = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GP_TEST_MODE : undefined
  if (flag === 'false') return false
  if (flag === 'true') return true
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) return true
  return false
}

/** Активен ли тестовый режим (после сбоя БД или тестовой сессии) */
export function isTestModeActive() {
  try {
    if (localStorage.getItem(TEST_MODE_ACTIVE_KEY) === '1') return true
  } catch {
    /* ignore */
  }
  const token = getToken()
  return typeof token === 'string' && token.startsWith('gp_test_')
}

/** @deprecated alias */
export function isTestModeFlag() {
  return isTestModeActive()
}

export function activateTestMode() {
  try {
    localStorage.setItem(TEST_MODE_ACTIVE_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function getTestSession() {
  try {
    const raw = localStorage.getItem(TEST_MODE_SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setTestSession(session) {
  if (session) localStorage.setItem(TEST_MODE_SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(TEST_MODE_SESSION_KEY)
}

function makeTestToken(userId) {
  return `gp_test_${userId}_${Date.now()}`
}

export function isBackendUnavailableError(err) {
  const msg = String(err?.message || '').toLowerCase()
  const code = err?.code
  if (code === 'NETWORK' || code === 'SERVER') return true
  return (
    msg.includes('postgresql') ||
    msg.includes('prisma') ||
    msg.includes('база данных') ||
    msg.includes('failed to fetch') ||
    msg.includes('недоступен') ||
    msg.includes('подключиться к api')
  )
}

export function registerTestClient(data = {}) {
  activateTestMode()
  const creds = buildTestClientCredentials(data)
  const accountType = data.accountType || 'INDIVIDUAL'
  const userId = `test_user_${Date.now()}`
  const user = {
    id: userId,
    email: creds.email,
    name: creds.name,
    phone: creds.phone,
    role: 'CLIENT',
    regionId: 'region_uralsk',
    clientProfile: {
      id: `test_cp_${Date.now()}`,
      accountType,
      city: data.city?.trim() || 'Уральск',
      companyName: data.companyName || null,
      bin: data.bin || null,
      legalAddress: data.legalAddress || null,
      contactPerson: data.contactPerson || null,
    },
  }
  const users = loadUsers()
  users.push({ ...user, password: creds.password })
  saveUsers(users)
  const token = makeTestToken(userId)
  setToken(token)
  setTestSession(user)
  return { accessToken: token, user }
}

export function loginTestClient(email, password) {
  activateTestMode()
  const normalized = email?.trim()?.toLowerCase()
  const users = loadUsers()
  let user = users.find((u) => u.email === normalized && u.password === password)
  if (!user && normalized === 'client@gp.kz' && password === '1234') {
    user = registerTestClient({
      email: 'client@gp.kz',
      password: '1234',
      name: 'Demo Client',
      phone: '+77001234567',
    }).user
    const users2 = loadUsers()
    user = users2.find((u) => u.email === normalized) || user
  }
  if (!user) throw new Error('Неверный email или пароль (тестовый режим)')
  const { password: _, ...safe } = user
  const token = makeTestToken(safe.id)
  setToken(token)
  setTestSession(safe)
  return { accessToken: token, user: safe }
}

export function logoutTestMode() {
  clearToken()
  setTestSession(null)
}

export function getTestMe() {
  const session = getTestSession()
  if (!session) return null
  return session
}
