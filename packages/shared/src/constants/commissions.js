import {
  GP_COMMISSION_LAWN,
  GP_COMMISSION_CONSULTATION,
  LAWN_SERVICE_PRICING,
  CONSULTATION_SERVICE_IDS,
} from './servicePricing.js'

/** Комиссия GP за откачку септика (без изменений) */
export function calcSepticCommission(cubicMeters) {
  const v = Number(cubicMeters) || 0
  if (v <= 4) return 300
  if (v <= 5) return 300
  if (v <= 6) return 400
  if (v <= 9) return 500
  return 500
}

export function calcOrderCommission(order) {
  if (order.category === 'septic' && order.septicVolume) {
    return calcSepticCommission(order.septicVolume)
  }
  if (order.serviceId && LAWN_SERVICE_PRICING[order.serviceId]) {
    return GP_COMMISSION_LAWN
  }
  if (order.serviceId && CONSULTATION_SERVICE_IDS.has(order.serviceId)) {
    return GP_COMMISSION_CONSULTATION
  }
  if (order.serviceId === 'filter-cartridge') {
    return GP_COMMISSION_CONSULTATION
  }
  return 0
}
