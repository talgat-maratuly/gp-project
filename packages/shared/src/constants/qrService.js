/** QR Service / QR Order — типы объектов и услуг */

export const QR_OBJECT_TYPES = [
  'filter',
  'irrigation',
  'furniture',
  'septic',
  'lawn',
  'flowerbed',
  'equipment',
  'other',
]

export const QR_SERVICE_TYPES = [
  'filter_replacement',
  'irrigation_service',
  'furniture_repair',
  'furniture_assembly',
  'septic_pumping',
  'lawn_care',
  'flowerbed_care',
  'equipment_repair',
  'other_service',
]

export const QR_OBJECT_STATUS = ['active', 'inactive', 'archived']

export const QR_ORDER_STATUS = [
  'new',
  'assigned',
  'accepted',
  'on_the_way',
  'in_progress',
  'completed',
  'cancelled',
]

export const QR_OBJECT_TYPE_LABELS = {
  filter: 'Фильтр воды',
  irrigation: 'Автополив',
  furniture: 'Мебель',
  septic: 'Септик',
  lawn: 'Газон',
  flowerbed: 'Клумба',
  equipment: 'Оборудование',
  other: 'Объект',
}

export const QR_SERVICE_TYPE_LABELS = {
  filter_replacement: 'Замена фильтра',
  irrigation_service: 'Обслуживание автополива',
  furniture_manufacturing: 'Изготовление мебели',
  furniture_repair: 'Ремонт мебели',
  furniture_assembly: 'Сборка мебели',
  septic_pumping: 'Откачка септика',
  lawn_care: 'Уход за газоном',
  flowerbed_care: 'Уход за клумбой',
  equipment_repair: 'Ремонт оборудования',
  other_service: 'Другое обслуживание',
}

export const QR_ORDER_STATUS_LABELS = {
  new: 'Новая',
  assigned: 'Назначена',
  accepted: 'Принята',
  on_the_way: 'В пути',
  in_progress: 'В работе',
  completed: 'Выполнена',
  cancelled: 'Отменена',
}

/** Маппинг serviceType → templateId услуги в demo store */
export const QR_SERVICE_TO_TEMPLATE = {
  filter_replacement: 'filter',
  irrigation_service: 'irrigation',
  furniture_repair: 'cleaning',
  furniture_assembly: 'cleaning',
  septic_pumping: 'septic',
  lawn_care: 'lawn',
  flowerbed_care: 'landscape',
  equipment_repair: 'rental',
  other_service: 'cleaning',
}

export const GP_SUPPORT_PHONE = '+77012236262'
export const GP_WHATSAPP_PHONE = '77012236262'
