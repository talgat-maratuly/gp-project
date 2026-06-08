import { OrderCategory } from '@prisma/client';

export type MainServiceId =
  | 'SEPTIC'
  | 'LAWN'
  | 'AUTOWATERING'
  | 'FILTERS'
  | 'OTHER'
  | 'LANDSCAPE';

export const MAIN_SERVICE_TO_CATEGORY: Record<MainServiceId, OrderCategory> = {
  SEPTIC: OrderCategory.SEPTIC,
  LAWN: OrderCategory.LAWN,
  AUTOWATERING: OrderCategory.AUTOWATERING,
  FILTERS: OrderCategory.FILTERS,
  OTHER: OrderCategory.PUMPS,
  LANDSCAPE: OrderCategory.AUTOWATERING,
};

export const ONBOARDING_CATALOG = {
  mainServices: [
    { id: 'SEPTIC' as const, label: 'Септик', requiresVehicle: true, requiresWorkTools: false },
    { id: 'LAWN' as const, label: 'Газон', requiresVehicle: false, requiresWorkTools: true },
    { id: 'AUTOWATERING' as const, label: 'Автополив', requiresVehicle: false, requiresWorkTools: true },
    { id: 'FILTERS' as const, label: 'Фильтры', requiresWorkTools: true, requiresVehicle: false },
    { id: 'OTHER' as const, label: 'Оборудование', requiresVehicle: false, requiresWorkTools: true },
    { id: 'LANDSCAPE' as const, label: 'Сад и участок', requiresVehicle: false, requiresWorkTools: true },
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
    LANDSCAPE: [
      { id: 'landscape', label: 'Ландшафтный дизайн' },
      { id: 'lighting', label: 'Ландшафтная подсветка' },
    ],
  },
  rejectionReasons: [
    { code: 'DOCUMENTS_UNCLEAR', label: 'Документы плохо читаются' },
    { code: 'MISSING_PHOTOS', label: 'Не хватает фотографий' },
    { code: 'INCORRECT_INFORMATION', label: 'Некорректные данные' },
    { code: 'VEHICLE_NOT_SUITABLE', label: 'Транспорт не подходит' },
    { code: 'OTHER', label: 'Другая причина' },
  ],
  submittedUi: {
    title: 'Заявка отправлена',
    body: 'Заявка отправлена на модерацию.\nРезультат появится в приложении.',
  },
};

export function subservicesForMain(mainId: MainServiceId) {
  return ONBOARDING_CATALOG.subservicesByMain[mainId] ?? [];
}
