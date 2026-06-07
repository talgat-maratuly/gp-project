import { SHOP_MAIN_GROUP_IDS } from './partnerRole.js'

/** Типы партнёров GP — единая модерация */

export const PARTNER_TYPES = [
  { id: 'SEPTIC_SERVICE', labelKey: 'partner_type_septic' },
  { id: 'LAWN_MOWING', labelKey: 'partner_type_lawn' },
  { id: 'IRRIGATION_SERVICE', labelKey: 'partner_type_irrigation' },
  { id: 'CLEANING_SERVICE', labelKey: 'partner_type_cleaning' },
  { id: 'SHOP', labelKey: 'partner_type_shop' },
  { id: 'NURSERY', labelKey: 'partner_type_nursery' },
  { id: 'SPECIALIST', labelKey: 'partner_type_specialist' },
  { id: 'DELIVERY', labelKey: 'partner_type_delivery' },
  { id: 'OTHER', labelKey: 'partner_type_other' },
]

export const PARTNER_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'NEEDS_REVISION',
  'APPROVED',
  'REJECTED',
  'SUSPENDED',
]

const GROUP_TO_TYPE = {
  septic: 'SEPTIC_SERVICE',
  lawn: 'LAWN_MOWING',
  irrigation: 'IRRIGATION_SERVICE',
  cleaning: 'CLEANING_SERVICE',
  shop: 'SHOP',
  nursery: 'NURSERY',
  furniture: 'SPECIALIST',
  filters: 'SPECIALIST',
  pumps: 'SPECIALIST',
  landscape: 'SPECIALIST',
  electrical: 'SPECIALIST',
  delivery: 'DELIVERY',
}

export function resolvePartnerTypeFromGroups(mainGroupIds) {
  if (mainGroupIds.length === 1 && mainGroupIds[0] === 'nursery') return 'NURSERY'
  if (mainGroupIds.length === 1 && mainGroupIds[0] === 'delivery') return 'DELIVERY'
  const shopOnly =
    mainGroupIds.length > 0 && mainGroupIds.every((id) => SHOP_MAIN_GROUP_IDS.has(id))
  if (shopOnly) return 'SHOP'
  for (const id of mainGroupIds) {
    if (SHOP_MAIN_GROUP_IDS.has(id)) continue
    const t = GROUP_TO_TYPE[id]
    if (t && t !== 'SHOP') return t
  }
  return 'OTHER'
}

export const PARTNER_STATUS_LABELS = {
  DRAFT: 'Черновик',
  PENDING_REVIEW: 'Ожидает проверки',
  NEEDS_REVISION: 'На доработке',
  APPROVED: 'Подтверждён',
  REJECTED: 'Отклонён',
  SUSPENDED: 'Заблокирован',
}
