/** Типы проектов GP Service (Hunter / Мебель) */

export const SERVICE_PROJECT_TYPES = {
  HUNTER_IRRIGATION: 'hunter_irrigation',
  FURNITURE: 'furniture',
}

export const SERVICE_PROJECT_STATUSES = [
  'draft',
  'submitted',
  'review',
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
]

export const HUNTER_WATER_SOURCES = [
  { id: 'city', labelKey: 'hunter_water_city' },
  { id: 'well', labelKey: 'hunter_water_well' },
  { id: 'tank', labelKey: 'hunter_water_tank' },
]

export const FURNITURE_MATERIALS = [
  { id: 'ldsp', labelKey: 'furniture_mat_ldsp', pricePerM2: 8500 },
  { id: 'mdf', labelKey: 'furniture_mat_mdf', pricePerM2: 12000 },
]

export const FURNITURE_FACADES = [
  { id: 'ldsp_facade', labelKey: 'furniture_facade_ldsp', pricePerM2: 9500 },
  { id: 'mdf_facade', labelKey: 'furniture_facade_mdf', pricePerM2: 14000 },
]

export const FURNITURE_COLORS = [
  { id: 'white', labelKey: 'furniture_color_white' },
  { id: 'oak', labelKey: 'furniture_color_oak' },
  { id: 'walnut', labelKey: 'furniture_color_walnut' },
  { id: 'grey', labelKey: 'furniture_color_grey' },
]
