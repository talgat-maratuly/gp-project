/** Мебельные исполнители — 3 направления GP Partner / GP Service */

export const FURNITURE_EXECUTOR_TYPES = [
  'furniture_manufacturing',
  'furniture_assembly',
  'furniture_repair',
]

export const FURNITURE_EXECUTOR_LABELS = {
  furniture_manufacturing: 'Изготовление мебели',
  furniture_assembly: 'Сборка мебели',
  furniture_repair: 'Ремонт мебели',
}

/** Внутренний исполнитель, пока партнёр не принял заявку */
export const GP_INTERNAL_EXECUTOR_ID = 'gp-internal-executor'
export const GP_INTERNAL_EXECUTOR_NAME = 'GP Service internal executor'

export const FURNITURE_EXECUTOR_ROUTE = {
  furniture_manufacturing: '/orders/furniture-manufacturing',
  furniture_assembly: '/orders/furniture-assembly',
  furniture_repair: '/orders/furniture-repair',
}

/** GP Service serviceId → serviceType исполнителя */
export const SERVICE_ID_TO_FURNITURE_TYPE = {
  'furniture-manufacturing': 'furniture_manufacturing',
  'furniture-assembly': 'furniture_assembly',
  'furniture-repair': 'furniture_repair',
}

/** Проект мебели на заказ → изготовление */
export const FURNITURE_PROJECT_SERVICE_TYPE = 'furniture_manufacturing'

export const FURNITURE_EXECUTOR_GROUP = {
  id: 'furniture-executor',
  title: 'Мебельные исполнители',
  subs: FURNITURE_EXECUTOR_TYPES.map((id) => ({
    id,
    label: FURNITURE_EXECUTOR_LABELS[id],
  })),
}

export function isFurnitureExecutorAccess(id) {
  return FURNITURE_EXECUTOR_TYPES.includes(id)
}

export function partnerHasFurnitureAccess(serviceAccess, serviceType) {
  const access = serviceAccess || []
  return access.includes(serviceType)
}
