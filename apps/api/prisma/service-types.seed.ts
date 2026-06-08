/** GP client service types + city prices seed */

type Localized = { ru: string; kk: string; en: string };

type ServiceTypeSeed = {
  code: string;
  names: Localized;
  sortOrder: number;
  subservices: Array<{
    code: string;
    names: Localized;
    priority: number;
    volumeStart?: number;
    volumeEnd?: number;
  }>;
};

type CityPriceSeed = {
  subCode: string;
  price: number;
  gpCommission: number;
  active?: boolean;
};

const SERVICE_TYPES: ServiceTypeSeed[] = [
  {
    code: 'septic',
    names: { ru: 'Откачка септика', kk: 'Септик сорғызу', en: 'Septic pumping' },
    sortOrder: 1,
    subservices: [
      { code: 'vol_3_4', names: { ru: '3 куба', kk: '3 тек', en: '3 m³' }, volumeStart: 3, volumeEnd: 4, priority: 1 },
      { code: 'vol_5_7', names: { ru: '5 кубов', kk: '5 тек', en: '5 m³' }, volumeStart: 5, volumeEnd: 7, priority: 2 },
      { code: 'vol_10', names: { ru: '10 кубов', kk: '10 тек', en: '10 m³' }, volumeStart: 10, volumeEnd: 10, priority: 3 },
      { code: 'urgent', names: { ru: 'Срочный вызов', kk: 'Шұғыл шақыру', en: 'Urgent call' }, priority: 4 },
      { code: 'night', names: { ru: 'Ночной вызов', kk: 'Түнгі шақыру', en: 'Night call' }, priority: 5 },
    ],
  },
  {
    code: 'lawn',
    names: { ru: 'Газон', kk: 'Көгал', en: 'Lawn' },
    sortOrder: 2,
    subservices: [
      { code: 'lawn-roll-prep', names: { ru: 'Укладка рулонного газона + подготовка земли', kk: 'Жер дайындау және рулон көгал төсеу', en: 'Roll lawn + soil preparation' }, priority: 1 },
      { code: 'lawn-seeding', names: { ru: 'Посев газона', kk: 'Көгал егу', en: 'Lawn seeding' }, priority: 2 },
      { code: 'lawn-roll', names: { ru: 'Укладка рулонного газона', kk: 'Рулон көгал төсеу', en: 'Roll lawn laying' }, priority: 3 },
      { code: 'lawn-trim', names: { ru: 'Стрижка газона', kk: 'Көгал қырқу', en: 'Lawn trimming' }, priority: 4 },
      { code: 'grass-mowing', names: { ru: 'Покос травы', kk: 'Шөп шабу', en: 'Grass mowing' }, priority: 5 },
    ],
  },
  {
    code: 'filter',
    names: { ru: 'Водяные фильтры', kk: 'Су сүзгілері', en: 'Water filters' },
    sortOrder: 3,
    subservices: [
      { code: 'filter-maintenance', names: { ru: 'Ремонт / обслуживание фильтра для воды', kk: 'Су сүзгісін жөндеу / қызмет көрсету', en: 'Water filter repair / maintenance' }, priority: 1 },
      { code: 'filter-cartridge', names: { ru: 'Замена картриджа фильтра', kk: 'Сүзгі картриджін ауыстыру', en: 'Filter cartridge replacement' }, priority: 2 },
      { code: 'filter-install', names: { ru: 'Установка фильтра для воды', kk: 'Су сүзгісін орнату', en: 'Water filter installation' }, priority: 3 },
    ],
  },
  {
    code: 'irrigation',
    names: { ru: 'Автополив', kk: 'Автосуарма', en: 'Auto irrigation' },
    sortOrder: 4,
    subservices: [
      { code: 'irrigation-tuning', names: { ru: 'Настройка автополива', kk: 'Автосуарма баптау', en: 'Irrigation tuning' }, priority: 1 },
      { code: 'irrigation-maintenance', names: { ru: 'Ремонт / обслуживание автополива', kk: 'Автосуарма жөндеу / қызмет көрсету', en: 'Irrigation repair / maintenance' }, priority: 2 },
      { code: 'irrigation-mount', names: { ru: 'Монтаж системы автополива', kk: 'Автосуарма жүйесін монтаждау', en: 'Irrigation system installation' }, priority: 3 },
      { code: 'pump-service', names: { ru: 'Обслуживание насосов', kk: 'Сорғыларға қызмет көрсету', en: 'Pump service' }, priority: 4 },
    ],
  },
  {
    code: 'landscape',
    names: { ru: 'Сад и участок', kk: 'Бақ және учаске', en: 'Garden and plot' },
    sortOrder: 5,
    subservices: [
      { code: 'landscape', names: { ru: 'Ландшафтный дизайн', kk: 'Ландшафт дизайны', en: 'Landscape design' }, priority: 1 },
      { code: 'lighting', names: { ru: 'Ландшафтная подсветка', kk: 'Ландшафт жарықтандыру', en: 'Landscape lighting' }, priority: 2 },
    ],
  },
];

const DEFAULT_CITY_PRICES: Record<string, CityPriceSeed[]> = {
  septic: [
    { subCode: 'vol_3_4', price: 8000, gpCommission: 300 },
    { subCode: 'vol_5_7', price: 12000, gpCommission: 400 },
    { subCode: 'vol_10', price: 20000, gpCommission: 600 },
    { subCode: 'urgent', price: 15000, gpCommission: 500 },
    { subCode: 'night', price: 18000, gpCommission: 600 },
  ],
  lawn: [
    { subCode: 'lawn-roll-prep', price: 15000, gpCommission: 1000 },
    { subCode: 'lawn-seeding', price: 15000, gpCommission: 1000 },
    { subCode: 'lawn-roll', price: 15000, gpCommission: 1000 },
    { subCode: 'lawn-trim', price: 15000, gpCommission: 1000 },
    { subCode: 'grass-mowing', price: 15000, gpCommission: 1000 },
  ],
  filter: [
    { subCode: 'filter-maintenance', price: 2000, gpCommission: 1000 },
    { subCode: 'filter-cartridge', price: 6000, gpCommission: 1000 },
    { subCode: 'filter-install', price: 2000, gpCommission: 1000 },
  ],
  irrigation: [
    { subCode: 'irrigation-tuning', price: 2000, gpCommission: 1000 },
    { subCode: 'irrigation-maintenance', price: 2000, gpCommission: 1000 },
    { subCode: 'irrigation-mount', price: 2000, gpCommission: 1000 },
    { subCode: 'pump-service', price: 15000, gpCommission: 1000 },
  ],
  landscape: [
    { subCode: 'landscape', price: 80000, gpCommission: 1500 },
    { subCode: 'lighting', price: 35000, gpCommission: 1500 },
  ],
};

const CITY_PRICE_OVERRIDES: Record<string, Record<string, CityPriceSeed[]>> = {
  'city-atyrau': {
    septic: [
      { subCode: 'vol_3_4', price: 9000, gpCommission: 350 },
      { subCode: 'vol_5_7', price: 14000, gpCommission: 450 },
      { subCode: 'vol_10', price: 22000, gpCommission: 650 },
      { subCode: 'urgent', price: 17000, gpCommission: 550, active: false },
      { subCode: 'night', price: 20000, gpCommission: 650 },
    ],
    lawn: [
      { subCode: 'lawn-roll-prep', price: 18000, gpCommission: 1000 },
      { subCode: 'lawn-seeding', price: 18000, gpCommission: 1000 },
      { subCode: 'lawn-roll', price: 18000, gpCommission: 1000 },
      { subCode: 'lawn-trim', price: 18000, gpCommission: 1000 },
      { subCode: 'grass-mowing', price: 18000, gpCommission: 1000 },
    ],
    irrigation: DEFAULT_CITY_PRICES.irrigation.map((row) => ({ ...row, active: false })),
    landscape: DEFAULT_CITY_PRICES.landscape.map((row) => ({ ...row, active: false })),
  },
  'city-aktobe': {
    septic: [
      { subCode: 'vol_3_4', price: 8500, gpCommission: 320 },
      { subCode: 'vol_5_7', price: 13000, gpCommission: 420 },
      { subCode: 'vol_10', price: 21000, gpCommission: 620 },
      { subCode: 'urgent', price: 16000, gpCommission: 500 },
      { subCode: 'night', price: 19000, gpCommission: 600, active: false },
    ],
    filter: DEFAULT_CITY_PRICES.filter.map((row) => ({ ...row, active: false })),
  },
  'city-astana': {
    septic: DEFAULT_CITY_PRICES.septic.map((row) => ({ ...row, active: false })),
    lawn: DEFAULT_CITY_PRICES.lawn.map((row) => ({ ...row, active: false })),
    filter: DEFAULT_CITY_PRICES.filter.map((row) => ({ ...row, active: false })),
    irrigation: DEFAULT_CITY_PRICES.irrigation.map((row) => ({ ...row, active: false })),
    landscape: DEFAULT_CITY_PRICES.landscape.map((row) => ({ ...row, active: false })),
  },
};

const CITY_META: Record<string, { oblastId: string; franchiseId: string }> = {
  'city-uralsk': { oblastId: 'obl-batys', franchiseId: 'fr-uralsk' },
  'city-aksay': { oblastId: 'obl-batys', franchiseId: 'fr-uralsk' },
  'city-atyrau': { oblastId: 'obl-atyrau', franchiseId: 'fr-atyrau' },
  'city-aktobe': { oblastId: 'obl-aktobe', franchiseId: 'fr-aktobe' },
  'city-almaty': { oblastId: 'obl-almaty', franchiseId: 'fr-almaty' },
  'city-astana': { oblastId: 'obl-astana', franchiseId: 'fr-astana' },
};

function cityPrices(cityId: string, serviceCode: string) {
  return CITY_PRICE_OVERRIDES[cityId]?.[serviceCode] ?? DEFAULT_CITY_PRICES[serviceCode] ?? [];
}

export async function seedServiceTypes(prisma: import('@prisma/client').PrismaClient) {
  const subIdsByService = new Map<string, Map<string, string>>();

  for (const serviceDef of SERVICE_TYPES) {
    const serviceType = await prisma.serviceType.upsert({
      where: { code: serviceDef.code },
      update: {
        names: serviceDef.names,
        active: true,
        sortOrder: serviceDef.sortOrder,
      },
      create: {
        code: serviceDef.code,
        names: serviceDef.names,
        active: true,
        sortOrder: serviceDef.sortOrder,
      },
    });

    const subIds = new Map<string, string>();
    for (const subDef of serviceDef.subservices) {
      const subservice = await prisma.subserviceType.upsert({
        where: { serviceTypeId_code: { serviceTypeId: serviceType.id, code: subDef.code } },
        update: {
          names: subDef.names,
          active: true,
          sortOrder: subDef.priority,
        },
        create: {
          serviceTypeId: serviceType.id,
          code: subDef.code,
          names: subDef.names,
          active: true,
          sortOrder: subDef.priority,
        },
      });
      subIds.set(subDef.code, subservice.id);
    }
    subIdsByService.set(serviceDef.code, subIds);
  }

  for (const [cityId, meta] of Object.entries(CITY_META)) {
    for (const serviceDef of SERVICE_TYPES) {
      const serviceType = await prisma.serviceType.findUniqueOrThrow({ where: { code: serviceDef.code } });
      const subIds = subIdsByService.get(serviceDef.code) ?? new Map<string, string>();

      for (const row of cityPrices(cityId, serviceDef.code)) {
        const subDef = serviceDef.subservices.find((s) => s.code === row.subCode);
        const subserviceTypeId = subIds.get(row.subCode);
        if (!subDef || !subserviceTypeId) continue;

        const existing = await prisma.cityServicePrice.findFirst({
          where: {
            serviceTypeId: serviceType.id,
            cityId,
            subserviceTypeId,
          },
        });

        const data = {
          serviceTypeId: serviceType.id,
          subserviceTypeId,
          oblastId: meta.oblastId,
          cityId,
          franchiseId: meta.franchiseId,
          price: row.price,
          gpCommission: row.gpCommission,
          active: row.active !== false,
          volumeStart: subDef.volumeStart ?? null,
          volumeEnd: subDef.volumeEnd ?? null,
          priority: subDef.priority,
        };

        if (existing) {
          await prisma.cityServicePrice.update({ where: { id: existing.id }, data });
        } else {
          await prisma.cityServicePrice.create({ data });
        }
      }
    }
  }
}
