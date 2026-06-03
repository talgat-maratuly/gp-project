import { useCallback, useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import {
  cityCoords,
  findNearestCity,
  requestBrowserLocation,
  reverseGeocodeAddress,
} from '../geography/index.js'

const GEO_SESSION_KEY = 'gp-geo-denied'

function buildInitial(profile = {}) {
  return {
    oblastId: profile.oblastId || '',
    cityId: profile.cityId || '',
    city: profile.city || '',
    franchiseId: profile.franchiseId || null,
    address: profile.address || '',
    lat: profile.lat ?? null,
    lng: profile.lng ?? null,
    objectId: profile.objectId || '',
  }
}

/**
 * Тапсырыс мекенжайы: профиль → геолокация → қолмен енгізу.
 */
export function useOrderLocation({
  store,
  profile = {},
  objects = [],
  autoDetect = true,
  value,
  onChange,
}) {
  const { lang } = useLanguage()
  const [geoStatus, setGeoStatus] = useState('idle')
  const triedRef = useRef(false)

  const detectLocation = useCallback(async () => {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(GEO_SESSION_KEY) === '1') {
      setGeoStatus('denied')
      return
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoStatus('unavailable')
      return
    }

    setGeoStatus('detecting')
    try {
      const pos = await requestBrowserLocation()
      const lat = Number(pos.coords.latitude.toFixed(5))
      const lng = Number(pos.coords.longitude.toFixed(5))
      const patch = { lat, lng }

      if (store) {
        const nearest = findNearestCity(store, lat, lng, lang)
        if (nearest) {
          patch.oblastId = nearest.oblastId
          patch.cityId = nearest.cityId
          patch.city = nearest.city
          patch.franchiseId = nearest.franchiseId
        }
      }

      try {
        const addr = await reverseGeocodeAddress(lat, lng)
        if (addr) patch.address = addr
      } catch {
        /* Nominatim сәтсіз — қолмен енгізу */
      }

      onChange(patch)
      setGeoStatus('granted')
    } catch (err) {
      const denied = err?.code === 1
      if (denied && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(GEO_SESSION_KEY, '1')
      }
      setGeoStatus(denied ? 'denied' : 'unavailable')
    }
  }, [store, lang, onChange])

  useEffect(() => {
    if (!autoDetect || triedRef.current) return
    triedRef.current = true
    detectLocation()
  }, [autoDetect, detectLocation])

  const applyObject = useCallback(
    (objectId) => {
      const obj = objects.find((o) => o.id === objectId)
      if (!obj) return
      const patch = { objectId, address: obj.address || value.address }
      if (obj.lat != null && obj.lng != null) {
        patch.lat = obj.lat
        patch.lng = obj.lng
      }
      onChange(patch)
    },
    [objects, onChange, value.address],
  )

  const applyCitySelection = useCallback(
    (sel) => {
      const patch = {
        oblastId: sel.oblastId,
        cityId: sel.cityId,
        city: sel.city || value.city,
        franchiseId: sel.franchiseId ?? value.franchiseId,
      }
      if (store && sel.cityId) {
        const coords = cityCoords(store, sel.cityId)
        if (coords) {
          patch.lat = coords.lat
          patch.lng = coords.lng
        }
      }
      onChange(patch)
    },
    [onChange, store, value.city, value.franchiseId],
  )

  return {
    geoStatus,
    detectLocation,
    applyObject,
    applyCitySelection,
    buildInitial,
  }
}

export default useOrderLocation
