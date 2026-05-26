import { OrderCategory, PartnerRole, PartnerStatus, PartnerType } from '@prisma/client';

export const SHOP_PARTNER_TYPE = PartnerType.SHOP;

export function getEffectivePartnerRole(
  role: PartnerRole | null | undefined,
  type: PartnerType | null | undefined,
): PartnerRole {
  if (role) return role;
  if (type === PartnerType.SHOP) return PartnerRole.SHOP;
  return PartnerRole.SPECIALIST;
}

export function canAccessShopModule(
  role: PartnerRole,
  status: PartnerStatus,
): boolean {
  if (status !== PartnerStatus.APPROVED) return false;
  if (role === PartnerRole.SHOP) return true;
  if (role === PartnerRole.MIXED_PARTNER) return true;
  return false;
}

export function canAccessServiceModule(
  role: PartnerRole,
  status: PartnerStatus,
): boolean {
  if (status !== PartnerStatus.APPROVED) return false;
  if (role === PartnerRole.SPECIALIST) return true;
  if (role === PartnerRole.MIXED_PARTNER) return true;
  return false;
}

export function isShopPartnerProfile(profile: {
  partnerRole?: PartnerRole | null;
  partnerType?: PartnerType | null;
  status?: PartnerStatus;
}): boolean {
  return canAccessShopModule(
    getEffectivePartnerRole(profile.partnerRole, profile.partnerType),
    profile.status ?? PartnerStatus.DRAFT,
  );
}

export function isServicePartnerProfile(profile: {
  partnerRole?: PartnerRole | null;
  partnerType?: PartnerType | null;
  status?: PartnerStatus;
}): boolean {
  return canAccessServiceModule(
    getEffectivePartnerRole(profile.partnerRole, profile.partnerType),
    profile.status ?? PartnerStatus.DRAFT,
  );
}

/** @deprecated Используйте isShopPartnerProfile */
export function isShopPartnerType(type: PartnerType | null | undefined): boolean {
  return type === PartnerType.SHOP;
}

/** @deprecated Используйте isServicePartnerProfile */
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
