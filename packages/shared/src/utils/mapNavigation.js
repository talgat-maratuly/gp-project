/** Карталар арқылы маршрут (spec → client) */

export const MAP_NAV_PROVIDERS = [
  { id: 'google', label: 'Google Maps' },
  { id: 'yandex', label: 'Yandex Maps' },
  { id: '2gis', label: '2GIS' },
]

const STORAGE_KEY = 'gp-map-nav-provider'

export function getPreferredMapProvider() {
  if (typeof window === 'undefined') return 'google'
  const saved = localStorage.getItem(STORAGE_KEY)
  return MAP_NAV_PROVIDERS.some((p) => p.id === saved) ? saved : 'google'
}

export function setPreferredMapProvider(providerId) {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, providerId)
}

/** @param {{ lat?: number|null, lng?: number|null, address?: string|null }} dest */
export function buildMapNavigationUrl(providerId, dest) {
  const lat = Number(dest?.lat)
  const lng = Number(dest?.lng)
  const address = (dest?.address || '').trim()
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng)

  switch (providerId) {
    case 'yandex':
      if (hasCoords) {
        return `https://yandex.ru/maps/?rtext=~${lat},${lng}&rtt=auto`
      }
      if (address) {
        return `https://yandex.ru/maps/?rtext=~${encodeURIComponent(address)}&rtt=auto`
      }
      return null
    case '2gis':
      if (hasCoords) {
        return `https://2gis.kz/routeSearch/rsType/car/to/${lng},${lat}`
      }
      if (address) {
        return `https://2gis.kz/search/${encodeURIComponent(address)}`
      }
      return null
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

/** @param {{ lat?: number|null, lng?: number|null, address?: string|null }} dest */
export function openMapNavigation(providerId, dest) {
  const url = buildMapNavigationUrl(providerId, dest)
  if (!url) return false
  window.open(url, '_blank', 'noopener')
  setPreferredMapProvider(providerId)
  return true
}
