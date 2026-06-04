/** Prisma seed — франшиза қызмет каталогы (demo seed-пен синхрон) */

type Localized = { ru: string; kk: string; en: string };

type SubSeed = {
  externalId: string;
  names: Localized;
  price: number;
  gpCommission: number;
  active?: boolean;
};

type ServiceSeed = {
  templateId: string;
  names: Localized;
  basePrice: number;
  gpCommission: number;
  active: boolean;
  subservices: SubSeed[];
};

export const FRANCHISE_CATALOG_SEED = [
  { id: 'fr-uralsk', name: 'GP Уральск', city: 'Уральск', cityId: 'city-uralsk', regionCode: 'uralsk' },
  { id: 'fr-aktobe', name: 'GP Актобе', city: 'Актобе', cityId: 'city-aktobe', regionCode: 'aktobe' },
  { id: 'fr-atyrau', name: 'GP Атырау', city: 'Атырау', cityId: 'city-atyrau', regionCode: 'atyrau' },
  { id: 'fr-almaty', name: 'GP Алматы', city: 'Алматы', cityId: 'city-almaty', regionCode: 'almaty' },
  { id: 'fr-astana', name: 'GP Астана', city: 'Астана', cityId: 'city-astana', regionCode: 'astana' },
];

function sub(externalId: string, names: Localized, price: number, gpCommission: number, active = true): SubSeed {
  return { externalId, names, price, gpCommission, active };
}

function buildServices(franchiseId: string): ServiceSeed[] {
  if (franchiseId === 'fr-atyrau') {
    return [
      {
        templateId: 'septic',
        names: { ru: 'Откачка септика', kk: 'Септик сорғызу', en: 'Septic pumping' },
        basePrice: 9000, gpCommission: 350, active: true,
        subservices: [
          sub(`sub_3m_${franchiseId}`, { ru: '3 куба', kk: '3 тек', en: '3 m³' }, 9000, 350),
          sub(`sub_5m_${franchiseId}`, { ru: '5 кубов', kk: '5 тек', en: '5 m³' }, 14000, 450),
          sub(`sub_10m_${franchiseId}`, { ru: '10 кубов', kk: '10 тек', en: '10 m³' }, 22000, 650),
          sub(`sub_urgent_${franchiseId}`, { ru: 'Срочный вызов', kk: 'Шұғыл шақыру', en: 'Urgent call' }, 17000, 550, false),
          sub(`sub_night_${franchiseId}`, { ru: 'Ночной вызов', kk: 'Түнгі шақыру', en: 'Night call' }, 20000, 650),
        ],
      },
      {
        templateId: 'lawn',
        names: { ru: 'Стрижка газона', kk: 'Шөп шабу', en: 'Lawn mowing' },
        basePrice: 18000, gpCommission: 1000, active: true,
        subservices: [
          sub(`sub_100_${franchiseId}`, { ru: 'до 100 м²', kk: '100 м² дейін', en: 'up to 100 m²' }, 14000, 800),
          sub(`sub_500_${franchiseId}`, { ru: '100–500 м²', kk: '100–500 м²', en: '100–500 m²' }, 20000, 1000),
          sub(`sub_1000_${franchiseId}`, { ru: '500–1000 м²', kk: '500–1000 м²', en: '500–1000 m²' }, 30000, 1500, false),
          sub(`sub_mow_${franchiseId}`, { ru: 'Покос травы', kk: 'Шөп кесу', en: 'Grass mowing' }, 11000, 600),
          sub(`sub_haul_${franchiseId}`, { ru: 'Вывоз травы', kk: 'Шөп тасымалдау', en: 'Grass removal' }, 9000, 400),
        ],
      },
      {
        templateId: 'filter',
        names: { ru: 'Замена фильтра', kk: 'Сүзгі ауыстыру', en: 'Filter replacement' },
        basePrice: 7000, gpCommission: 1000, active: true,
        subservices: [
          sub(`sub_std_${franchiseId}`, { ru: 'Стандарт', kk: 'Стандарт', en: 'Standard' }, 7000, 1000),
          sub(`sub_prem_${franchiseId}`, { ru: 'Премиум', kk: 'Премиум', en: 'Premium' }, 10000, 1200),
        ],
      },
      { templateId: 'irrigation', names: { ru: 'Автополив', kk: 'Автосуарма', en: 'Auto irrigation' }, basePrice: 22000, gpCommission: 1000, active: false, subservices: [] },
      { templateId: 'cleaning', names: { ru: 'Клининг', kk: 'Тазалау', en: 'Cleaning' }, basePrice: 13000, gpCommission: 800, active: true, subservices: [] },
      { templateId: 'landscape', names: { ru: 'Озеленение', kk: 'Көгалдандыру', en: 'Landscaping' }, basePrice: 28000, gpCommission: 1500, active: false, subservices: [] },
      { templateId: 'rental', names: { ru: 'Аренда оборудования', kk: 'Жабдық жалдау', en: 'Equipment rental' }, basePrice: 10000, gpCommission: 500, active: false, subservices: [] },
    ];
  }

  if (franchiseId === 'fr-aktobe') {
    return [
      {
        templateId: 'septic',
        names: { ru: 'Откачка септика', kk: 'Септик сорғызу', en: 'Septic pumping' },
        basePrice: 8500, gpCommission: 320, active: true,
        subservices: [
          sub(`sub_3m_${franchiseId}`, { ru: '3 куба', kk: '3 тек', en: '3 m³' }, 8500, 320),
          sub(`sub_5m_${franchiseId}`, { ru: '5 кубов', kk: '5 тек', en: '5 m³' }, 13000, 420),
          sub(`sub_10m_${franchiseId}`, { ru: '10 кубов', kk: '10 тек', en: '10 m³' }, 21000, 620),
          sub(`sub_urgent_${franchiseId}`, { ru: 'Срочный вызов', kk: 'Шұғыл шақыру', en: 'Urgent call' }, 16000, 500),
          sub(`sub_night_${franchiseId}`, { ru: 'Ночной вызов', kk: 'Түнгі шақыру', en: 'Night call' }, 19000, 600, false),
        ],
      },
      {
        templateId: 'lawn',
        names: { ru: 'Стрижка газона', kk: 'Шөп шабу', en: 'Lawn mowing' },
        basePrice: 16000, gpCommission: 1000, active: true,
        subservices: [
          sub(`sub_100_${franchiseId}`, { ru: 'до 100 м²', kk: '100 м² дейін', en: 'up to 100 m²' }, 13000, 800),
          sub(`sub_500_${franchiseId}`, { ru: '100–500 м²', kk: '100–500 m²', en: '100–500 m²' }, 19000, 1000),
          sub(`sub_1000_${franchiseId}`, { ru: '500–1000 м²', kk: '500–1000 м²', en: '500–1000 m²' }, 29000, 1500),
          sub(`sub_mow_${franchiseId}`, { ru: 'Покос травы', kk: 'Шөп кесу', en: 'Grass mowing' }, 10500, 600),
          sub(`sub_haul_${franchiseId}`, { ru: 'Вывоз травы', kk: 'Шөп тасымалдау', en: 'Grass removal' }, 8500, 400, false),
        ],
      },
      { templateId: 'filter', names: { ru: 'Замена фильтра', kk: 'Сүзгі ауыстыру', en: 'Filter replacement' }, basePrice: 6500, gpCommission: 1000, active: false, subservices: [] },
      { templateId: 'irrigation', names: { ru: 'Автополив', kk: 'Автосуарма', en: 'Auto irrigation' }, basePrice: 21000, gpCommission: 1000, active: true, subservices: [] },
      { templateId: 'cleaning', names: { ru: 'Клининг', kk: 'Тазалау', en: 'Cleaning' }, basePrice: 12500, gpCommission: 800, active: true, subservices: [] },
      { templateId: 'landscape', names: { ru: 'Озеленение', kk: 'Көгалдандыру', en: 'Landscaping' }, basePrice: 26000, gpCommission: 1500, active: true, subservices: [] },
      { templateId: 'rental', names: { ru: 'Аренда оборудования', kk: 'Жабдық жалдау', en: 'Equipment rental' }, basePrice: 10000, gpCommission: 500, active: false, subservices: [] },
    ];
  }

  return [
    {
      templateId: 'septic',
      names: { ru: 'Откачка септика', kk: 'Септик сорғызу', en: 'Septic pumping' },
      basePrice: 8000, gpCommission: 300, active: true,
      subservices: [
        sub(`sub_3m_${franchiseId}`, { ru: '3 куба', kk: '3 тек', en: '3 m³' }, 8000, 300),
        sub(`sub_5m_${franchiseId}`, { ru: '5 кубов', kk: '5 тек', en: '5 m³' }, 12000, 400),
        sub(`sub_10m_${franchiseId}`, { ru: '10 кубов', kk: '10 тек', en: '10 m³' }, 20000, 600),
        sub(`sub_urgent_${franchiseId}`, { ru: 'Срочный вызов', kk: 'Шұғыл шақыру', en: 'Urgent call' }, 15000, 500),
        sub(`sub_night_${franchiseId}`, { ru: 'Ночной вызов', kk: 'Түнгі шақыру', en: 'Night call' }, 18000, 600),
      ],
    },
    {
      templateId: 'lawn',
      names: { ru: 'Стрижка газона', kk: 'Шөп шабу', en: 'Lawn mowing' },
      basePrice: 15000, gpCommission: 1000, active: true,
      subservices: [
        sub(`sub_100_${franchiseId}`, { ru: 'до 100 м²', kk: '100 м² дейін', en: 'up to 100 m²' }, 12000, 800),
        sub(`sub_500_${franchiseId}`, { ru: '100–500 м²', kk: '100–500 m²', en: '100–500 m²' }, 18000, 1000),
        sub(`sub_1000_${franchiseId}`, { ru: '500–1000 м²', kk: '500–1000 m²', en: '500–1000 m²' }, 28000, 1500),
        sub(`sub_mow_${franchiseId}`, { ru: 'Покос травы', kk: 'Шөп кесу', en: 'Grass mowing' }, 10000, 600),
        sub(`sub_haul_${franchiseId}`, { ru: 'Вывоз травы', kk: 'Шөп тасымалдау', en: 'Grass removal' }, 8000, 400),
      ],
    },
    {
      templateId: 'filter',
      names: { ru: 'Замена фильтра', kk: 'Сүзгі ауыстыру', en: 'Filter replacement' },
      basePrice: 6000, gpCommission: 1000, active: true,
      subservices: [
        sub(`sub_std_${franchiseId}`, { ru: 'Стандарт', kk: 'Стандарт', en: 'Standard' }, 6000, 1000),
        sub(`sub_prem_${franchiseId}`, { ru: 'Премиум', kk: 'Премиум', en: 'Premium' }, 9000, 1200),
      ],
    },
    { templateId: 'irrigation', names: { ru: 'Автополив', kk: 'Автосуарма', en: 'Auto irrigation' }, basePrice: 20000, gpCommission: 1000, active: true, subservices: [] },
    { templateId: 'cleaning', names: { ru: 'Клининг', kk: 'Тазалау', en: 'Cleaning' }, basePrice: 12000, gpCommission: 800, active: true, subservices: [] },
    { templateId: 'landscape', names: { ru: 'Озеленение', kk: 'Көгалдандыру', en: 'Landscaping' }, basePrice: 25000, gpCommission: 1500, active: true, subservices: [] },
    { templateId: 'rental', names: { ru: 'Аренда оборудования', kk: 'Жабдық жалдау', en: 'Equipment rental' }, basePrice: 10000, gpCommission: 500, active: false, subservices: [] },
  ];
}

export async function seedFranchiseCatalog(
  prisma: import('@prisma/client').PrismaClient,
  regionByCode: Record<string, { id: string }>,
) {
  for (const f of FRANCHISE_CATALOG_SEED) {
    const regionId = regionByCode[f.regionCode]?.id ?? null;
    await prisma.franchise.upsert({
      where: { id: f.id },
      update: {
        name: f.name,
        city: f.city,
        cityId: f.cityId,
        regionId,
        isActive: f.id !== 'fr-astana',
      },
      create: {
        id: f.id,
        name: f.name,
        city: f.city,
        cityId: f.cityId,
        regionId,
        isActive: f.id !== 'fr-astana',
      },
    });

    const services = buildServices(f.id);
    for (const svc of services) {
      const existing = await prisma.franchiseService.findUnique({
        where: { franchiseId_templateId: { franchiseId: f.id, templateId: svc.templateId } },
      });
      if (existing) continue;

      await prisma.franchiseService.create({
        data: {
          franchiseId: f.id,
          templateId: svc.templateId,
          cityId: f.cityId,
          names: svc.names,
          basePrice: svc.basePrice,
          gpCommission: svc.gpCommission,
          active: svc.active,
          subservices: {
            create: svc.subservices.map((sub, idx) => ({
              externalId: sub.externalId,
              names: sub.names,
              price: sub.price,
              gpCommission: sub.gpCommission,
              active: sub.active !== false,
              sortOrder: idx,
            })),
          },
        },
      });
    }
  }
}
