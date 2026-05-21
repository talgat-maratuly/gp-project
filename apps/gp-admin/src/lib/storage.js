import { createSeedState, STORE_VERSION } from '../data/seedData'

export const STORAGE_KEY = 'gp-admin-store-v2'

export function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createSeedState()
    const parsed = JSON.parse(raw)
    if (!parsed?.franchises || parsed.version !== STORE_VERSION) return createSeedState()
    return parsed
  } catch {
    return createSeedState()
  }
}

export function saveStore(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function resetStore() {
  const seed = createSeedState()
  saveStore(seed)
  return seed
}
