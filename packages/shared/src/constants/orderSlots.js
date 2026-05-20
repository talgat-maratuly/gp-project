import { calcSepticCommission } from './commissions.js'
import { calcSepticPrice } from './servicePricing.js'

/** Слоты времени для заявок (септик, газон, автополив) */
export const PREFERRED_TIME_SLOTS = [
  { id: '09:00', label: '09:00' },
  { id: '11:00', label: '11:00' },
  { id: '13:00', label: '13:00' },
  { id: '15:00', label: '15:00' },
  { id: '17:00', label: '17:00' },
]

export const SEPTIC_VOLUME_OPTIONS = [
  {
    label: '3–4 м³',
    volumes: [3, 4],
    value: 4,
    price: calcSepticPrice(4),
    commission: calcSepticCommission(4),
  },
  {
    label: '5–7 м³',
    volumes: [5, 6, 7],
    value: 5,
    price: calcSepticPrice(5),
    commission: calcSepticCommission(5),
  },
  {
    label: '10 м³',
    volumes: [10],
    value: 10,
    price: calcSepticPrice(10),
    commission: calcSepticCommission(10),
  },
]

/** @deprecated Используйте serviceId в каталоге услуг */
export const LAWN_WORK_TYPES = [
  { id: 'MOWING', label: 'Стрижка' },
  { id: 'CARE', label: 'Уход' },
  { id: 'CLEANUP', label: 'Покос / уборка' },
]

export const formatOrderSchedule = (order) => {
  if (!order) return ''
  if (order.flexibleTime) return 'Любое свободное время'
  const date = order.preferredDate
    ? new Date(order.preferredDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    : ''
  const time = order.preferredTime || ''
  return [date, time].filter(Boolean).join(' · ')
}
