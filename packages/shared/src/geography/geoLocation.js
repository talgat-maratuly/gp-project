import { activeCities, cityLabel, resolveCitySelection } from './index.js'

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Координатадан ең жақын қала */
export function findNearestCity(store, lat, lng, lang = 'ru') {
  const la = Number(lat)
  const ln = Number(lng)
  if (!store || !Number.isFinite(la) || !Number.isFinite(ln)) return null

  let best = null
  let bestDist = Infinity
  for (const city of activeCities(store)) {
    const clat = Number(city.lat)
    const clng = Number(city.lng)
    if (!Number.isFinite(clat) || !Number.isFinite(clng)) continue
    const d = haversineKm(la, ln, clat, clng)
    if (d < bestDist) {
      bestDist = d
      best = city
    }
  }
  if (!best) return null
  return {
    ...resolveCitySelection(store, best.id, lang),
    lat: best.lat,
    lng: best.lng,
  }
}

export function requestBrowserLocation(options = {}) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(Object.assign(new Error('Geolocation unavailable'), { code: 'UNAVAILABLE' }))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 60000,
      ...options,
    })
  })
}

/** OSM Nominatim — мекенжай мәтіні (қысқа) */
export async function reverseGeocodeAddress(lat, lng) {
  const la = Number(lat)
  const ln = Number(lng)
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return ''

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${la}&lon=${ln}&zoom=18&addressdetails=1`
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'Accept-Language': 'ru,kk,en' },
  })
  if (!res.ok) return ''
  const data = await res.json()
  const a = data.address || {}
  const parts = [
    a.city || a.town || a.village || a.hamlet,
    a.road,
    a.house_number,
  ].filter(Boolean)
  return parts.join(', ') || data.display_name?.split(',').slice(0, 3).join(',') || ''
}

export function cityCoords(store, cityId) {
  const city = (store?.cities || []).find((c) => c.id === cityId)
  if (!city) return null
  const lat = Number(city.lat)
  const lng = Number(city.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}
