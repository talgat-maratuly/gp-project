import { useEffect, useRef } from 'react'
import { api } from '@gp/shared/api'

const INTERVAL_MS = 10000

/**
 * Отправка GPS с телефона партнёра (watchPosition) каждые ~10 сек.
 */
export function useGpsTracker(activeOrder) {
  const watchId = useRef(null)
  const lastSent = useRef(0)

  useEffect(() => {
    if (!activeOrder?.id || activeOrder.category !== 'septic') return undefined
    if (!navigator.geolocation) return undefined

    const send = (pos) => {
      const now = Date.now()
      if (now - lastSent.current < INTERVAL_MS - 500) return
      lastSent.current = now
      const { latitude: lat, longitude: lng, speed, heading } = pos.coords
      const speedKmh = speed != null ? speed * 3.6 : undefined
      api.postGps({
        orderId: activeOrder.id,
        lat,
        lng,
        speedKmh,
        heading: heading ?? undefined,
      }).catch(() => {})
    }

    watchId.current = navigator.geolocation.watchPosition(
      send,
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )

    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current)
    }
  }, [activeOrder?.id, activeOrder?.category, activeOrder?.status])
}
