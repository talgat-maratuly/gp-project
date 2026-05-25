import {
  OrderCategory,
  OrderStatus,
  PartnerDirection,
  PartnerOfferingStatus,
  PartnerStatus,
  PartnerType,
  PaymentMethod,
  PrismaClient,
  Role,
  StoreStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { expandDirectionsToSubservices } from '../src/common/partner-offerings.util';
import { FURNITURE_EXECUTOR_ACCESS_IDS } from '../src/common/furniture-executor.util';
import { MARKET_REGIONS } from './market-regions';
import { SHOP_CATALOG, toProductSeedRow } from './shop-catalog';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  for (const r of MARKET_REGIONS) {
    await prisma.region.upsert({
      where: { code: r.code },
      update: { name: r.name, isActive: r.isActive },
      create: r,
    });
  }
  const uralskRegion = await prisma.region.findUniqueOrThrow({ where: { code: 'uralsk' } });
  const atyrauRegion = await prisma.region.findUniqueOrThrow({ where: { code: 'atyrau' } });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gp.kz' },
    update: { role: Role.SUPER_ADMIN, regionId: null },
    create: {
      email: 'admin@gp.kz',
      passwordHash,
      name: 'GP Super Admin',
      role: Role.SUPER_ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'uralsk_admin@gp.kz' },
    update: { role: Role.REGION_ADMIN, regionId: uralskRegion.id },
    create: {
      email: 'uralsk_admin@gp.kz',
      passwordHash,
      name: 'Админ Уральск',
      role: Role.REGION_ADMIN,
      regionId: uralskRegion.id,
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: 'client@gp.kz' },
    update: { regionId: uralskRegion.id },
    create: {
      email: 'client@gp.kz',
      passwordHash,
      name: 'Айдар Клиент',
      phone: '+77012236262',
      role: Role.CLIENT,
      regionId: uralskRegion.id,
      clientProfile: { create: { city: 'Уральск' } },
    },
    include: { clientProfile: true },
  });

  await prisma.user.upsert({
    where: { email: 'atyrau_client@gp.kz' },
    update: { regionId: atyrauRegion.id },
    create: {
      email: 'atyrau_client@gp.kz',
      passwordHash,
      name: 'Серик Атырау',
      phone: '+77019990001',
      role: Role.CLIENT,
      regionId: atyrauRegion.id,
      clientProfile: { create: { city: 'Атырау' } },
    },
  });

  const partnerUser = await prisma.user.upsert({
    where: { email: 'partner@gp.kz' },
    update: { regionId: uralskRegion.id },
    create: {
      email: 'partner@gp.kz',
      passwordHash,
      name: 'Бауыржан Исполнитель',
      phone: '+77015551234',
      role: Role.PARTNER,
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
          isOnline: true,
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
      partnerType: PartnerType.SHOP,
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
