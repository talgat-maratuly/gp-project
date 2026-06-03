import { resolveLocalizedName } from '../i18n/localizedName.js'

export function activeOblasts(store) {
  return (store?.oblasts || []).filter((o) => o.active !== false)
}

export function activeCities(store, oblastId) {
  const list = (store?.cities || []).filter((c) => c.active !== false)
  if (!oblastId) return list
  return list.filter((c) => c.oblastId === oblastId)
}

export function findCity(store, cityId) {
  return (store?.cities || []).find((c) => c.id === cityId) || null
}

export function findOblast(store, oblastId) {
  return (store?.oblasts || []).find((o) => o.id === oblastId) || null
}

export function cityLabel(city, lang) {
  return resolveLocalizedName(city, lang)
}

export function oblastLabel(oblast, lang) {
  return resolveLocalizedName(oblast, lang)
}

/** Қала таңдау → franchiseId, city атауы */
export function resolveCitySelection(store, cityId, lang = 'ru') {
  const city = findCity(store, cityId)
  if (!city) return null
  const oblast = findOblast(store, city.oblastId)
  return {
    cityId: city.id,
    oblastId: city.oblastId,
    city: cityLabel(city, lang),
    oblast: oblast ? oblastLabel(oblast, lang) : '',
    franchiseId: city.franchiseId || null,
  }
}

export function citiesForFranchise(store, franchiseId) {
  return activeCities(store).filter((c) => c.franchiseId === franchiseId)
}
