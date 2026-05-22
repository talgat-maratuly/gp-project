import { OrderCategory, PartnerDirection } from '@prisma/client';
import { categoryMatchesDirection } from './commission.util';
import { isFurnitureExecutorAccessId } from './furniture-executor.util';

/** Синтетический идентификатор подуслуги для заказов категории SHOP (магазин) */
export const GP_SHOP_SUBSERVICE_ID = 'gp-shop';

/**
 * Карта подуслуги → направление партнёра. Должна совпадать с каталогом GP Service / GP Partner.
 */
export const SUBSERVICE_TO_DIRECTION: Record<string, PartnerDirection> = {
  [GP_SHOP_SUBSERVICE_ID]: PartnerDirection.SHOP,
  'gp-nursery': PartnerDirection.NURSERY,
  'septic-pumping': PartnerDirection.SEPTIC,
  'grass-mowing': PartnerDirection.LAWN,
  'lawn-trim': PartnerDirection.LAWN,
  'lawn-roll-prep': PartnerDirection.LAWN,
  'lawn-seeding': PartnerDirection.LAWN,
  'lawn-roll': PartnerDirection.LAWN,
  'irrigation-tuning': PartnerDirection.AUTOWATERING,
  'irrigation-maintenance': PartnerDirection.AUTOWATERING,
  'irrigation-mount': PartnerDirection.AUTOWATERING,
  'filter-maintenance': PartnerDirection.FILTERS,
  'filter-cartridge': PartnerDirection.FILTERS,
  'filter-install': PartnerDirection.FILTERS,
  'pump-service': PartnerDirection.PUMPS,
  landscape: PartnerDirection.LANDSCAPE,
  lighting: PartnerDirection.LANDSCAPE,
  'electrical-wiring': PartnerDirection.ELECTRICAL,
  'electrical-panel': PartnerDirection.ELECTRICAL,
};

export function isKnownSubserviceId(id: string): boolean {
  return Boolean(SUBSERVICE_TO_DIRECTION[id]) || isFurnitureExecutorAccessId(id);
}

export function deriveDirectionsFromSubservices(subserviceIds: string[]): PartnerDirection[] {
  const set = new Set<PartnerDirection>();
  for (const id of subserviceIds) {
    const d = SUBSERVICE_TO_DIRECTION[id];
    if (d) set.add(d);
  }
  return [...set];
}

/** Все подуслуги, относящиеся к указанным направлениям (для обратной совместимости по directions). */
export function expandDirectionsToSubservices(directions: PartnerDirection[]): string[] {
  const set = new Set<string>();
  const dirSet = new Set(directions);
  for (const [sid, d] of Object.entries(SUBSERVICE_TO_DIRECTION)) {
    if (dirSet.has(d)) set.add(sid);
  }
  return [...set];
}

/**
 * Заказ виден партнёру только если по этой подуслуге есть хотя бы одно ACTIVE-предложение.
 */
export function orderMatchesActiveOffering(
  order: { category: OrderCategory; serviceId: string | null },
  activeSubserviceIds: Set<string>,
): boolean {
  if (order.category === OrderCategory.SHOP) {
    return activeSubserviceIds.has(GP_SHOP_SUBSERVICE_ID);
  }
  if (order.serviceId && activeSubserviceIds.has(order.serviceId)) {
    return true;
  }
  if (order.serviceId) {
    return false;
  }
  // Заявки без serviceId: допускаем, если активна любая подуслуга этого направления заказа
  for (const sid of activeSubserviceIds) {
    const d = SUBSERVICE_TO_DIRECTION[sid];
    if (d && categoryMatchesDirection(order.category, [d])) {
      return true;
    }
  }
  return false;
}
