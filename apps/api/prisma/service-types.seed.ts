/** Septic service types + city prices seed */

type Localized = { ru: string; kk: string; en: string };

const SEPTIC_SUBS: Array<{
  code: string;
  names: Localized;
  volumeStart: number;
  volumeEnd: number;
  priority: number;
}> = [
  { code: 'vol_3_4', names: { ru: '3 куба', kk: '3 тек', en: '3 m³' }, volumeStart: 3, volumeEnd: 4, priority: 1 },
  { code: 'vol_5_7', names: { ru: '5 кубов', kk: '5 тек', en: '5 m³' }, volumeStart: 5, volumeEnd: 7, priority: 2 },
  { code: 'vol_10', names: { ru: '10 кубов', kk: '10 тек', en: '10 m³' }, volumeStart: 10, volumeEnd: 10, priority: 3 },
  { code: 'urgent', names: { ru: 'Срочный вызов', kk: 'Шұғыл шақыру', en: 'Urgent call' }, volumeStart: 0, volumeEnd: 0, priority: 4 },
  { code: 'night', names: { ru: 'Ночной вызов', kk: 'Түнгі шақыру', en: 'Night call' }, volumeStart: 0, volumeEnd: 0, priority: 5 },
];

const CITY_SEPTIC_PRICES: Record<string, Array<{ subCode: string; price: number; gpCommission: number; active?: boolean }>> = {
  'city-uralsk': [
    { subCode: 'vol_3_4', price: 8000, gpCommission: 300 },
    { subCode: 'vol_5_7', price: 12000, gpCommission: 400 },
    { subCode: 'vol_10', price: 20000, gpCommission: 600 },
    { subCode: 'urgent', price: 15000, gpCommission: 500 },
    { subCode: 'night', price: 18000, gpCommission: 600 },
  ],
  'city-atyrau': [
    { subCode: 'vol_3_4', price: 9000, gpCommission: 350 },
    { subCode: 'vol_5_7', price: 14000, gpCommission: 450 },
    { subCode: 'vol_10', price: 22000, gpCommission: 650 },
    { subCode: 'urgent', price: 17000, gpCommission: 550, active: false },
    { subCode: 'night', price: 20000, gpCommission: 650 },
  ],
  'city-aktobe': [
    { subCode: 'vol_3_4', price: 8500, gpCommission: 320 },
    { subCode: 'vol_5_7', price: 13000, gpCommission: 420 },
    { subCode: 'vol_10', price: 21000, gpCommission: 620 },
    { subCode: 'urgent', price: 16000, gpCommission: 500 },
    { subCode: 'night', price: 19000, gpCommission: 600, active: false },
  ],
  'city-almaty': [
    { subCode: 'vol_3_4', price: 8000, gpCommission: 300 },
    { subCode: 'vol_5_7', price: 12000, gpCommission: 400 },
    { subCode: 'vol_10', price: 20000, gpCommission: 600 },
    { subCode: 'urgent', price: 15000, gpCommission: 500 },
    { subCode: 'night', price: 18000, gpCommission: 600 },
  ],
  'city-astana': [
    { subCode: 'vol_3_4', price: 8000, gpCommission: 300, active: false },
    { subCode: 'vol_5_7', price: 12000, gpCommission: 400, active: false },
    { subCode: 'vol_10', price: 20000, gpCommission: 600, active: false },
    { subCode: 'urgent', price: 15000, gpCommission: 500, active: false },
    { subCode: 'night', price: 18000, gpCommission: 600, active: false },
  ],
};

const CITY_META: Record<string, { oblastId: string; franchiseId: string }> = {
  'city-uralsk': { oblastId: 'obl-batys', franchiseId: 'fr-uralsk' },
  'city-atyrau': { oblastId: 'obl-atyrau', franchiseId: 'fr-atyrau' },
  'city-aktobe': { oblastId: 'obl-aktobe', franchiseId: 'fr-aktobe' },
  'city-almaty': { oblastId: 'obl-almaty', franchiseId: 'fr-almaty' },
  'city-astana': { oblastId: 'obl-astana', franchiseId: 'fr-astana' },
};

export async function seedServiceTypes(prisma: import('@prisma/client').PrismaClient) {
  let septic = await prisma.serviceType.findUnique({ where: { code: 'septic' } });
  if (!septic) {
    septic = await prisma.serviceType.create({
      data: {
        code: 'septic',
        names: { ru: 'Откачка септика', kk: 'Септик сорғызу', en: 'Septic pumping' },
        active: true,
        sortOrder: 1,
      },
    });
  }

  const subIds = new Map<string, string>();
  for (let i = 0; i < SEPTIC_SUBS.length; i++) {
    const s = SEPTIC_SUBS[i];
    const existing = await prisma.subserviceType.findUnique({
      where: { serviceTypeId_code: { serviceTypeId: septic.id, code: s.code } },
    });
    if (existing) {
      subIds.set(s.code, existing.id);
      continue;
    }
    const created = await prisma.subserviceType.create({
      data: {
        serviceTypeId: septic.id,
        code: s.code,
        names: s.names,
        active: true,
        sortOrder: i,
      },
    });
    subIds.set(s.code, created.id);
  }

  for (const [cityId, rows] of Object.entries(CITY_SEPTIC_PRICES)) {
    const meta = CITY_META[cityId];
    if (!meta) continue;

    for (const row of rows) {
      const subDef = SEPTIC_SUBS.find((s) => s.code === row.subCode);
      const subserviceTypeId = subIds.get(row.subCode);
      if (!subDef || !subserviceTypeId) continue;

      const exists = await prisma.cityServicePrice.findFirst({
        where: {
          serviceTypeId: septic.id,
          cityId,
          subserviceTypeId,
        },
      });
      if (exists) continue;

      await prisma.cityServicePrice.create({
        data: {
          serviceTypeId: septic.id,
          subserviceTypeId,
          oblastId: meta.oblastId,
          cityId,
          franchiseId: meta.franchiseId,
          price: row.price,
          gpCommission: row.gpCommission,
          active: row.active !== false,
          volumeStart: subDef.volumeStart || null,
          volumeEnd: subDef.volumeEnd || null,
          priority: subDef.priority,
        },
      });
    }
  }
}
