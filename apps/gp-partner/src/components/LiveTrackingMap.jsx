import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { GEOFENCE_COLORS } from '@gp/shared/constants'

const dot = (color, size = 14) =>
  L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })

export default function LiveTrackingMap({ tracking, className = 'h-72', showRoute = true }) {
  const ref = useRef(null)
  const mapRef = useRef(null)
  const layersRef = useRef({})

  useEffect(() => {
    if (!ref.current || mapRef.current) return
    try {
      const map = L.map(ref.current, { zoomControl: true }).setView([51.233, 51.367], 13)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(map)
      mapRef.current = map
    } catch (err) {
      console.warn('[LiveTrackingMap]', err)
    }
    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !tracking) return
    Object.values(layersRef.current).forEach((l) => l.remove?.())
    layersRef.current = {}
    const { client, executor, geofences = [], route = [] } = tracking
    geofences.forEach((z) => {
      const circle = L.circle([z.lat, z.lng], {
        radius: z.radiusM || 120,
        color: GEOFENCE_COLORS.official,
        fillColor: GEOFENCE_COLORS.official,
        fillOpacity: 0.2,
        weight: 2,
      }).addTo(map)
      circle.bindPopup(`<b>${z.name}</b>`)
      layersRef.current[`z-${z.id}`] = circle
    })
    if (client?.lat != null) {
      L.marker([client.lat, client.lng], { icon: dot(GEOFENCE_COLORS.client, 16) }).addTo(map).bindPopup('Клиент')
      L.circle([client.lat, client.lng], { radius: 80, color: GEOFENCE_COLORS.client, fillOpacity: 0.08, weight: 1, dashArray: '4 4' }).addTo(map)
    }
    if (executor?.lat != null) {
      L.marker([executor.lat, executor.lng], { icon: dot(GEOFENCE_COLORS.executor, 16) }).addTo(map).bindPopup(tracking.statusLabel || 'Машина')
    }
    if (showRoute && route.length > 1) {
      layersRef.current.route = L.polyline(route, { color: GEOFENCE_COLORS.executor, weight: 4, opacity: 0.7 }).addTo(map)
    }
    const pts = []
    if (client?.lat != null) pts.push([client.lat, client.lng])
    if (executor?.lat != null) pts.push([executor.lat, executor.lng])
    if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 15 })
  }, [tracking, showRoute])

  return (
    <div className={`relative w-full ${className}`}>
      {tracking?.mock && (
        <p className="absolute top-2 left-2 right-2 z-[500] text-[10px] font-semibold text-center py-1 px-2 rounded-lg bg-black/60 text-white">
          Демо GPS — live трекинг недоступен
        </p>
      )}
      <div ref={ref} className="w-full h-full min-h-[12rem] rounded-2xl overflow-hidden z-0" />
    </div>
  )
}
