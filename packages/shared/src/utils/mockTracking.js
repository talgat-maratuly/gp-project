import { URALSK_DISPOSAL_ZONES } from '../constants/geoTracking.js'

/** Демо-трекинг, если live GPS / API tracking недоступны */
export function buildMockTracking(order, geofences = URALSK_DISPOSAL_ZONES) {
  if (!order) return null
  const clientLat = Number(order.clientLat) || 51.233
  const clientLng = Number(order.clientLng) || 51.367
  const client = { lat: clientLat, lng: clientLng }
  const executor =
    order.executorLat != null && order.executorLng != null
      ? { lat: Number(order.executorLat), lng: Number(order.executorLng) }
      : { lat: clientLat + 0.008, lng: clientLng + 0.006 }
  return {
    mock: true,
    client,
    executor,
    geofences,
    route: [client, executor],
    statusLabel: 'Демо GPS (live недоступен)',
    distanceKm: null,
    etaMinutes: null,
  }
}
