/** Услуги GP Service (только для клиентов). GP Work — отдельный проект. */
import { CONSULTATION_FEE, FILTER_CARTRIDGE_PRICE, LAWN_SERVICE_PRICING, MIN_ORDER_LAWN } from '@gp/shared/constants'

/** Категория заявки для GP Partner */
export const SERVICE_ORDER_CATEGORY = {
  'irrigation-tuning': 'irrigation',
  'irrigation-maintenance': 'irrigation',
  'irrigation-mount': 'irrigation',
  'septic-pumping': 'septic',
  'grass-mowing': 'lawn',
  'lawn-trim': 'lawn',
  'lawn-roll-prep': 'lawn',
  'lawn-seeding': 'lawn',
  'lawn-roll': 'lawn',
  'filter-install': 'filters',
  'filter-maintenance': 'filters',
  'filter-cartridge': 'filters',
  'pump-service': 'pumps',
  'landscape': 'irrigation',
  'lighting': 'irrigation',
  'consultation': 'irrigation',
}

export const getServiceOrderCategory = (serviceId) => SERVICE_ORDER_CATEGORY[serviceId] || 'irrigation'

export const SERVICE_GROUPS = [
  {
    id: 'lawn',
    title: 'Газон',
    services: ['lawn-roll-prep', 'lawn-seeding', 'lawn-roll', 'lawn-trim', 'grass-mowing'],
  },
  {
    id: 'irrigation',
    title: 'Автополив',
    services: ['irrigation-tuning', 'irrigation-maintenance', 'irrigation-mount'],
  },
  {
    id: 'water-filter',
    title: 'Водяные фильтры',
    services: ['filter-maintenance', 'filter-cartridge', 'filter-install'],
  },
  { id: 'septic', title: 'Септик', services: ['septic-pumping'] },
  { id: 'equipment', title: 'Оборудование', services: ['pump-service'] },
  { id: 'garden', title: 'Сад и участок', services: ['landscape', 'lighting'] },
]

export const SERVICE_CATALOG = [
  {
    id: 'irrigation-tuning',
    name: 'Настройка автополива',
    priceFrom: CONSULTATION_FEE,
    priceNote: `Выезд от ${CONSULTATION_FEE.toLocaleString('ru-RU')} ₸ · работы по договорённости`,
    icon: 'Droplets',
    duration: '1–3 часа',
    description: `${CONSULTATION_FEE} ₸ за выезд. Регулировка программ, секторов, клапанов; согласование стоимости работ на месте.`,
  },
  {
    id: 'irrigation-maintenance',
    name: 'Ремонт / обслуживание автополива',
    priceFrom: CONSULTATION_FEE,
    priceNote: `Выезд от ${CONSULTATION_FEE.toLocaleString('ru-RU')} ₸ · оценка и ремонт по договорённости`,
    icon: 'Droplets',
    duration: 'по объёму',
    description: `${CONSULTATION_FEE} ₸ за выезд. Устранение протечек, замена форсунок, зимняя консервация и другое — цена после осмотра.`,
  },
  {
    id: 'irrigation-mount',
    name: 'Монтаж системы автополива',
    priceFrom: CONSULTATION_FEE,
    priceNote: `Проект и смета после выезда · выезд ${CONSULTATION_FEE.toLocaleString('ru-RU')} ₸`,
    icon: 'Droplets',
    duration: '1–5 дней',
    description: `${CONSULTATION_FEE} ₸ за первичный выезд. Проектирование и монтаж согласуются с мастером.`,
  },
  {
    id: 'septic-pumping',
    name: 'Откачка септика',
    priceFrom: 6000,
    priceNote: 'от 6 000 ₸ (3–4 м³)',
    icon: 'Truck',
    duration: '1–3 часа',
    description: '3–4 м³ — 6 000 ₸, 5–7 м³ — 8 000 ₸, 10 м³ — 10 000 ₸. Комиссия GP — по объёму.',
  },
  {
    id: 'lawn-roll-prep',
    name: 'Укладка рулонного газона + подготовка земли',
    priceFrom: MIN_ORDER_LAWN,
    priceNote: `4 200 ₸/м² · мин. ${MIN_ORDER_LAWN.toLocaleString('ru-RU')} ₸`,
    icon: 'Sprout',
    duration: '1–3 дня',
    description: 'Подготовка грунта и укладка рулонного газона. Комиссия GP — 1 000 ₸.',
  },
  {
    id: 'lawn-seeding',
    name: 'Посев газона',
    priceFrom: MIN_ORDER_LAWN,
    priceNote: `2 500 ₸/м² · мин. ${MIN_ORDER_LAWN.toLocaleString('ru-RU')} ₸`,
    icon: 'Sprout',
    duration: '1–2 дня',
    description: 'Посев семян. Комиссия GP — 1 000 ₸.',
  },
  {
    id: 'lawn-roll',
    name: 'Укладка рулонного газона',
    priceFrom: MIN_ORDER_LAWN,
    priceNote: `1 200 ₸/м² · мин. ${MIN_ORDER_LAWN.toLocaleString('ru-RU')} ₸`,
    icon: 'Sprout',
    duration: '1–2 дня',
    description: 'Только укладка рулона без подготовки. Комиссия GP — 1 000 ₸.',
  },
  {
    id: 'lawn-trim',
    name: 'Стрижка газона',
    priceFrom: MIN_ORDER_LAWN,
    priceNote: `50 ₸/м² · мин. ${MIN_ORDER_LAWN.toLocaleString('ru-RU')} ₸`,
    icon: 'Scissors',
    duration: '2–4 часа',
    description: 'Стрижка газона. Комиссия GP — 1 000 ₸.',
  },
  {
    id: 'grass-mowing',
    name: 'Покос травы',
    priceFrom: MIN_ORDER_LAWN,
    priceNote: `30 ₸/м² · мин. ${MIN_ORDER_LAWN.toLocaleString('ru-RU')} ₸`,
    icon: 'LandPlot',
    duration: '2–5 часов',
    description: 'Покос травы и бурьяна. Комиссия GP — 1 000 ₸.',
  },
  {
    id: 'filter-maintenance',
    name: 'Ремонт / обслуживание фильтра для воды',
    priceFrom: CONSULTATION_FEE,
    priceNote: `Выезд от ${CONSULTATION_FEE.toLocaleString('ru-RU')} ₸`,
    icon: 'Filter',
    duration: '1–3 часа',
    description: `${CONSULTATION_FEE} ₸ за выезд. Диагностика, обслуживание, ремонт узла — сумма по факту работ.`,
  },
  {
    id: 'filter-cartridge',
    name: 'Замена картриджа фильтра',
    priceFrom: FILTER_CARTRIDGE_PRICE,
    priceNote: `от ${FILTER_CARTRIDGE_PRICE.toLocaleString('ru-RU')} ₸`,
    icon: 'RefreshCw',
    duration: '30–60 мин',
    description: 'Замена картриджей или комплекта. Точная цена зависит от модели фильтра.',
  },
  {
    id: 'filter-install',
    name: 'Установка фильтра для воды',
    priceFrom: CONSULTATION_FEE,
    priceNote: `Выезд и подбор от ${CONSULTATION_FEE.toLocaleString('ru-RU')} ₸ · монтаж по смете`,
    icon: 'Filter',
    duration: '2–4 часа',
    description: `${CONSULTATION_FEE} ₸ за выезд. Подбор системы и стоимость установки согласуются на объекте.`,
  },
  {
    id: 'pump-service',
    name: 'Обслуживание насосов',
    priceFrom: 15000,
    icon: 'Gauge',
    duration: '1 день',
    description: 'Ремонт и настройка насосного оборудования.',
  },
  {
    id: 'landscape',
    name: 'Ландшафтный дизайн',
    priceFrom: 80000,
    icon: 'Trees',
    duration: 'по проекту',
    description: 'Проект и реализация ландшафта участка.',
  },
  {
    id: 'lighting',
    name: 'Ландшафтная подсветка',
    priceFrom: 35000,
    icon: 'Lightbulb',
    duration: '1–2 дня',
    description: 'Монтаж LED-подсветки дорожек и растений.',
  },
]

export const getServiceById = (id) => SERVICE_CATALOG.find((s) => s.id === id)

export function getLawnPricing(serviceId) {
  return LAWN_SERVICE_PRICING[serviceId] || null
}
