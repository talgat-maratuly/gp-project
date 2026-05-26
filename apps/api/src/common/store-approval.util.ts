import { ForbiddenException } from '@nestjs/common';
import { Store, StoreStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const APPROVED_STORE_STATUSES = new Set<StoreStatus>([
  StoreStatus.APPROVED,
  StoreStatus.ACTIVE,
]);

export async function findPrimaryStoreForOwner(
  prisma: PrismaService,
  ownerId: string,
): Promise<Store | null> {
  return prisma.store.findFirst({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function assertApprovedStoreForOwner(
  prisma: PrismaService,
  ownerId: string,
): Promise<Store> {
  const store = await findPrimaryStoreForOwner(prisma, ownerId);
  if (!store) {
    throw new ForbiddenException(
      'Сначала зарегистрируйте магазин и дождитесь одобрения администратором',
    );
  }
  if (!APPROVED_STORE_STATUSES.has(store.status)) {
    throw new ForbiddenException('Добавление товаров доступно после одобрения магазина');
  }
  return store;
}
