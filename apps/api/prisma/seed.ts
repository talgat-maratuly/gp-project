import {
  OrderCategory,
  OrderStatus,
  PartnerDirection,
  PartnerOfferingStatus,
  PaymentMethod,
  PrismaClient,
  Role,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { expandDirectionsToSubservices } from '../src/common/partner-offerings.util';
import { SHOP_CATALOG, toProductSeedRow } from './shop-catalog';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gp.kz' },
    update: {},
    create: {
      email: 'admin@gp.kz',
      passwordHash,
      name: 'GP Admin',
      role: Role.ADMIN,
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: 'client@gp.kz' },
    update: {},
    create: {
      email: 'client@gp.kz',
      passwordHash,
      name: 'Айдар Клиент',
      phone: '+77012236262',
      role: Role.CLIENT,
      clientProfile: { create: { city: 'Уральск' } },
    },
    include: { clientProfile: true },
  });

  const partnerUser = await prisma.user.upsert({
    where: { email: 'partner@gp.kz' },
    update: {},
    create: {
      email: 'partner@gp.kz',
      passwordHash,
      name: 'Бауыржан Исполнитель',
      phone: '+77015551234',
      role: Role.PARTNER,
      partnerProfile: {
        create: {
          company: 'GP Услуги Уральск',
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

  const partnerId = partnerUser.partnerProfile!.id;
  const clientId = clientUser.clientProfile!.id;

  const demoSubserviceIds = expandDirectionsToSubservices([
    ...partnerUser.partnerProfile!.directions,
  ]);
  await prisma.partnerServiceOffering.createMany({
    data: demoSubserviceIds.map((subserviceId) => ({
      partnerId,
      subserviceId,
      status: PartnerOfferingStatus.ACTIVE,
    })),
    skipDuplicates: true,
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
  console.log('Admin:', admin.email, '/ password123');
  console.log('Client:', clientUser.email, '/ password123');
  console.log('Partner:', partnerUser.email, '/ password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
