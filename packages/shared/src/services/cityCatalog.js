import { resolveLocalizedName } from '../i18n/localizedName.js'
import { SERVICE_ID_TO_TEMPLATE } from '../demo/seed.js'
import {
  CONSULTATION_FEE,
  CONSULTATION_SERVICE_IDS,
  FILTER_CARTRIDGE_PRICE,
  LAWN_SERVICE_PRICING,
  calcLawnTotal,
  calcConsultationTotal,
} from '../constants/servicePricing.js'

/** GP Service catalog id → store templateId */
export { SERVICE_ID_TO_TEMPLATE }

export const TEMPLATE_TO_CATALOG_IDS = {
  septic: ['septic-pumping'],
  lawn: ['grass-mowing', 'lawn-trim', 'lawn-roll-prep', 'lawn-seeding', 'lawn-roll'],
  filter: ['filter-install', 'filter-maintenance', 'filter-cartridge'],
  irrigation: ['irrigation-tuning', 'irrigation-maintenance', 'irrigation-mount', 'pump-service'],
  landscape: ['landscape', 'lighting'],
  cleaning: [],
  rental: [],
}

export function templateForServiceId(serviceId) {
  return SERVICE_ID_TO_TEMPLATE[serviceId] || null
}

export function findStoreService(store, franchiseId, templateId) {
  if (!store?.services?.length || !franchiseId || !templateId) return null
  return store.services.find(
    (s) => s.franchiseId === franchiseId && s.templateId === templateId,
  ) || null
}

export function findStoreServiceByCatalogId(store, franchiseId, serviceId) {
  const templateId = templateForServiceId(serviceId)
  if (!templateId) return null
  return findStoreService(store, franchiseId, templateId)
}

/** Қала/франшиза бойынша қызмет белсенді ме */
export function isServiceActiveInCity(store, franchiseId, serviceId) {
  const svc = findStoreServiceByCatalogId(store, franchiseId, serviceId)
  if (!svc) return false
  return svc.active !== false
}

export function activeSubservices(storeService, lang = 'ru') {
  return (storeService?.subservices || []).filter((s) => s.active !== false)
}

/** Септик көлем опциялары — қаладан */
export function getSepticVolumeOptionsForCity(store, franchiseId, lang = 'ru') {
  const svc = findStoreService(store, franchiseId, 'septic')
  if (!svc || svc.active === false) return []

  const subs = activeSubservices(svc, lang)
  if (!subs.length) return []

  const mapping = [
    { key: '3', volumes: [3, 4], value: 4, match: (n) => /3|4/.test(n) },
    { key: '5', volumes: [5, 6, 7], value: 5, match: (n) => /5|6|7/.test(n) },
    { key: '10', volumes: [10], value: 10, match: (n) => /10/.test(n) },
  ]

  return mapping.map(({ volumes, value, match }) => {
    const sub = subs.find((s) => {
      const n = resolveLocalizedName(s, lang)
      return match(n) || match(s.name || '')
    })
    if (!sub) return null
    return {
      label: resolveLocalizedName(sub, lang),
      volumes,
      value,
      price: sub.price,
      commission: sub.gpCommission,
      subserviceId: sub.id,
    }
  }).filter(Boolean)
}

export function minPriceFromStoreService(storeService, lang = 'ru') {
  if (!storeService) return 0
  const subs = activeSubservices(storeService, lang)
  if (subs.length) {
    return Math.min(...subs.map((s) => Number(s.price) || 0))
  }
  return Number(storeService.basePrice) || 0
}

/** Кatalog элементіне қала бағасын қосу */
export function applyCityPricingToCatalogItem(catalogItem, store, franchiseId, lang = 'ru') {
  const svc = findStoreServiceByCatalogId(store, franchiseId, catalogItem.id)
  if (!svc || svc.active === false) return null

  const name = resolveLocalizedName(svc, lang) || catalogItem.name
  let priceFrom = catalogItem.priceFrom
  let priceNote = catalogItem.priceNote

  if (catalogItem.id === 'septic-pumping') {
    const opts = getSepticVolumeOptionsForCity(store, franchiseId, lang)
    if (opts.length) {
      priceFrom = Math.min(...opts.map((o) => o.price))
      priceNote = `от ${priceFrom.toLocaleString('ru-RU')} ₸`
    } else {
      priceFrom = svc.basePrice
    }
  } else if (LAWN_SERVICE_PRICING[catalogItem.id]) {
    const lawn = LAWN_SERVICE_PRICING[catalogItem.id]
    const minTotal = Math.max(lawn.minTotal, Number(svc.basePrice) || lawn.minTotal)
    priceFrom = minTotal
    priceNote = `${lawn.pricePerSqm.toLocaleString('ru-RU')} ₸/м² · мин. ${minTotal.toLocaleString('ru-RU')} ₸`
  } else if (CONSULTATION_SERVICE_IDS.has(catalogItem.id)) {
    priceFrom = Number(svc.basePrice) || CONSULTATION_FEE
    priceNote = `Выезд от ${priceFrom.toLocaleString('ru-RU')} ₸`
  } else if (catalogItem.id === 'filter-cartridge') {
    priceFrom = Number(svc.basePrice) || FILTER_CARTRIDGE_PRICE
  } else {
    priceFrom = Number(svc.basePrice) || priceFrom
  }

  return {
    ...catalogItem,
    name,
    priceFrom,
    priceNote,
    storeServiceId: svc.id,
    templateId: svc.templateId,
    cityId: svc.cityId,
    franchiseId: svc.franchiseId,
  }
}

/** Кatalog тізімін қала бойынша сүзу */
export function filterCatalogForCity(catalog, store, franchiseId, lang = 'ru') {
  if (!franchiseId || !store?.services?.length) return catalog
  return catalog
    .map((item) => applyCityPricingToCatalogItem(item, store, franchiseId, lang))
    .filter(Boolean)
}

/** Тапсырыс сомасы — қаладан */
export function calcCityServiceTotal({
  store,
  franchiseId,
  serviceId,
  septicVolume,
  lawnAreaSqm,
  lang = 'ru',
}) {
  const svc = findStoreServiceByCatalogId(store, franchiseId, serviceId)
  if (!svc || svc.active === false) return null

  if (serviceId === 'septic-pumping' && septicVolume) {
    const opts = getSepticVolumeOptionsForCity(store, franchiseId, lang)
    const v = Number(septicVolume)
    const opt = opts.find((o) => o.volumes?.includes(v) || o.value === v)
    if (opt) return opt.price
    const subs = activeSubservices(svc, lang)
    const fallback = subs[0]
    return fallback ? fallback.price : svc.basePrice
  }

  if (LAWN_SERVICE_PRICING[serviceId] && lawnAreaSqm) {
    const lawn = LAWN_SERVICE_PRICING[serviceId]
    const minTotal = Math.max(lawn.minTotal, Number(svc.basePrice) || lawn.minTotal)
    const raw = Math.round(Number(lawnAreaSqm) * lawn.pricePerSqm)
    return Math.max(minTotal, raw)
  }

  if (CONSULTATION_SERVICE_IDS.has(serviceId)) {
    return Number(svc.basePrice) || CONSULTATION_FEE
  }

  if (serviceId === 'filter-cartridge') {
    return Number(svc.basePrice) || FILTER_CARTRIDGE_PRICE
  }

  if (Number(svc.basePrice) > 0) return Number(svc.basePrice)
  return null
}

export function calcServiceTotalWithCity(params) {
  const { store, franchiseId, serviceId, septicVolume, lawnAreaSqm, lang = 'ru' } = params
  if (store && franchiseId && serviceId) {
    const cityTotal = calcCityServiceTotal({
      store, franchiseId, serviceId, septicVolume, lawnAreaSqm, lang,
    })
    if (cityTotal != null) return cityTotal
  }
  if (serviceId === 'septic-pumping' && septicVolume) {
    const opts = getSepticVolumeOptionsForCity(store, franchiseId, lang)
    const v = Number(septicVolume)
    const opt = opts.find((o) => o.volumes?.includes(v) || o.value === v)
    if (opt) return opt.price
  }
  if (LAWN_SERVICE_PRICING[serviceId] && lawnAreaSqm) {
    return calcLawnTotal(serviceId, lawnAreaSqm)
  }
  if (CONSULTATION_SERVICE_IDS.has(serviceId)) {
    return calcConsultationTotal(serviceId)
  }
  if (serviceId === 'filter-cartridge') return FILTER_CARTRIDGE_PRICE
  return 0
}
