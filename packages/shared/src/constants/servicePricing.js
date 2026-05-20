/** Тарифы услуг GP (клиент) и комиссия GP (партнёр) */

export const GP_COMMISSION_LAWN = 1000
export const GP_COMMISSION_CONSULTATION = 1000
export const MIN_ORDER_LAWN = 15000
export const CONSULTATION_FEE = 2000

/** Замена картриджа — стартовая цена в заявке (уточняется мастером) */
export const FILTER_CARTRIDGE_PRICE = 6000

/** Газон: ₸/м², минимум заказа 15 000 ₸, комиссия GP 1 000 ₸ */
export const LAWN_SERVICE_PRICING = {
  'lawn-roll-prep': {
    label: 'Укладка рулонного газона + подготовка земли',
    pricePerSqm: 4200,
    minTotal: MIN_ORDER_LAWN,
    gpCommission: GP_COMMISSION_LAWN,
  },
  'lawn-seeding': {
    label: 'Посев газона',
    pricePerSqm: 2500,
    minTotal: MIN_ORDER_LAWN,
    gpCommission: GP_COMMISSION_LAWN,
  },
  'lawn-trim': {
    label: 'Стрижка газона',
    pricePerSqm: 50,
    minTotal: MIN_ORDER_LAWN,
    gpCommission: GP_COMMISSION_LAWN,
  },
  'grass-mowing': {
    label: 'Покос травы',
    pricePerSqm: 30,
    minTotal: MIN_ORDER_LAWN,
    gpCommission: GP_COMMISSION_LAWN,
  },
  'lawn-roll': {
    label: 'Укладка рулонного газона',
    pricePerSqm: 1200,
    minTotal: MIN_ORDER_LAWN,
    gpCommission: GP_COMMISSION_LAWN,
  },
}

export const LAWN_SERVICE_IDS = Object.keys(LAWN_SERVICE_PRICING)

/** Выезд специалиста: фикс в заявке; работы оплачиваются отдельно по договорённости */
export const CONSULTATION_SERVICE_IDS = new Set([
  'irrigation-tuning',
  'irrigation-maintenance',
  'irrigation-mount',
  'filter-maintenance',
  'filter-install',
])

export function calcLawnTotal(serviceId, areaSqm) {
  const p = LAWN_SERVICE_PRICING[serviceId]
  if (!p) return 0
  const area = Math.max(0, Number(areaSqm) || 0)
  return Math.max(p.minTotal, Math.round(area * p.pricePerSqm))
}

/** Цена откачки для клиента (комиссия GP — отдельно, по объёму) */
export function calcSepticPrice(cubicMeters) {
  const v = Number(cubicMeters) || 0
  if (v <= 4) return 6000
  if (v <= 7) return 8000
  return 10000
}

export function calcConsultationTotal(serviceId) {
  return CONSULTATION_SERVICE_IDS.has(serviceId) ? CONSULTATION_FEE : 0
}

export function calcServiceTotal({ serviceId, septicVolume, lawnAreaSqm }) {
  if (serviceId === 'septic-pumping' && septicVolume) {
    return calcSepticPrice(septicVolume)
  }
  if (LAWN_SERVICE_PRICING[serviceId] && lawnAreaSqm) {
    return calcLawnTotal(serviceId, lawnAreaSqm)
  }
  if (CONSULTATION_SERVICE_IDS.has(serviceId)) {
    return CONSULTATION_FEE
  }
  if (serviceId === 'filter-cartridge') {
    return FILTER_CARTRIDGE_PRICE
  }
  return 0
}
