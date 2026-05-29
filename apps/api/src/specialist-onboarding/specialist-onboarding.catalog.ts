import { OrderCategory } from '@prisma/client';

export type MainServiceId = 'SEPTIC' | 'LAWN' | 'AUTOWATERING' | 'FILTERS' | 'OTHER';

export const MAIN_SERVICE_TO_CATEGORY: Record<MainServiceId, OrderCategory> = {
  SEPTIC: OrderCategory.SEPTIC,
  LAWN: OrderCategory.LAWN,
  AUTOWATERING: OrderCategory.AUTOWATERING,
  FILTERS: OrderCategory.FILTERS,
  OTHER: OrderCategory.PUMPS,
};

export const ONBOARDING_CATALOG = {
  mainServices: [
    { id: 'SEPTIC' as const, label: 'Септик', requiresVehicle: true, requiresWorkTools: false },
    { id: 'LAWN' as const, label: 'Газон', requiresVehicle: false, requiresWorkTools: true },
    { id: 'AUTOWATERING' as const, label: 'Автополив', requiresVehicle: false, requiresWorkTools: true },
    { id: 'FILTERS' as const, label: 'Фильтры', requiresWorkTools: true, requiresVehicle: false },
    { id: 'OTHER' as const, label: 'Другое', requiresVehicle: false, requiresWorkTools: true },
  ],
  subservicesByMain: {
    SEPTIC: [{ id: 'septic-pumping', label: 'Откачка септика' }],
    LAWN: [
      { id: 'grass-mowing', label: 'Скашивание газона' },
      { id: 'lawn-trim', label: 'Стрижка газона' },
      { id: 'lawn-seeding', label: 'Посев газона' },
      { id: 'lawn-roll-prep', label: 'Подготовка под рулонный газон' },
      { id: 'lawn-roll', label: 'Укладка рулонного газона' },
    ],
    AUTOWATERING: [
      { id: 'irrigation-mount', label: 'Монтаж' },
      { id: 'irrigation-maintenance', label: 'Настройка / ремонт' },
      { id: 'irrigation-tuning', label: 'Обслуживание' },
    ],
    FILTERS: [
      { id: 'filter-install', label: 'Установка' },
      { id: 'filter-cartridge', label: 'Замена картриджа' },
      { id: 'filter-maintenance', label: 'Ремонт' },
    ],
    OTHER: [{ id: 'pump-service', label: 'Насосы' }],
  },
  rejectionReasons: [
    { code: 'DOCUMENTS_UNCLEAR', label: 'Documents unclear' },
    { code: 'MISSING_PHOTOS', label: 'Missing photos' },
    { code: 'INCORRECT_INFORMATION', label: 'Incorrect information' },
    { code: 'VEHICLE_NOT_SUITABLE', label: 'Vehicle not suitable' },
    { code: 'OTHER', label: 'Other' },
  ],
  submittedUi: {
    title: 'Application Submitted',
    body: 'Your application has been sent for moderation.\nYou will receive the result in the application.',
  },
};

export function subservicesForMain(mainId: MainServiceId) {
  return ONBOARDING_CATALOG.subservicesByMain[mainId] ?? [];
}
