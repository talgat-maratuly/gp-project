/** Способы оплаты (Казахстан) */
export const PAYMENT_METHODS = [
  { id: 'kaspi', label: 'Kaspi', shortLabel: 'Kaspi', color: '#f14635', online: true },
  { id: 'halyk', label: 'Halyk Bank', shortLabel: 'Halyk', color: '#00805f', online: true },
  { id: 'forte', label: 'ForteBank', shortLabel: 'Forte', color: '#7b2d8e', online: true },
  { id: 'card', label: 'Банковская карта', shortLabel: 'Карта', color: '#2563eb', online: true },
  { id: 'transfer', label: 'Банковский перевод', shortLabel: 'Перевод', color: '#475569', online: false },
  { id: 'cash', label: 'При получении', shortLabel: 'Наличные', color: '#16a34a', online: false },
]

export const ONLINE_PAYMENT_IDS = PAYMENT_METHODS.filter((m) => m.online).map((m) => m.id)

export const getPaymentMethod = (id) => PAYMENT_METHODS.find((m) => m.id === id)

export const getPaymentMethodLabel = (id) => getPaymentMethod(id)?.label || id

export const isOnlinePayment = (id) => ONLINE_PAYMENT_IDS.includes(id)
