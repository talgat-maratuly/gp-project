export { CLIENT_ORDER_CATEGORIES as ORDER_CATEGORIES, getClientCategoryLabel as getOrderCategoryLabel } from './partnerDirections.js'

export const ORDER_STATUSES = [
  { id: 'new', label: 'Новая', color: '#94a3b8' },
  { id: 'accepted', label: 'Принят', color: '#3b82f6' },
  { id: 'on_way', label: 'Выехал', color: '#8b5cf6' },
  { id: 'on_site', label: 'На месте', color: '#f59e0b' },
  { id: 'started', label: 'Работа началась', color: '#06b6d4' },
  { id: 'done', label: 'Завершён', color: '#10b981' },
  { id: 'client_confirmed', label: 'Подтверждён клиентом', color: '#059669' },
  { id: 'cancelled', label: 'Отменён', color: '#ef4444' },
]

/** Сообщения для клиента */
export const CLIENT_STATUS_MESSAGES = {
  new: 'Ожидает принятия партнёром',
  accepted: 'Заказ принят',
  on_way: 'Исполнитель выехал',
  on_site: 'Исполнитель на месте',
  started: 'Работа началась',
  done: 'Работа завершена — подтвердите выполнение',
  client_confirmed: 'Выполнение подтверждено',
  cancelled: 'Заказ отменён',
}

/** Текст на карте */
export const MAP_STATUS_TEXT = {
  accepted: 'Заказ принят',
  on_way: 'Исполнитель едет',
  on_site: 'На месте',
  started: 'Работа началась',
  done: 'Работа завершена',
}

/** Кнопки партнёра по текущему статусу */
export const PARTNER_ORDER_ACTIONS = {
  new: { action: 'accepted', label: 'Принять' },
  accepted: { action: 'on_way', label: 'Выехал' },
  on_way: { action: 'on_site', label: 'На месте' },
  on_site: { action: 'started', label: 'Начал работу' },
  started: { action: 'done', label: 'Завершил' },
}

/** @deprecated use PARTNER_ORDER_ACTIONS */
export const ORDER_STATUS_FLOW = PARTNER_ORDER_ACTIONS

export const getOrderStatusLabel = (id) => ORDER_STATUSES.find((s) => s.id === id)?.label || id
export const getOrderStatusMeta = (id) => ORDER_STATUSES.find((s) => s.id === id)
export const getClientStatusMessage = (id) => CLIENT_STATUS_MESSAGES[id] || getOrderStatusLabel(id)
export const getMapStatusText = (id) => MAP_STATUS_TEXT[id] || ''
