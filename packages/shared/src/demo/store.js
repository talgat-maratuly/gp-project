import { createSeedState, recalcAggregates, STORE_VERSION, DEMO_USERS } from './seed.js'
import { pullFromHub, pushToHub, isHubEnabled } from './syncHub.js'

export const GLOBAL_STORE_KEY = 'gp-global-store-v5'
const listeners = new Set()

let memoryCache = null

export function isDemoMode() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GP_DEMO === 'false') return false
  return true
}

export function loadGlobalStore() {
  if (memoryCache) return memoryCache
  try {
    const raw = localStorage.getItem(GLOBAL_STORE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.franchises && parsed.version === STORE_VERSION) {
        memoryCache = parsed
        return memoryCache
      }
    }
  } catch {
    /* ignore */
  }
  memoryCache = createSeedState()
  saveGlobalStore(memoryCache, { skipHub: true })
  return memoryCache
}

export function saveGlobalStore(state, opts = {}) {
  memoryCache = recalcAggregates(state)
  try {
    localStorage.setItem(GLOBAL_STORE_KEY, JSON.stringify(memoryCache))
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn(memoryCache))
  if (!opts.skipHub && isHubEnabled()) {
    pushToHub(memoryCache).catch(() => {})
  }
  return memoryCache
}

export function resetGlobalStore() {
  return saveGlobalStore(createSeedState())
}

export function subscribeGlobalStore(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export async function syncFromHub() {
  if (!isHubEnabled()) return loadGlobalStore()
  const remote = await pullFromHub()
  if (remote) {
    memoryCache = remote
    try {
      localStorage.setItem(GLOBAL_STORE_KEY, JSON.stringify(remote))
    } catch {
      /* ignore */
    }
    listeners.forEach((fn) => fn(memoryCache))
  }
  return memoryCache
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

export function findDemoUser(username, password) {
  return DEMO_USERS.find((u) => u.username === username.trim().toLowerCase() && u.password === password)
}

// sync re-export for tests
export { createSeedState, recalcAggregates, STORE_VERSION } from './seed.js'
