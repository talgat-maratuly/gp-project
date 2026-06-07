/** GPS / geofencing — септик (Yandex Go style) */

export const SEPTIC_GPS_STATUSES = [
  'accepted',
  'on_way',
  'on_site',
  'pumping',
  'loaded',
  'disposal_arrived',
  'disposal_completed',
  'completed',
]

export const ORDER_STATUS_TO_UI_GPS = {
  NEW: 'new',
  ACCEPTED: 'accepted',
  ON_WAY: 'on_way',
  IN_PROCESS: 'in_process',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  CANCELED_BY_CLIENT: 'canceled_by_client',
  CANCELED_BY_SPEC: 'canceled_by_spec',
  NO_SHOW: 'no_show',
}

/** Под-статус септик-рейса (приходит в realtime как septicStageUi) → текст клиенту */
export const CLIENT_GPS_MESSAGES = {
  accepted: 'Исполнитель принял заказ',
  on_way: 'Водитель выехал к вам',
  on_site: 'Водитель у вашего адреса',
  pumping: 'Началась откачка',
  loaded: 'Машина загружена, едет на слив',
  disposal_arrived: 'На официальном сливе',
  disposal_completed: 'Слив завершён официально',
  completed: 'Рейс завершён — подтвердите выполнение',
  illegal: '⚠ Подозрительная выгрузка вне слива',
}

export const GEOFENCE_COLORS = {
  official: '#22c55e',
  illegal: '#ef4444',
  client: '#3b82f6',
  executor: '#8b5cf6',
}

/** Официальные сливы Уральска (fallback если API пуст) */
export const URALSK_DISPOSAL_ZONES = [
  { id: 'dz1', name: 'Слив №1 — ЖМ Астана', lat: 51.248, lng: 51.385, radiusM: 120 },
  { id: 'dz2', name: 'Слив №2 — Промузон', lat: 51.215, lng: 51.412, radiusM: 120 },
  { id: 'dz3', name: 'Слив №3 — Зачагалка', lat: 51.262, lng: 51.335, radiusM: 120 },
  { id: 'dz4', name: 'Слив №4 — Северный', lat: 51.278, lng: 51.398, radiusM: 120 },
]
