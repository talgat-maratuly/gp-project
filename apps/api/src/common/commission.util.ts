import { OrderCategory } from '@prisma/client';

export const GP_COMMISSION_LAWN = 1000;
export const GP_COMMISSION_CONSULTATION = 1000;
export const MIN_ORDER_LAWN = 15000;
export const CONSULTATION_FEE = 2000;

const LAWN_RATES: Record<string, { perSqm: number; min: number }> = {
  'lawn-roll-prep': { perSqm: 4200, min: MIN_ORDER_LAWN },
  'lawn-seeding': { perSqm: 2500, min: MIN_ORDER_LAWN },
  'lawn-trim': { perSqm: 50, min: MIN_ORDER_LAWN },
  'grass-mowing': { perSqm: 30, min: MIN_ORDER_LAWN },
  'lawn-roll': { perSqm: 1200, min: MIN_ORDER_LAWN },
};

const CONSULTATION_SERVICES = new Set([
  'irrigation-tuning',
  'irrigation-maintenance',
  'irrigation-mount',
  'filter-maintenance',
  'filter-install',
]);

const FILTER_CARTRIDGE_SERVICE = 'filter-cartridge';
const FILTER_CARTRIDGE_PRICE = 6000;

export function calcSepticCommission(cubicMeters: number): number {
  const v = cubicMeters || 0;
  if (v <= 4) return 300;
  if (v <= 5) return 300;
  if (v <= 6) return 400;
  if (v <= 9) return 500;
  return 500;
}

export function calcSepticPrice(volume: number): number {
  const v = volume || 0;
  if (v <= 4) return 6000;
  if (v <= 7) return 8000;
  return 10000;
}

export function calcLawnTotal(serviceId: string, areaSqm: number): number {
  const rate = LAWN_RATES[serviceId];
  if (!rate) return 0;
  const area = Math.max(0, areaSqm || 0);
  return Math.max(rate.min, Math.round(rate.perSqm * area));
}

export function calcServiceTotal(opts: {
  serviceId?: string;
  category: OrderCategory;
  septicVolume?: number | null;
  lawnAreaSqm?: number | null;
  fallbackTotal?: number;
}): number {
  if (opts.category === OrderCategory.SEPTIC && opts.septicVolume) {
    return calcSepticPrice(opts.septicVolume);
  }
  if (opts.serviceId && LAWN_RATES[opts.serviceId] && opts.lawnAreaSqm) {
    return calcLawnTotal(opts.serviceId, opts.lawnAreaSqm);
  }
  if (opts.serviceId && CONSULTATION_SERVICES.has(opts.serviceId)) {
    return CONSULTATION_FEE;
  }
  if (opts.serviceId === FILTER_CARTRIDGE_SERVICE) {
    return FILTER_CARTRIDGE_PRICE;
  }
  return opts.fallbackTotal ?? 0;
}

export function calcOrderCommission(
  category: OrderCategory,
  opts?: { septicVolume?: number | null; serviceId?: string },
): number {
  if (category === OrderCategory.SEPTIC && opts?.septicVolume) {
    return calcSepticCommission(opts.septicVolume);
  }
  if (opts?.serviceId && LAWN_RATES[opts.serviceId]) {
    return GP_COMMISSION_LAWN;
  }
  if (opts?.serviceId && CONSULTATION_SERVICES.has(opts.serviceId)) {
    return GP_COMMISSION_CONSULTATION;
  }
  if (opts?.serviceId === FILTER_CARTRIDGE_SERVICE) {
    return GP_COMMISSION_CONSULTATION;
  }
  return 0;
}

export function categoryMatchesDirection(
  orderCategory: OrderCategory,
  directions: string[],
): boolean {
  const map: Record<OrderCategory, string[]> = {
    SEPTIC: ['SEPTIC'],
    LAWN: ['LAWN', 'LANDSCAPE'],
    AUTOWATERING: ['AUTOWATERING', 'LANDSCAPE'],
    PUMPS: ['PUMPS'],
    FILTERS: ['FILTERS'],
    SHOP: ['SHOP', 'NURSERY'],
    ELECTRICAL: ['ELECTRICAL'],
  };
  const allowed = map[orderCategory] || [orderCategory];
  return directions.some((d) => allowed.includes(d));
}
