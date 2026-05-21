export { CLIENT_ORDER_CATEGORIES as ORDER_CATEGORIES, getClientCategoryLabel as getOrderCategoryLabel } from './partnerDirections.js'

export const ORDER_STATUSES = [
  { id: 'new', label: 'Новая', color: '#94a3b8' },
  { id: 'accepted', label: 'Принят', color: '#3b82f6' },
  { id: 'on_way', label: 'Выехал', color: '#8b5cf6' },
  { id: 'on_site', label: 'У клиента', color: '#f59e0b' },
  { id: 'started', label: 'Откачка', color: '#06b6d4' },
  { id: 'loaded', label: 'Загружен', color: '#a855f7' },
  { id: 'disposal_arrived', label: 'На сливе', color: '#22c55e' },
  { id: 'disposal_completed', label: 'Слит', color: '#16a34a' },
  { id: 'done', label: 'Завершён', color: '#10b981' },
  { id: 'client_confirmed', label: 'Подтверждён', color: '#059669' },
  { id: 'cancelled', label: 'Отменён', color: '#ef4444' },
]

/** Сообщения для клиента */
export const CLIENT_STATUS_MESSAGES = {
  new: 'Ожидает принятия партнёром',
  accepted: 'Исполнитель принял заказ',
  on_way: 'Водитель выехал к вам',
  on_site: 'Водитель у адреса',
  started: 'Идёт откачка',
  loaded: 'Едет на официальный слив',
  disposal_arrived: 'На пункте слива',
  disposal_completed: 'Слив завершён',
  done: 'Рейс завершён — подтвердите',
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
/** Для септика после «Принять» статусы только по GPS */
export const PARTNER_ORDER_ACTIONS = {
  new: { action: 'accepted', label: 'Принять' },
  accepted: null,
  on_way: null,
  on_site: null,
  started: null,
  loaded: null,
  disposal_arrived: null,
  disposal_completed: null,
  done: null,
}

export const PARTNER_ORDER_ACTIONS_MANUAL = {
  new: { action: 'accepted', label: 'Принять' },
  accepted: { action: 'on_way', label: 'Выехал' },
  on_way: { action: 'on_site', label: 'На месте' },
  on_site: { action: 'started', label: 'Начал работу' },
  started: { action: 'done', label: 'Завершил' },
}

/** MVP: ручные кнопки статусов (в т.ч. септик); GPS-автоматизация — отдельно на backend */
export function getPartnerOrderAction(status, category) {
  void category
  return PARTNER_ORDER_ACTIONS_MANUAL[status] ?? null
}

/** @deprecated use PARTNER_ORDER_ACTIONS */
export const ORDER_STATUS_FLOW = PARTNER_ORDER_ACTIONS

export const getOrderStatusLabel = (id) => ORDER_STATUSES.find((s) => s.id === id)?.label || id
export const getOrderStatusMeta = (id) => ORDER_STATUSES.find((s) => s.id === id)
export const getClientStatusMessage = (id) => CLIENT_STATUS_MESSAGES[id] || getOrderStatusLabel(id)
export const getMapStatusText = (id) => MAP_STATUS_TEXT[id] || ''
