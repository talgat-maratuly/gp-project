/** Карталар арқылы маршрут (spec → client) */

export const MAP_NAV_PROVIDERS = [
  { id: 'google', label: 'Google Maps' },
  { id: 'yandex', label: 'Yandex Maps' },
  { id: '2gis', label: '2GIS' },
]

const STORAGE_KEY = 'gp-map-nav-provider'

/** Seed/API default — нақты GPS емес */
const PLACEHOLDER_COORDS = { lat: 51.233, lng: 51.367 }
const PLACEHOLDER_EPS = 0.002

const GIS_POINT_SEP = '\u256e'

const CITY_ALIASES = {
  uralsk: 'uralsk',
  oral: 'uralsk',
  уральск: 'uralsk',
  almaty: 'almaty',
  алматы: 'almaty',
  'алма-ата': 'almaty',
  astana: 'astana',
  астана: 'astana',
  'нур-султан': 'astana',
  'nur-sultan': 'astana',
  shymkent: 'shymkent',
  шымкент: 'shymkent',
  aktobe: 'aktobe',
  актобе: 'aktobe',
  karaganda: 'karaganda',
  караганда: 'karaganda',
}

const CITY_BOUNDS = [
  { slug: 'almaty', latMin: 43.0, latMax: 43.5, lngMin: 76.5, lngMax: 77.3 },
  { slug: 'astana', latMin: 51.0, latMax: 51.3, lngMin: 71.0, lngMax: 71.6 },
  { slug: 'shymkent', latMin: 42.2, latMax: 42.4, lngMin: 69.5, lngMax: 69.7 },
  { slug: 'uralsk', latMin: 51.1, latMax: 51.3, lngMin: 51.2, lngMax: 51.5 },
  { slug: 'aktobe', latMin: 50.2, latMax: 50.4, lngMin: 57.0, lngMax: 57.3 },
  { slug: 'karaganda', latMin: 49.7, latMax: 50.0, lngMin: 73.0, lngMax: 73.2 },
]

export function getPreferredMapProvider() {
  if (typeof window === 'undefined') return 'google'
  const saved = localStorage.getItem(STORAGE_KEY)
  return MAP_NAV_PROVIDERS.some((p) => p.id === saved) ? saved : 'google'
}

export function setPreferredMapProvider(providerId) {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, providerId)
}

function formatCoord(value) {
  return Number(value).toFixed(6).replace(/(?:\.0+|(\.\d*?)0+)$/, '$1')
}

function isPlaceholderCoords(lat, lng) {
  return (
    Math.abs(lat - PLACEHOLDER_COORDS.lat) < PLACEHOLDER_EPS
    && Math.abs(lng - PLACEHOLDER_COORDS.lng) < PLACEHOLDER_EPS
  )
}

/** KZ шекарасында lat/lng ауысып қалған жағдайды түзету */
export function normalizeKzCoords(lat, lng) {
  let la = Number(lat)
  let ln = Number(lng)
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return { lat: null, lng: null }

  const latInKz = la >= 40 && la <= 56
  const lngInKz = ln >= 46 && ln <= 88

  if (latInKz && lngInKz) return { lat: la, lng: ln }

  if (la >= 46 && la <= 88 && ln >= 40 && ln <= 56) {
    return { lat: ln, lng: la }
  }

  return { lat: la, lng: ln }
}

function resolve2gisCitySlug({ city, lat, lng }) {
  const normalizedCity = (city || '').trim().toLowerCase()
  if (normalizedCity) {
    const slug = CITY_ALIASES[normalizedCity]
    if (slug) return slug
  }

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const match = CITY_BOUNDS.find(
      (c) => lat >= c.latMin && lat <= c.latMax && lng >= c.lngMin && lng <= c.lngMax,
    )
    if (match) return match.slug
  }

  return null
}

function buildRouteAddress(address, city) {
  const addr = (address || '').trim()
  const c = (city || '').trim()
  if (!addr) return c
  if (!c || addr.toLowerCase().includes(c.toLowerCase())) return addr
  return `${addr}, ${c}`
}

function build2gisPointToken(lng, lat, address) {
  const coords = `${formatCoord(lng)},${formatCoord(lat)}`
  const addr = (address || '').trim()
  if (!addr) return coords
  return `${coords}${GIS_POINT_SEP}${encodeURIComponent(addr)}`
}

/** @param {{ lat?: number|null, lng?: number|null, address?: string|null, city?: string|null }} dest */
export function resolveMapDestination(dest) {
  const address = buildRouteAddress(dest?.address, dest?.city)
  const { lat, lng } = normalizeKzCoords(dest?.lat, dest?.lng)
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng)
  const placeholder = hasCoords && isPlaceholderCoords(lat, lng)
  const useCoords = hasCoords && (!placeholder || !address)

  return { lat, lng, address, hasCoords: useCoords, placeholder }
}

/** @param {{ lat?: number|null, lng?: number|null, address?: string|null, city?: string|null }} dest */
export function buildMapNavigationUrl(providerId, dest) {
  const { lat, lng, address, hasCoords } = resolveMapDestination(dest)

  switch (providerId) {
    case 'yandex':
      if (hasCoords) {
        return `https://yandex.ru/maps/?rtext=~${lat},${lng}&rtt=auto`
      }
      if (address) {
        return `https://yandex.ru/maps/?rtext=~${encodeURIComponent(address)}&rtt=auto`
      }
      return null
    case '2gis': {
      const citySlug = resolve2gisCitySlug({ city: dest?.city, lat, lng })
      const base = citySlug ? `https://2gis.kz/${citySlug}` : 'https://2gis.kz'

      if (hasCoords) {
        const to = build2gisPointToken(lng, lat, address)
        return `${base}/routeSearch/rsType/car/to/${to}`
      }
      if (address) {
        return `${base}/routeSearch/rsType/car/to/${encodeURIComponent(address)}`
      }
      return null
    }
    case 'google':
    default:
      if (hasCoords) {
        return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      }
      if (address) {
        return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
      }
      return null
  }
}

/** @param {{ lat?: number|null, lng?: number|null, address?: string|null, city?: string|null }} dest */
export function openMapNavigation(providerId, dest) {
  const url = buildMapNavigationUrl(providerId, dest)
  if (!url) return false
  window.open(url, '_blank', 'noopener')
  setPreferredMapProvider(providerId)
  return true
}
