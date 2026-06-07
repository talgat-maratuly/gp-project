export { CLIENT_ORDER_CATEGORIES as ORDER_CATEGORIES, getClientCategoryLabel as getOrderCategoryLabel } from './partnerDirections.js'

/** Основные статусы заказа (канон спецификации lifecycle) */
export const ORDER_STATUSES = [
  { id: 'new', label: 'Новая', color: '#94a3b8' },
  { id: 'accepted', label: 'Принят', color: '#3b82f6' },
  { id: 'on_way', label: 'В пути', color: '#8b5cf6' },
  { id: 'in_process', label: 'В работе', color: '#06b6d4' },
  { id: 'completed', label: 'Выполнен', color: '#10b981' },
  { id: 'expired', label: 'Истёк', color: '#64748b' },
  { id: 'canceled_by_client', label: 'Отменён клиентом', color: '#ef4444' },
  { id: 'canceled_by_spec', label: 'Отменён исполнителем', color: '#f97316' },
  { id: 'no_show', label: 'Неявка', color: '#dc2626' },
]

/** Под-статусы септик-рейса (детализация in_process / on_way по GPS) */
export const SEPTIC_STAGE_STATUSES = [
  { id: 'on_site', label: 'У клиента', color: '#f59e0b' },
  { id: 'pumping', label: 'Откачка', color: '#06b6d4' },
  { id: 'loaded', label: 'Загружен', color: '#a855f7' },
  { id: 'disposal_arrived', label: 'На сливе', color: '#22c55e' },
  { id: 'disposal_completed', label: 'Слит', color: '#16a34a' },
]

/** Терминальные статусы — действия со статусом запрещены */
export const TERMINAL_STATUSES = ['completed', 'expired', 'canceled_by_client', 'canceled_by_spec', 'no_show']

/** Статусы, на которых клиент может отменить заказ */
export const CLIENT_CANCELABLE_STATUSES = ['new', 'accepted', 'on_way', 'in_process']

export const isTerminalStatus = (status) => TERMINAL_STATUSES.includes(status)
export const isClientCancelable = (status) => CLIENT_CANCELABLE_STATUSES.includes(status)

/** Сообщения для клиента */
export const CLIENT_STATUS_MESSAGES = {
  new: 'Ожидает принятия специалистом',
  accepted: 'Специалист принял заказ',
  on_way: 'Специалист в пути к вам',
  in_process: 'Идёт работа',
  completed: 'Заказ выполнен — подтвердите',
  expired: 'Никто не принял заказ. Перенесите время или создайте новую заявку.',
  canceled_by_client: 'Вы отменили заказ',
  canceled_by_spec: 'Специалист отменил заказ',
  no_show: 'Специалист не приехал',
}

/** Текст на карте */
export const MAP_STATUS_TEXT = {
  accepted: 'Заказ принят',
  on_way: 'Специалист едет',
  in_process: 'Работа идёт',
  completed: 'Работа завершена',
}

/**
 * Главный CTA для клиента по статусу (UX-правило: никаких тупиков).
 * action — что должен сделать фронтенд: recreate | confirm | cancel | support
 */
export const CLIENT_STATUS_CTA = {
  completed: { action: 'confirm', label: 'Подтвердить выполнение' },
  expired: { action: 'recreate', label: 'Создать заявку заново' },
  no_show: { action: 'recreate', label: 'Выбрать другого специалиста' },
  canceled_by_spec: { action: 'recreate', label: 'Перенести заявку' },
  canceled_by_client: { action: 'recreate', label: 'Создать заявку заново' },
}

export const getClientStatusCta = (status, { clientConfirmed } = {}) => {
  if (status === 'completed' && clientConfirmed) return { action: 'support', label: 'Связаться с поддержкой' }
  return CLIENT_STATUS_CTA[status] || null
}

/** Кнопки партнёра по текущему статусу (септик после «Принять» — только GPS) */
export const PARTNER_ORDER_ACTIONS = {
  new: { action: 'accepted', label: 'Принять' },
  accepted: null,
  on_way: null,
  in_process: null,
}

export const PARTNER_ORDER_ACTIONS_MANUAL = {
  new: { action: 'accepted', label: 'Принять' },
  accepted: { action: 'on_way', label: 'Выехал' },
  on_way: { action: 'in_process', label: 'Начал работу' },
  in_process: { action: 'completed', label: 'Завершил' },
}

/** MVP: ручные кнопки статусов (в т.ч. септик); GPS-автоматизация — отдельно на backend */
export function getPartnerOrderAction(status, category) {
  void category
  return PARTNER_ORDER_ACTIONS_MANUAL[status] ?? null
}

/** @deprecated use PARTNER_ORDER_ACTIONS */
export const ORDER_STATUS_FLOW = PARTNER_ORDER_ACTIONS

const ALL_STATUS_META = [...ORDER_STATUSES, ...SEPTIC_STAGE_STATUSES]
export const getOrderStatusLabel = (id) => ALL_STATUS_META.find((s) => s.id === id)?.label || id
export const getOrderStatusMeta = (id) => ALL_STATUS_META.find((s) => s.id === id)
export const getClientStatusMessage = (id) => CLIENT_STATUS_MESSAGES[id] || getOrderStatusLabel(id)
export const getMapStatusText = (id) => MAP_STATUS_TEXT[id] || ''
