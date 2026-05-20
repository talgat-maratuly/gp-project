import { useEffect, useRef } from 'react'
import { Crosshair } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const DEFAULT = [51.233, 51.367]

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#16a34a;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

/**
 * Карта: тап / клик или перетаскивание метки — координаты для доставки.
 */
export default function AddressPickerMap({ lat, lng, onLocationChange, className = 'h-52' }) {
  const ref = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const onLocRef = useRef(onLocationChange)
  useEffect(() => {
    onLocRef.current = onLocationChange
  }, [onLocationChange])

  const clat = Number(lat) || DEFAULT[0]
  const clng = Number(lng) || DEFAULT[1]

  useEffect(() => {
    if (!ref.current || mapRef.current) return
    const map = L.map(ref.current, { zoomControl: true }).setView([clat, clng], 14)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map)
    mapRef.current = map

    const marker = L.marker([clat, clng], { draggable: true, icon: pinIcon }).addTo(map)
    markerRef.current = marker

    const emit = (la, ln) => onLocRef.current(Number(la.toFixed(5)), Number(ln.toFixed(5)))

    marker.on('dragend', () => {
      const p = marker.getLatLng()
      emit(p.lat, p.lng)
    })

    map.on('click', (e) => {
      const { lat: la, lng: ln } = e.latlng
      marker.setLatLng([la, ln])
      emit(la, ln)
    })

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return
    marker.setLatLng([clat, clng])
  }, [clat, clng])

  const myLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const la = pos.coords.latitude
        const ln = pos.coords.longitude
        const map = mapRef.current
        const marker = markerRef.current
        if (map && marker) {
          marker.setLatLng([la, ln])
          map.setView([la, ln], 15)
        }
        onLocRef.current(Number(la.toFixed(5)), Number(ln.toFixed(5)))
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={myLocation}
        className="flex items-center gap-2 text-xs font-semibold text-gp-blue-600 hover:underline"
      >
        <Crosshair className="w-4 h-4" />
        Определить моё местоположение
      </button>
      <p className="text-[11px] text-slate-500 leading-snug">
        Нажмите на карту или перетащите зелёную точку.
      </p>
      <div ref={ref} className={`w-full rounded-2xl overflow-hidden border border-slate-200 z-0 touch-manipulation ${className}`} />
    </div>
  )
}
