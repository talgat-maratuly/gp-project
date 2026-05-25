import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type RegionScopedUser = User & { regionId: string | null };

@Injectable()
export class RegionAccessService {
  constructor(private prisma: PrismaService) {}

  isSuperAdmin(user: RegionScopedUser): boolean {
    return user.role === Role.SUPER_ADMIN || user.role === Role.ADMIN;
  }

  isRegionAdmin(user: RegionScopedUser): boolean {
    return user.role === Role.REGION_ADMIN;
  }

  requireRegionId(user: RegionScopedUser): string {
    if (this.isSuperAdmin(user)) {
      throw new ForbiddenException('Для этой операции нужен регион пользователя, не супер-админ');
    }
    if (!user.regionId) {
      throw new ForbiddenException('Регион пользователя не задан');
    }
    return user.regionId;
  }

  /** Фильтр Prisma: только свой регион, кроме SUPER_ADMIN/ADMIN */
  regionWhere(user: RegionScopedUser): { regionId?: string } {
    if (this.isSuperAdmin(user)) return {};
    const regionId = this.requireRegionId(user);
    return { regionId };
  }

  assertCanAccessRegion(user: RegionScopedUser, regionId: string): void {
    if (this.isSuperAdmin(user)) return;
    if (!user.regionId || user.regionId !== regionId) {
      throw new ForbiddenException('Доступ к этому региону запрещён');
    }
  }

  /** Игнорирует regionId из query/body — берёт только регион пользователя */
  resolveClientRegionId(user: RegionScopedUser, requestedRegionId?: string): string {
    if (this.isSuperAdmin(user)) {
      if (requestedRegionId) {
        this.assertRegionActive(requestedRegionId);
        return requestedRegionId;
      }
      return this.requireRegionId(user);
    }
    const userRegion = this.requireRegionId(user);
    if (requestedRegionId && requestedRegionId !== userRegion) {
      throw new ForbiddenException('Нельзя запрашивать данные другого региона');
    }
    return userRegion;
  }

  async assertRegionActive(regionId: string): Promise<void> {
    const region = await this.prisma.region.findUnique({ where: { id: regionId } });
    if (!region || !region.isActive) {
      throw new NotFoundException('Регион не найден или неактивен');
    }
  }

  async assertStoreInUserRegion(user: RegionScopedUser, storeId: string) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Магазин не найден');
    this.assertCanAccessRegion(user, store.regionId);
    return store;
  }

  async assertProductInUserRegion(user: RegionScopedUser, productId: string) {
    const product = await this.prisma.marketProduct.findUnique({
      where: { id: productId },
      include: { stock: true, store: true },
    });
    if (!product) throw new NotFoundException('Товар не найден');
    this.assertCanAccessRegion(user, product.regionId);
    return product;
  }

  assertPartnerOwnsStore(user: RegionScopedUser, store: { ownerId: string }) {
    if (user.role !== Role.PARTNER) {
      throw new ForbiddenException('Только партнёр может управлять магазином');
    }
    if (store.ownerId !== user.id) {
      throw new ForbiddenException('Это не ваш магазин');
    }
  }
}
