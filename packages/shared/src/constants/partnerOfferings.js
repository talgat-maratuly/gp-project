import { FURNITURE_EXECUTOR_GROUP } from './furnitureExecutor.js'

/**
 * Основные услуги и подуслуги для регистрации партнёра (два шага).
 * Идентификаторы подуслуг совпадают с каталогом GP Service и API Prisma.
 */
export const GP_SHOP_SUBSERVICE_ID = 'gp-shop'

export { FURNITURE_EXECUTOR_GROUP }

export const PARTNER_REGISTRATION_GROUPS = [
  {
    id: 'lawn',
    title: 'Газон',
    subs: [
      { id: 'lawn-roll-prep', label: 'Укладка рулонного газона + подготовка' },
      { id: 'lawn-seeding', label: 'Посев газона' },
      { id: 'lawn-roll', label: 'Укладка рулонного газона' },
      { id: 'lawn-trim', label: 'Стрижка газона' },
      { id: 'grass-mowing', label: 'Покос травы' },
    ],
  },
  {
    id: 'irrigation',
    title: 'Автополив',
    subs: [
      { id: 'irrigation-tuning', label: 'Настройка автополива' },
      { id: 'irrigation-maintenance', label: 'Ремонт / обслуживание автополива' },
      { id: 'irrigation-mount', label: 'Монтаж системы автополива' },
    ],
  },
  {
    id: 'water-filter',
    title: 'Фильтры',
    subs: [
      { id: 'filter-maintenance', label: 'Обслуживание фильтра' },
      { id: 'filter-cartridge', label: 'Замена картриджа' },
      { id: 'filter-install', label: 'Установка фильтра' },
    ],
  },
  {
    id: 'septic',
    title: 'Септик',
    subs: [{ id: 'septic-pumping', label: 'Откачка септика' }],
  },
  {
    id: 'equipment',
    title: 'Оборудование',
    subs: [{ id: 'pump-service', label: 'Обслуживание насосов' }],
  },
  {
    id: 'garden',
    title: 'Сад и участок',
    subs: [
      { id: 'landscape', label: 'Ландшафтный дизайн' },
      { id: 'lighting', label: 'Ландшафтная подсветка' },
    ],
  },
  {
    id: 'nursery',
    title: 'Питомник',
    subs: [{ id: 'gp-nursery', label: 'Работы питомника / растения' }],
  },
  {
    id: 'electrical',
    title: 'Электросети',
    subs: [
      { id: 'electrical-wiring', label: 'Прокладка / ремонт проводки' },
      { id: 'electrical-panel', label: 'Щитовое оборудование' },
    ],
  },
]

/** Направления, по которым партнёр получает заказы магазина (отдельная «подуслуга» gp-shop) */
export const SHOP_REGISTRATION_GROUP = {
  id: 'shop',
  title: 'Магазин товаров',
  subs: [{ id: GP_SHOP_SUBSERVICE_ID, label: 'Приём заказов из GP Shop' }],
}

export const PARTNER_OFFERING_STATUS_LABELS = {
  PENDING_MODERATION: 'На модерации',
  ACTIVE: 'Активна',
  TEMPORARILY_BLOCKED: 'Временно заблокирована',
  REJECTED: 'Отклонена',
}

export function getPartnerOfferingStatusLabel(status) {
  return PARTNER_OFFERING_STATUS_LABELS[status] || status
}

const ALL_SUB_LABELS = Object.fromEntries(
  [...PARTNER_REGISTRATION_GROUPS, FURNITURE_EXECUTOR_GROUP, SHOP_REGISTRATION_GROUP].flatMap((g) =>
    g.subs.map((s) => [s.id, s.label]),
  ),
)

/** Человекочитаемое имя подуслуги для профиля партнёра */
export function getPartnerSubserviceLabel(subserviceId) {
  return ALL_SUB_LABELS[subserviceId] || subserviceId
}
