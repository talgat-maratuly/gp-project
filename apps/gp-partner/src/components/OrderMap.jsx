import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const URALSK = [51.233, 51.367]

const icon = (color) => L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

function mockDistanceKm(clientLat, clientLng, executorLat, executorLng) {
  if (executorLat == null || executorLng == null) return null
  const R = 6371
  const dLat = ((executorLat - clientLat) * Math.PI) / 180
  const dLng = ((executorLng - clientLng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((clientLat * Math.PI) / 180) *
      Math.cos((executorLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10
}

export default function OrderMap({
  clientLat, clientLng, executorLat, executorLng, className = 'h-56', statusLabel, distanceKm,
}) {
  const ref = useRef(null)
  const mapRef = useRef(null)
  const dist = distanceKm ?? mockDistanceKm(clientLat, clientLng, executorLat, executorLng)

  useEffect(() => {
    if (!ref.current || mapRef.current) return
    const map = L.map(ref.current, { zoomControl: false }).setView(URALSK, 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map)
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.eachLayer((l) => { if (l instanceof L.Marker) map.removeLayer(l) })
    const clat = clientLat ?? URALSK[0]
    const clng = clientLng ?? URALSK[1]
    L.marker([clat, clng], { icon: icon('#3b82f6') }).addTo(map).bindPopup('Клиент')
    if (executorLat != null && executorLng != null) {
      L.marker([executorLat, executorLng], { icon: icon('#10b981') }).addTo(map).bindPopup('Исполнитель')
      map.fitBounds(L.latLngBounds([[clat, clng], [executorLat, executorLng]]), { padding: [40, 40] })
    } else {
      map.setView([clat, clng], 14)
    }
  }, [clientLat, clientLng, executorLat, executorLng])

  return (
    <div className="relative">
      <div ref={ref} className={`w-full rounded-2xl overflow-hidden border border-white/10 z-0 ${className}`} />
      {(statusLabel || dist != null) && (
        <div className="absolute bottom-2 left-2 right-2 bg-[#0f1524]/95 backdrop-blur rounded-xl px-3 py-2 text-xs border border-white/10">
          {statusLabel && <p className="font-semibold text-emerald-400">{statusLabel}</p>}
          {dist != null && <p className="text-slate-400">≈ {dist} км до клиента</p>}
        </div>
      )}
    </div>
  )
}
