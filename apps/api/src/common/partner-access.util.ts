import { OrderCategory, PartnerStatus, PartnerType } from '@prisma/client';

export const SHOP_PARTNER_TYPE = PartnerType.SHOP;

export function isShopPartnerType(type: PartnerType | null | undefined): boolean {
  return type === PartnerType.SHOP;
}

export function isServicePartnerType(type: PartnerType | null | undefined): boolean {
  return Boolean(type && type !== PartnerType.SHOP);
}

/** Категории заказов GP Service, доступные типу партнёра */
export function orderCategoriesForPartnerType(type: PartnerType | null | undefined): OrderCategory[] | null {
  if (!type) return null;
  switch (type) {
    case PartnerType.SHOP:
      return [OrderCategory.SHOP];
    case PartnerType.SEPTIC_SERVICE:
      return [OrderCategory.SEPTIC];
    case PartnerType.LAWN_MOWING:
      return [OrderCategory.LAWN];
    case PartnerType.IRRIGATION_SERVICE:
      return [OrderCategory.AUTOWATERING];
    case PartnerType.CLEANING_SERVICE:
      return [OrderCategory.LAWN, OrderCategory.FILTERS];
    case PartnerType.SPECIALIST:
    case PartnerType.DELIVERY:
    case PartnerType.OTHER:
      return [
        OrderCategory.SEPTIC,
        OrderCategory.LAWN,
        OrderCategory.AUTOWATERING,
        OrderCategory.PUMPS,
        OrderCategory.FILTERS,
        OrderCategory.ELECTRICAL,
      ];
    default:
      return null;
  }
}

export function isOrderAllowedForPartnerType(
  order: { category: OrderCategory },
  type: PartnerType | null | undefined,
): boolean {
  const allowed = orderCategoriesForPartnerType(type);
  if (!allowed) return type !== PartnerType.SHOP;
  return allowed.includes(order.category);
}

export function assertPartnerApproved(status: PartnerStatus): void {
  if (status !== PartnerStatus.APPROVED) {
    throw new Error('PARTNER_NOT_APPROVED');
  }
}
