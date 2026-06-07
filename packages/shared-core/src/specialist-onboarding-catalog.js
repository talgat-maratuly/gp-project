/** GP Service — specialist onboarding catalog (mobile + API) */

import { SUBSERVICE_TO_DIRECTION } from './partner-offerings-catalog.js'

export const MAIN_SERVICES = [
  { id: 'SEPTIC', category: 'SEPTIC', label: 'Септик', requiresVehicle: true, requiresWorkTools: false },
  { id: 'LAWN', category: 'LAWN', label: 'Газон', requiresVehicle: false, requiresWorkTools: true },
  {
    id: 'AUTOWATERING',
    category: 'AUTOWATERING',
    label: 'Автополив',
    requiresVehicle: false,
    requiresWorkTools: true,
  },
  { id: 'FILTERS', category: 'FILTERS', label: 'Фильтры воды', requiresVehicle: false, requiresWorkTools: true },
  { id: 'OTHER', category: 'PUMPS', label: 'Другое', requiresVehicle: false, requiresWorkTools: true },
]

export const SUBSERVICES_BY_MAIN = {
  SEPTIC: [{ id: 'septic-pumping', label: 'Откачка септика' }],
  LAWN: [
    { id: 'grass-mowing', label: 'Скашивание газона' },
    { id: 'lawn-trim', label: 'Стрижка газона' },
    { id: 'lawn-seeding', label: 'Посев газона' },
    { id: 'lawn-roll-prep', label: 'Подготовка под рулонный газон' },
    { id: 'lawn-roll', label: 'Укладка рулонного газона' },
  ],
  AUTOWATERING: [
    { id: 'irrigation-mount', label: 'Монтаж автополива' },
    { id: 'irrigation-maintenance', label: 'Настройка / ремонт' },
    { id: 'irrigation-tuning', label: 'Обслуживание' },
  ],
  FILTERS: [
    { id: 'filter-install', label: 'Установка фильтра' },
    { id: 'filter-cartridge', label: 'Замена картриджа' },
    { id: 'filter-maintenance', label: 'Ремонт / обслуживание' },
  ],
  OTHER: [{ id: 'pump-service', label: 'Обслуживание насосов' }],
}

export const REJECTION_REASON_CODES = {
  DOCUMENTS_UNCLEAR: 'Documents unclear',
  MISSING_PHOTOS: 'Missing photos',
  INCORRECT_INFORMATION: 'Incorrect information',
  VEHICLE_NOT_SUITABLE: 'Vehicle not suitable',
  OTHER: 'Other',
}

export function subservicesForMain(mainServiceId) {
  return SUBSERVICES_BY_MAIN[mainServiceId] ?? []
}

export function validateSubservicesForMain(mainServiceId, subserviceIds) {
  const allowed = new Set(subservicesForMain(mainServiceId).map((s) => s.id))
  const invalid = subserviceIds.filter((id) => !allowed.has(id))
  return { valid: invalid.length === 0, invalid, allowed: [...allowed] }
}

export function mainServiceRequiresVehicle(mainServiceId) {
  return MAIN_SERVICES.find((m) => m.id === mainServiceId)?.requiresVehicle ?? false
}

export function mainServiceRequiresWorkTools(mainServiceId) {
  return MAIN_SERVICES.find((m) => m.id === mainServiceId)?.requiresWorkTools ?? false
}

export { SUBSERVICE_TO_DIRECTION }
