export type LocalizedNames = { ru: string; kk: string; en: string };

export function assertLocalizedNames(names: unknown): LocalizedNames {
  if (!names || typeof names !== 'object') {
    throw new Error('names required');
  }
  const n = names as Record<string, unknown>;
  const ru = String(n.ru || '').trim();
  const kk = String(n.kk || '').trim();
  const en = String(n.en || '').trim();
  if (!ru || !kk || !en) {
    throw new Error('names.ru, names.kk, names.en are required');
  }
  return { ru, kk, en };
}

export function mapServiceTypeRecord(st: {
  id: string;
  code: string;
  names: unknown;
  active: boolean;
  sortOrder: number;
  subserviceTypes?: Array<{
    id: string;
    code: string;
    names: unknown;
    active: boolean;
    sortOrder: number;
  }>;
}) {
  const names = assertLocalizedNames(st.names);
  return {
    id: st.id,
    code: st.code,
    names,
    name: names.ru,
    active: st.active,
    sortOrder: st.sortOrder,
    subservices: (st.subserviceTypes || [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(mapSubserviceTypeRecord),
  };
}

export function mapSubserviceTypeRecord(sub: {
  id: string;
  code: string;
  names: unknown;
  active: boolean;
  sortOrder: number;
}) {
  const names = assertLocalizedNames(sub.names);
  return {
    id: sub.id,
    code: sub.code,
    names,
    name: names.ru,
    active: sub.active,
    sortOrder: sub.sortOrder,
  };
}

export function mapCityPriceRecord(row: {
  id: string;
  serviceTypeId: string;
  subserviceTypeId: string | null;
  oblastId: string | null;
  cityId: string;
  franchiseId: string | null;
  price: number;
  gpCommission: number;
  active: boolean;
  volumeStart: number | null;
  volumeEnd: number | null;
  priority: number;
  serviceType?: { code: string; names: unknown };
  subserviceType?: { code: string; names: unknown } | null;
}) {
  return {
    id: row.id,
    serviceTypeId: row.serviceTypeId,
    subserviceTypeId: row.subserviceTypeId,
    serviceCode: row.serviceType?.code ?? null,
    subserviceCode: row.subserviceType?.code ?? null,
    oblastId: row.oblastId,
    cityId: row.cityId,
    franchiseId: row.franchiseId,
    price: row.price,
    gpCommission: row.gpCommission,
    active: row.active,
    volumeStart: row.volumeStart,
    volumeEnd: row.volumeEnd,
    priority: row.priority,
  };
}
