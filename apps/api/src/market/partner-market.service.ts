import { BadRequestException, Injectable } from '@nestjs/common';
import { PartnerStatus, StoreStatus, User } from '@prisma/client';
import { RegionAccessService } from '../common/region-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartnerProductDto } from './dto/create-partner-product.dto';
import { CreatePartnerStoreDto } from './dto/create-partner-store.dto';
import { UpdatePartnerProductDto } from './dto/update-partner-product.dto';

@Injectable()
export class PartnerMarketService {
  constructor(
    private prisma: PrismaService,
    private regionAccess: RegionAccessService,
  ) {}

  listMyStores(ownerId: string) {
    return this.prisma.store.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      include: {
        region: { select: { id: true, name: true, code: true } },
        _count: { select: { products: true } },
      },
    });
  }

  async createStore(user: User, dto: CreatePartnerStoreDto) {
    const regionId = this.regionAccess.requireRegionId(user);
    const profile = await this.prisma.partnerProfile.findUnique({ where: { userId: user.id } });
    if (profile?.status !== PartnerStatus.APPROVED) {
      throw new BadRequestException('Сначала дождитесь одобрения заявки партнёра');
    }
    return this.prisma.store.create({
      data: {
        name: dto.name.trim(),
        ownerId: user.id,
        regionId,
        address: dto.address?.trim() || null,
        phone: dto.phone?.trim() || user.phone || null,
        isOfflineStore: dto.isOfflineStore ?? false,
        status: StoreStatus.PENDING_REVIEW,
      },
      include: { region: { select: { id: true, name: true, code: true } } },
    });
  }

  async createProduct(user: User, dto: CreatePartnerProductDto) {
    const regionId = this.regionAccess.requireRegionId(user);
    const store = await this.regionAccess.assertStoreInUserRegion(user, dto.storeId);
    this.regionAccess.assertPartnerOwnsStore(user, store);

    if (store.regionId !== regionId) {
      throw new BadRequestException('Магазин не в вашем регионе');
    }

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.marketProduct.create({
        data: {
          storeId: store.id,
          regionId,
          name: dto.name.trim(),
          description: dto.description?.trim() || '',
          categoryId: dto.categoryId,
          price: dto.price,
          images: dto.images ?? [],
          isActive: dto.isActive ?? true,
        },
      });
      await tx.stock.create({
        data: {
          productId: product.id,
          storeId: store.id,
          regionId,
          quantity: dto.quantity,
          reservedQuantity: 0,
        },
      });
      return tx.marketProduct.findUnique({
        where: { id: product.id },
        include: { stock: true, store: { select: { id: true, name: true } } },
      });
    });
  }

  async updateProduct(user: User, productId: string, dto: UpdatePartnerProductDto) {
    const product = await this.regionAccess.assertProductInUserRegion(user, productId);
    const store = await this.regionAccess.assertStoreInUserRegion(user, product.storeId);
    this.regionAccess.assertPartnerOwnsStore(user, store);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.marketProduct.update({
        where: { id: productId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
          ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
          ...(dto.price !== undefined ? { price: dto.price } : {}),
          ...(dto.images !== undefined ? { images: dto.images } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
        include: { stock: true, store: { select: { id: true, name: true } } },
      });
      if (dto.quantity !== undefined) {
        await tx.stock.update({
          where: { productId },
          data: { quantity: dto.quantity },
        });
      }
      return updated;
    });
  }
}
