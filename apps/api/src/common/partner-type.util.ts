import { PartnerType } from '@prisma/client';
import { GP_SHOP_SUBSERVICE_ID } from './partner-offerings.util';

/** Подуслуги по умолчанию для типа партнёра (SPECIALIST/OTHER дополняются из заявки). */
export const PARTNER_TYPE_DEFAULT_SUBSERVICES: Record<PartnerType, string[]> = {
  SEPTIC_SERVICE: ['septic-pumping'],
  LAWN_MOWING: ['grass-mowing', 'lawn-trim', 'lawn-roll-prep', 'lawn-seeding', 'lawn-roll'],
  IRRIGATION_SERVICE: ['irrigation-tuning', 'irrigation-maintenance', 'irrigation-mount'],
  CLEANING_SERVICE: [],
  SHOP: [GP_SHOP_SUBSERVICE_ID],
  SPECIALIST: [],
  DELIVERY: [],
  OTHER: [],
};

export function resolveSubserviceIdsForPartnerType(
  partnerType: PartnerType,
  extraSubserviceIds?: string[],
): string[] {
  const base = PARTNER_TYPE_DEFAULT_SUBSERVICES[partnerType] ?? [];
  const extra = (extraSubserviceIds ?? []).map((s) => s.trim()).filter(Boolean);
  return [...new Set([...base, ...extra])];
}

export function mainGroupIdToPartnerType(groupId: string): PartnerType | null {
  const map: Record<string, PartnerType> = {
    septic: PartnerType.SEPTIC_SERVICE,
    lawn: PartnerType.LAWN_MOWING,
    irrigation: PartnerType.IRRIGATION_SERVICE,
    filters: PartnerType.SPECIALIST,
    pumps: PartnerType.SPECIALIST,
    shop: PartnerType.SHOP,
    nursery: PartnerType.SHOP,
    landscape: PartnerType.SPECIALIST,
    electrical: PartnerType.SPECIALIST,
    furniture: PartnerType.SPECIALIST,
    cleaning: PartnerType.CLEANING_SERVICE,
    delivery: PartnerType.DELIVERY,
  };
  return map[groupId] ?? null;
}
