import { resolveLocalizedName } from '../i18n/localizedName.js'

export function activeOblasts(store) {
  return (store?.oblasts || []).filter((o) => o.active !== false)
}

export function activeCities(store, oblastId) {
  const list = (store?.cities || []).filter((c) => c.active !== false)
  if (!oblastId) return list
  return list.filter((c) => c.oblastId === oblastId)
}

export function activeDistricts(store, cityId) {
  const list = (store?.districts || []).filter((d) => d.active !== false)
  if (!cityId) return list
  return list.filter((d) => d.cityId === cityId)
}

export function findCity(store, cityId) {
  return (store?.cities || []).find((c) => c.id === cityId) || null
}

export function findDistrict(store, districtId) {
  return (store?.districts || []).find((d) => d.id === districtId) || null
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

export function districtLabel(district, lang) {
  return resolveLocalizedName(district, lang)
}

/** Қала таңдау → franchiseId, city атауы */
export function resolveCitySelection(store, cityId, lang = 'ru', districtId = '') {
  const city = findCity(store, cityId)
  if (!city) return null
  const oblast = findOblast(store, city.oblastId)
  const district = districtId ? findDistrict(store, districtId) : null
  return {
    cityId: city.id,
    oblastId: city.oblastId,
    city: cityLabel(city, lang),
    oblast: oblast ? oblastLabel(oblast, lang) : '',
    franchiseId: city.franchiseId || null,
    districtId: district?.cityId === city.id ? district.id : '',
    district: district?.cityId === city.id ? districtLabel(district, lang) : '',
  }
}

export function citiesForFranchise(store, franchiseId) {
  return activeCities(store).filter((c) => c.franchiseId === franchiseId)
}

/** Заявка/клиент city мәтінінен oblastId + cityId табу */
export function inferCitySelection(store, { city, cityId, oblastId, franchiseId } = {}, lang = 'ru') {
  if (cityId) {
    const resolved = resolveCitySelection(store, cityId, lang)
    if (resolved) return resolved
  }
  const cities = activeCities(store)
  const byName = city
    ? cities.find((c) => cityLabel(c, lang) === city || c.name === city)
    : null
  if (byName) return resolveCitySelection(store, byName.id, lang)
  if (franchiseId) {
    const byFr = cities.find((c) => c.franchiseId === franchiseId)
    if (byFr) return resolveCitySelection(store, byFr.id, lang)
  }
  if (oblastId) {
    const first = cities.find((c) => c.oblastId === oblastId)
    if (first) return resolveCitySelection(store, first.id, lang)
  }
  return { oblastId: oblastId || '', cityId: cityId || '', city: city || '', franchiseId: franchiseId || null }
}

export {
  findNearestCity,
  requestBrowserLocation,
  reverseGeocodeAddress,
  cityCoords,
} from './geoLocation.js'

export { createStaticGeoStore, STATIC_GEO_STORE } from './staticStore.js'
