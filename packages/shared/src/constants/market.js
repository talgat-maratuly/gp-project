/** GP Market — категории, статусы, единицы (готово под backend) */

export const MARKET_CATEGORIES = [
  { id: 'plants', labelKey: 'market_cat_plants' },
  { id: 'annuals', labelKey: 'market_cat_annuals' },
  { id: 'perennials', labelKey: 'market_cat_perennials' },
  { id: 'lawn', labelKey: 'market_cat_lawn' },
  { id: 'irrigation', labelKey: 'market_cat_irrigation' },
  { id: 'filters', labelKey: 'market_cat_filters' },
  { id: 'pumps', labelKey: 'market_cat_pumps' },
  { id: 'fertilizers', labelKey: 'market_cat_fertilizers' },
  { id: 'plant_protection', labelKey: 'market_cat_protection' },
  { id: 'garden_tools', labelKey: 'market_cat_tools' },
  { id: 'equipment_rental', labelKey: 'market_cat_rental' },
  { id: 'seedlings', labelKey: 'market_cat_seedlings' },
  { id: 'soil', labelKey: 'market_cat_soil' },
  { id: 'garden_decor', labelKey: 'market_cat_decor' },
  { id: 'hunter_irrigation', labelKey: 'market_cat_hunter' },
  { id: 'furniture', labelKey: 'market_cat_furniture' },
]

export const LINKED_SERVICE_TYPES = ['hunter_irrigation', 'furniture']

export const PRODUCT_UNITS = ['шт', 'кг', 'м²', 'комплект', 'мешок', 'литр']

export const PRODUCT_STATUSES = ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']

export const SHOP_STATUSES = ['ACTIVE', 'INACTIVE', 'BLOCKED']

export const MARKET_ORDER_STATUSES = [
  'NEW',
  'ACCEPTED',
  'PAID',
  'PACKING',
  'READY_FOR_PICKUP',
  'COURIER_ASSIGNED',
  'IN_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'PROBLEM',
]

export const PAYMENT_STATUSES = ['UNPAID', 'PAID', 'REFUND']

export const DELIVERY_TYPES = ['DELIVERY', 'PICKUP']

export const MARKET_PAYMENT_METHODS = [
  { id: 'kaspi_qr', labelKey: 'market_pay_kaspi' },
  { id: 'cash', labelKey: 'market_pay_cash' },
  { id: 'card', labelKey: 'market_pay_card' },
]

/** Следующий статус для партнёра (demo flow) */
export const PARTNER_MARKET_STATUS_FLOW = {
  NEW: 'ACCEPTED',
  ACCEPTED: 'PACKING',
  PACKING: 'READY_FOR_PICKUP',
  READY_FOR_PICKUP: 'IN_DELIVERY',
  COURIER_ASSIGNED: 'IN_DELIVERY',
  IN_DELIVERY: 'DELIVERED',
}

export function nextMarketStatus(current) {
  return PARTNER_MARKET_STATUS_FLOW[current] || null
}
