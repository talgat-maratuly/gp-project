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

  await prisma.product.upsert({
    where: { id: 'seed-product-1' },
    update: {
      specifications: 'Зоны полива: 4\nПитание: трансформатор 24 VAC\nУстановка: внутренний монтаж',
    },
    create: {
      id: 'seed-product-1',
      partnerId,
      name: 'Контроллер полива Hunter XC 4 зоны',
      price: 62500,
      stock: 5,
      category: 'irrigation',
      brand: 'Hunter',
      description: 'Демо-товар партнёра',
      specifications: 'Зоны полива: 4\nПитание: трансформатор 24 VAC\nУстановка: внутренний монтаж',
      inStock: true,
    },
  });

  await prisma.product.upsert({
    where: { id: 'seed-product-2' },
    update: {
      specifications: 'Резьба присоединения: 1"\nТип: сетчатый\nДавление испытания: 16 бар',
    },
    create: {
      id: 'seed-product-2',
      partnerId,
      name: 'Фильтр сетчатый 1"',
      price: 14000,
      stock: 10,
      category: 'filters',
      description: 'Сетевой фильтр для водопровода.',
      specifications: 'Резьба присоединения: 1"\nТип: сетчатый\nДавление испытания: 16 бар',
      inStock: true,
    },
  });

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
