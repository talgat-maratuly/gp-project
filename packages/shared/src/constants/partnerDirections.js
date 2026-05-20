/** Направления партнёра (можно выбрать несколько) */
export const PARTNER_DIRECTIONS = [
  { id: 'septic', label: 'Септик / ассенизатор' },
  { id: 'lawn', label: 'Газон / стрижка' },
  { id: 'irrigation', label: 'Автополив' },
  { id: 'pumps', label: 'Насосы' },
  { id: 'filters', label: 'Фильтры' },
  { id: 'nursery', label: 'Питомник' },
  { id: 'shop', label: 'Магазин товаров' },
  { id: 'landscape', label: 'Ландшафтные работы' },
  { id: 'electrical', label: 'Электросети' },
]

/** Категории заказа от клиента (marketplace) */
export const CLIENT_ORDER_CATEGORIES = [
  { id: 'septic', label: 'Септик' },
  { id: 'lawn', label: 'Газон' },
  { id: 'irrigation', label: 'Автополив' },
  { id: 'pumps', label: 'Насос' },
  { id: 'filters', label: 'Фильтр' },
  { id: 'shop', label: 'Товар из магазина' },
  { id: 'electrical', label: 'Электросети' },
]

const API_DIR_TO_UI = {
  SEPTIC: 'septic',
  LAWN: 'lawn',
  AUTOWATERING: 'irrigation',
  PUMPS: 'pumps',
  FILTERS: 'filters',
  NURSERY: 'nursery',
  SHOP: 'shop',
  LANDSCAPE: 'landscape',
  ELECTRICAL: 'electrical',
}

export const getPartnerDirectionLabel = (id) => {
  const ui = API_DIR_TO_UI[id] || id
  return PARTNER_DIRECTIONS.find((d) => d.id === ui)?.label || id
}
export const getClientCategoryLabel = (id) => CLIENT_ORDER_CATEGORIES.find((c) => c.id === id)?.label || id
