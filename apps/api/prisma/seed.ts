import {
  AccountType,
  OrderCategory,
  OrderStatus,
  PartnerDirection,
  PartnerOfferingStatus,
  PartnerStatus,
  PartnerType,
  PartnerRole,
  PaymentMethod,
  PortalRole,
  PrismaClient,
  RequestStatus,
  Role,
  StoreStatus,
  WorkStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { expandDirectionsToSubservices } from '../src/common/partner-offerings.util';
import { FURNITURE_EXECUTOR_ACCESS_IDS } from '../src/common/furniture-executor.util';
import { MARKET_REGIONS } from './market-regions';
import { SHOP_CATALOG, toProductSeedRow } from './shop-catalog';
import { seedFranchiseCatalog } from './service-catalog.seed';
import { seedServiceTypes } from './service-types.seed';

const prisma = new PrismaClient();

const ORKEN_URALSK_PRODUCTS = [
  {
    id: 'x2-1401e',
    name: 'X2-1401E',
    description: '14-зонный контроллер, внутренний трансформатор ~230 В без вилки',
    quantity: 3,
    brand: 'Hunter',
  },
  {
    id: 'xc-801-e',
    name: 'XC-801 E',
    description: '8 зон для улицы, 230 перем. тока 230 В, 230 В перем. тока с европейскими соединениями',
    quantity: 5,
    brand: 'Hunter',
  },
  {
    id: 'xc-601-e',
    name: 'XC-601 E',
    description: '6 зон для улицы, 230 перем. тока 230 В, 230 В перем. тока с европейскими соединениями',
    quantity: 4,
    brand: 'Hunter',
  },
  {
    id: 'xc-401-e',
    name: 'XC-401 E',
    description: '4 зоны для улицы, 230 перем. тока 230 В, 230 В перем. тока с европейскими соединениями',
    quantity: 2,
    brand: 'Hunter',
  },
  {
    id: 'psr-22',
    name: 'PSR-22',
    description: 'Двухполюсное однопозиционное реле запуска насоса для насосов 240 В перем. тока мощностью до 2,2 кВт',
    quantity: 1,
    brand: 'Hunter',
  },
  { id: 'flexsg', name: 'FlexSG', description: 'Бухта 30 м', quantity: 10, brand: 'Hunter' },
  {
    id: 'hsbe-050',
    name: 'HSBE-050',
    description: 'Наружная резьба ½" x колено со спиральной трубной вставкой',
    quantity: 1000,
    brand: 'Hunter',
  },
  {
    id: '6a',
    name: '6A',
    description: 'Насадка с радиусом 6’ и регулировкой сектора',
    quantity: 50,
    brand: 'Hunter',
  },
  {
    id: 'psu-04-17a',
    name: 'PSU-04 - 17A',
    description: 'Дождеватель с выдвижением на 10 см (4"), 5,2 м (17’) регулируемого сопла',
    quantity: 100,
    brand: 'Hunter',
  },
  {
    id: 'psu-04-15a',
    name: 'PSU-04 - 15A',
    description: 'Дождеватель с выдвижением на 10 см (4"), 4,6 м (15’) регулируемого сопла',
    quantity: 100,
    brand: 'Hunter',
  },
  {
    id: 'psu-04-12a',
    name: 'PSU-04 - 12A',
    description: 'Дождеватель с выдвижением на 10 см (4"), 3,7 м (12’) регулируемого сопла',
    quantity: 100,
    brand: 'Hunter',
  },
  {
    id: 'psu-04-10a',
    name: 'PSU-04 - 10A',
    description: 'Дождеватель с выдвижением на 10 см (4"), 3,0 м (10’) регулируемого сопла',
    quantity: 100,
    brand: 'Hunter',
  },
  {
    id: 'psu-04-8a',
    name: 'PSU-04 - 8A',
    description: 'Дождеватель с выдвижением на 10 см (4"), 2,4 м (8’) регулируемого сопла',
    quantity: 100,
    brand: 'Hunter',
  },
  {
    id: 'psu-04',
    name: 'PSU-04',
    description: 'Дождеватель с выдвижением на 10 см (4") без насадки',
    quantity: 50,
    brand: 'Hunter',
  },
  { id: 'pgj-04', name: 'PGJ-04', description: 'С выдвижением на 10 см', quantity: 100, brand: 'Hunter' },
  {
    id: 'pgv-101g-b',
    name: 'PGV-101G - B',
    description: '25 мм (1" BSP) сферический клапан, с датчиком потока, впускное отверстие с метрической резьбой (BSP)',
    quantity: 40,
    brand: 'Hunter',
  },
  {
    id: 'iritec-standart-270-400-310',
    name: 'Iritec (Италия)',
    description: 'Короб прямоуг. Standart 270*400*310',
    quantity: 15,
    brand: 'Iritec',
  },
] as const;

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  for (const r of MARKET_REGIONS) {
    await prisma.region.upsert({
      where: { code: r.code },
      update: { name: r.name, isActive: r.isActive },
      create: r,
    });
  }
  const regionByCode: Record<string, { id: string }> = {};
  for (const r of MARKET_REGIONS) {
    regionByCode[r.code] = await prisma.region.findUniqueOrThrow({ where: { code: r.code } });
  }
  await seedFranchiseCatalog(prisma, regionByCode);
  await seedServiceTypes(prisma);
  const uralskRegion = regionByCode.uralsk;
  const atyrauRegion = regionByCode.atyrau;

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gp.kz' },
    update: {
      role: Role.SUPER_ADMIN,
      portalRoles: [PortalRole.CLIENT, PortalRole.GLOBAL_OPERATOR, PortalRole.ADMIN],
      regionId: null,
      phone: '+77001110001',
    },
    create: {
      email: 'admin@gp.kz',
      passwordHash,
      name: 'GP Super Admin',
      role: Role.SUPER_ADMIN,
      portalRoles: [PortalRole.CLIENT, PortalRole.GLOBAL_OPERATOR, PortalRole.ADMIN],
      phone: '+77001110001',
    },
  });

  await prisma.user.upsert({
    where: { email: 'uralsk_admin@gp.kz' },
    update: {
      role: Role.REGION_ADMIN,
      portalRoles: [PortalRole.CLIENT, PortalRole.GP_OPERATOR],
      regionId: uralskRegion.id,
      phone: '+77001110002',
    },
    create: {
      email: 'uralsk_admin@gp.kz',
      passwordHash,
      name: 'Админ Уральск',
      role: Role.REGION_ADMIN,
      portalRoles: [PortalRole.CLIENT, PortalRole.GP_OPERATOR],
      regionId: uralskRegion.id,
      phone: '+77001110002',
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: 'client@gp.kz' },
    update: { role: Role.CLIENT, portalRoles: [PortalRole.CLIENT], regionId: uralskRegion.id },
    create: {
      email: 'client@gp.kz',
      passwordHash,
      name: 'Айдар Клиент',
      phone: '+77012236262',
      role: Role.CLIENT,
      portalRoles: [PortalRole.CLIENT],
      regionId: uralskRegion.id,
      clientProfile: { create: { city: 'Уральск' } },
    },
    include: { clientProfile: true },
  });

  await prisma.user.upsert({
    where: { email: 'atyrau_client@gp.kz' },
    update: { role: Role.CLIENT, portalRoles: [PortalRole.CLIENT], regionId: atyrauRegion.id },
    create: {
      email: 'atyrau_client@gp.kz',
      passwordHash,
      name: 'Серик Атырау',
      phone: '+77019990001',
      role: Role.CLIENT,
      portalRoles: [PortalRole.CLIENT],
      regionId: atyrauRegion.id,
      clientProfile: { create: { city: 'Атырау' } },
    },
  });

  const partnerUser = await prisma.user.upsert({
    where: { email: 'partner@gp.kz' },
    update: {
      role: Role.PARTNER,
      portalRoles: [PortalRole.CLIENT, PortalRole.SPECIALIST],
      regionId: uralskRegion.id,
    },
    create: {
      email: 'partner@gp.kz',
      passwordHash,
      name: 'Бауыржан Исполнитель',
      phone: '+77015551234',
      role: Role.PARTNER,
      portalRoles: [PortalRole.CLIENT, PortalRole.SPECIALIST],
      regionId: uralskRegion.id,
      partnerProfile: {
        create: {
          company: 'GP Услуги Уральск',
          city: 'Уральск',
          directions: [
            PartnerDirection.SEPTIC,
            PartnerDirection.LAWN,
            PartnerDirection.AUTOWATERING,
            PartnerDirection.PUMPS,
            PartnerDirection.FILTERS,
            PartnerDirection.SHOP,
          ],
          balance: 15000,
          isOnline: false,
          workStatus: WorkStatus.OFFLINE,
          lat: 51.243,
          lng: 51.377,
        },
      },
    },
    include: { partnerProfile: true },
  });

  await prisma.partnerProfile.update({
    where: { id: partnerUser.partnerProfile!.id },
    data: {
      regionId: uralskRegion.id,
      status: PartnerStatus.APPROVED,
      requestStatus: RequestStatus.APPROVED,
      partnerType: PartnerType.SPECIALIST,
      partnerRole: PartnerRole.MIXED_PARTNER,
      companyName: 'GP Услуги Уральск',
      fullName: partnerUser.name,
      approvedAt: new Date(),
    },
  });

  const partnerId = partnerUser.partnerProfile!.id;
  const clientId = clientUser.clientProfile!.id;

  const demoSubserviceIds = [
    ...new Set([
      ...expandDirectionsToSubservices([...partnerUser.partnerProfile!.directions]),
      ...FURNITURE_EXECUTOR_ACCESS_IDS,
    ]),
  ];
  await prisma.partnerServiceOffering.createMany({
    data: demoSubserviceIds.map((subserviceId) => ({
      partnerId,
      subserviceId,
      status: PartnerOfferingStatus.ACTIVE,
    })),
    skipDuplicates: true,
  });
  await prisma.partnerProfile.update({
    where: { id: partnerId },
    data: { serviceAccess: [...FURNITURE_EXECUTOR_ACCESS_IDS] },
  });

  let shopCount = 0;
  for (const item of SHOP_CATALOG) {
    const row = toProductSeedRow(item, partnerId);
    await prisma.product.upsert({
      where: { id: row.id },
      update: {
        name: row.name,
        price: row.price,
        stock: row.stock,
        category: row.category,
        brand: row.brand,
        description: row.description,
        specifications: row.specifications,
        inStock: row.inStock,
      },
      create: row,
    });
    shopCount += 1;
  }
  console.log(`GP Shop: ${shopCount} товаров (partner ${partnerUser.email})`);

  const marketStore = await prisma.store.upsert({
    where: { id: 'store-uralsk-gp-shop' },
    update: { name: 'GP Market Уральск', status: StoreStatus.APPROVED },
    create: {
      id: 'store-uralsk-gp-shop',
      name: 'GP Market Уральск',
      ownerId: partnerUser.id,
      regionId: uralskRegion.id,
      address: 'Уральск, пр. Достык 1',
      phone: partnerUser.phone,
      status: StoreStatus.APPROVED,
      isOfflineStore: false,
    },
  });

  const orkenShopUser = await prisma.user.upsert({
    where: { email: 'orken@gp.kz' },
    update: {
      name: 'ИП Оркен',
      phone: '+77001110009',
      role: Role.PARTNER,
      portalRoles: [PortalRole.CLIENT, PortalRole.SPECIALIST],
      regionId: uralskRegion.id,
    },
    create: {
      email: 'orken@gp.kz',
      passwordHash,
      name: 'ИП Оркен',
      phone: '+77001110009',
      role: Role.PARTNER,
      portalRoles: [PortalRole.CLIENT, PortalRole.SPECIALIST],
      regionId: uralskRegion.id,
    },
    include: { partnerProfile: true },
  });

  const orkenPartnerProfile =
    orkenShopUser.partnerProfile ??
    (await prisma.partnerProfile.create({
      data: {
        userId: orkenShopUser.id,
        regionId: uralskRegion.id,
        company: 'ИП Оркен',
        companyName: 'ИП Оркен',
        fullName: 'ИП Оркен',
        city: 'Уральск',
        directions: [PartnerDirection.SHOP],
        balance: 0,
      },
    }));

  await prisma.partnerProfile.update({
    where: { id: orkenPartnerProfile.id },
    data: {
      regionId: uralskRegion.id,
      status: PartnerStatus.APPROVED,
      requestStatus: RequestStatus.APPROVED,
      partnerType: PartnerType.SHOP,
      partnerRole: PartnerRole.SHOP,
      accountType: AccountType.LEGAL_ENTITY,
      company: 'ИП Оркен',
      companyName: 'ИП Оркен',
      fullName: 'ИП Оркен',
      city: 'Уральск',
      directions: [PartnerDirection.SHOP],
      approvedAt: new Date(),
    },
  });

  const orkenStore = await prisma.store.upsert({
    where: { id: 'store-uralsk-orken' },
    update: {
      name: 'ИП Оркен',
      ownerId: orkenShopUser.id,
      regionId: uralskRegion.id,
      address: 'Уральск',
      phone: orkenShopUser.phone,
      status: StoreStatus.APPROVED,
      isOfflineStore: false,
    },
    create: {
      id: 'store-uralsk-orken',
      name: 'ИП Оркен',
      ownerId: orkenShopUser.id,
      regionId: uralskRegion.id,
      address: 'Уральск',
      phone: orkenShopUser.phone,
      status: StoreStatus.APPROVED,
      isOfflineStore: false,
    },
  });

  let orkenMarketProductCount = 0;
  let orkenStockQuantity = 0;
  for (const item of ORKEN_URALSK_PRODUCTS) {
    const mpId = `mp-orken-${item.id}`;
    await prisma.marketProduct.upsert({
      where: { id: mpId },
      update: {
        storeId: orkenStore.id,
        regionId: uralskRegion.id,
        name: item.name,
        price: 0,
        categoryId: 'irrigation',
        description: item.description,
        images: [],
        isActive: false,
      },
      create: {
        id: mpId,
        storeId: orkenStore.id,
        regionId: uralskRegion.id,
        name: item.name,
        price: 0,
        categoryId: 'irrigation',
        description: item.description,
        images: [],
        isActive: false,
      },
    });
    await prisma.stock.upsert({
      where: { productId: mpId },
      update: {
        quantity: item.quantity,
        reservedQuantity: 0,
        storeId: orkenStore.id,
        regionId: uralskRegion.id,
      },
      create: {
        productId: mpId,
        storeId: orkenStore.id,
        regionId: uralskRegion.id,
        quantity: item.quantity,
        reservedQuantity: 0,
      },
    });
    orkenMarketProductCount += 1;
    orkenStockQuantity += item.quantity;
  }
  console.log(
    `ИП Оркен: ${orkenMarketProductCount} товаров, остаток ${orkenStockQuantity} шт. (цены не указаны)`,
  );

  let marketProductCount = 0;
  for (const item of SHOP_CATALOG.slice(0, 12)) {
    const row = toProductSeedRow(item, partnerId);
    const mpId = `mp-${row.id}`;
    await prisma.marketProduct.upsert({
      where: { id: mpId },
      update: {
        name: row.name,
        price: row.price,
        categoryId: row.category,
        description: row.description ?? '',
        isActive: row.inStock,
      },
      create: {
        id: mpId,
        storeId: marketStore.id,
        regionId: uralskRegion.id,
        name: row.name,
        price: row.price,
        categoryId: row.category,
        description: row.description ?? '',
        images: [],
        isActive: row.inStock,
      },
    });
    await prisma.stock.upsert({
      where: { productId: mpId },
      update: { quantity: row.stock, storeId: marketStore.id, regionId: uralskRegion.id },
      create: {
        productId: mpId,
        storeId: marketStore.id,
        regionId: uralskRegion.id,
        quantity: row.stock,
        reservedQuantity: 0,
      },
    });
    marketProductCount += 1;
  }
  console.log(`GP Market: ${marketProductCount} товаров в ${marketStore.name}`);

  const existingOrder = await prisma.order.findFirst({
    where: { clientId, status: OrderStatus.NEW },
  });

  if (!existingOrder) {
    await prisma.order.create({
      data: {
        clientId,
        category: OrderCategory.SEPTIC,
        status: OrderStatus.NEW,
        serviceName: 'Откачка септика',
        serviceId: 'septic-pumping',
        address: 'Уральск, ул. Мухит 112',
        city: 'Уральск',
        regionId: uralskRegion.id,
        clientName: clientUser.name,
        clientPhone: clientUser.phone,
        clientLat: 51.233,
        clientLng: 51.367,
        total: 15000,
        paymentMethod: PaymentMethod.KASPI_DIRECT_TO_PARTNER,
        septicVolume: 5,
        gpCommission: 300,
        items: { create: [] },
      },
    });
  }

  await prisma.balanceTransaction.create({
    data: {
      partnerId,
      type: 'TOPUP',
      amount: 15000,
      note: 'Стартовый баланс (seed)',
    },
  });

  const disposalZones = [
    { id: 'ural-disposal-1', name: 'Слив №1 — ЖМ Астана', lat: 51.248, lng: 51.385 },
    { id: 'ural-disposal-2', name: 'Слив №2 — Промузон', lat: 51.215, lng: 51.412 },
    { id: 'ural-disposal-3', name: 'Слив №3 — Зачагалка', lat: 51.262, lng: 51.335 },
    { id: 'ural-disposal-4', name: 'Слив №4 — Северный', lat: 51.278, lng: 51.398 },
  ];
  for (const z of disposalZones) {
    await prisma.geofenceZone.upsert({
      where: { id: z.id },
      update: { name: z.name, lat: z.lat, lng: z.lng },
      create: {
        id: z.id,
        name: z.name,
        type: 'SEPTIC_DISPOSAL',
        lat: z.lat,
        lng: z.lng,
        radiusM: 120,
        isOfficial: true,
        city: 'Уральск',
      },
    });
  }

  console.log('Seed OK');
  console.log('Super Admin:', admin.email, '/ password123');
  console.log('Region Admin:', 'uralsk_admin@gp.kz', '/ password123');
  console.log('Client (Uralsk):', clientUser.email, '/ password123');
  console.log('Client (Atyrau):', 'atyrau_client@gp.kz', '/ password123');
  console.log('Partner:', partnerUser.email, '/ password123');
  console.log('Regions:', MARKET_REGIONS.map((r) => r.code).join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
