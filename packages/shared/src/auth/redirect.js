/** Сохранение intended URL для возврата после login (deep links). */

const PREFIX = 'gp_auth_return_'
export const FROM_QUERY_KEY = 'from'

const SKIP_PREFIXES = ['/login', '/auth', '/register', '/forgot-password', '/reset-password']

export function isAuthEntryPath(path) {
  if (!path) return true
  const base = String(path).split('?')[0]
  return SKIP_PREFIXES.some((p) => base === p || base.startsWith(`${p}/`))
}

export function saveAuthReturnPath(appId, path) {
  if (!appId || !path || path === '/' || isAuthEntryPath(path)) return
  try {
    sessionStorage.setItem(`${PREFIX}${appId}`, path)
  } catch {
    /* private mode */
  }
}

export function peekAuthReturnPath(appId) {
  try {
    return sessionStorage.getItem(`${PREFIX}${appId}`) || null
  } catch {
    return null
  }
}

export function consumeAuthReturnPath(appId, fallback = '/') {
  const stored = peekAuthReturnPath(appId)
  try {
    sessionStorage.removeItem(`${PREFIX}${appId}`)
  } catch {
    /* ignore */
  }
  if (stored && !isAuthEntryPath(stored)) return stored
  if (fallback && fallback !== '/' && !isAuthEntryPath(fallback)) return fallback
  return '/'
}

/** Полный путь из react-router location */
export function locationReturnPath(location) {
  if (!location) return '/'
  return `${location.pathname || '/'}${location.search || ''}${location.hash || ''}`
}

/** Читает ?from= из query (переживает reload login-страницы) */
export function readReturnFromQuery(search = '') {
  const qs = search.startsWith('?') ? search.slice(1) : search
  const raw = new URLSearchParams(qs).get(FROM_QUERY_KEY)
  if (!raw) return null
  try {
    const decoded = decodeURIComponent(raw)
    return isAuthEntryPath(decoded) ? null : decoded
  } catch {
    return isAuthEntryPath(raw) ? null : raw
  }
}

/**
 * Приоритет: ?from= → location.state.from → sessionStorage.
 * Синхронизирует все источники в sessionStorage.
 */
export function resolveAuthReturnPath(appId, location) {
  const fromQuery = readReturnFromQuery(location?.search || '')
  const fromState = location?.state?.from
  const fromStorage = peekAuthReturnPath(appId)
  const resolved = [fromQuery, fromState, fromStorage].find(
    (p) => typeof p === 'string' && p && p !== '/' && !isAuthEntryPath(p),
  )
  if (resolved) saveAuthReturnPath(appId, resolved)
  return resolved || '/'
}

/** Login URL/path с ?from= и state (для Navigate / Link) */
export function buildLoginTo(loginPath, returnPath) {
  if (!returnPath || returnPath === '/' || isAuthEntryPath(returnPath)) {
    return loginPath
  }
  const [path, qs = ''] = String(loginPath).split('?')
  const params = new URLSearchParams(qs)
  params.set(FROM_QUERY_KEY, returnPath)
  return {
    pathname: path,
    search: `?${params.toString()}`,
    state: { from: returnPath },
  }
}
