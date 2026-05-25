import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MarketOrderStatus, Role, User } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { RegionAccessService } from '../common/region-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMarketOrderDto } from './dto/create-market-order.dto';

const productSelect = {
  id: true,
  storeId: true,
  regionId: true,
  name: true,
  description: true,
  categoryId: true,
  price: true,
  images: true,
  isActive: true,
  store: { select: { id: true, name: true, status: true, isOfflineStore: true } },
  stock: { select: { quantity: true, reservedQuantity: true } },
} satisfies Prisma.MarketProductSelect;

@Injectable()
export class MarketService {
  constructor(
    private prisma: PrismaService,
    private regionAccess: RegionAccessService,
  ) {}

  listStoresByRegionId(regionId: string, categoryId?: string) {
    return this.prisma.store.findMany({
      where: { regionId, status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        regionId: true,
        address: true,
        phone: true,
        status: true,
        isOfflineStore: true,
        createdAt: true,
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
                ...(categoryId ? { categoryId } : {}),
              },
            },
          },
        },
      },
    });
  }

  listStores(user: User, categoryId?: string) {
    const regionFilter = this.regionAccess.regionWhere(user);
    return this.prisma.store.findMany({
      where: {
        ...regionFilter,
        status: 'ACTIVE',
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        regionId: true,
        address: true,
        phone: true,
        status: true,
        isOfflineStore: true,
        createdAt: true,
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
                ...(categoryId ? { categoryId } : {}),
              },
            },
          },
        },
      },
    });
  }

  listProductsByRegionId(
    regionId: string,
    opts?: { categoryId?: string; storeId?: string },
  ) {
    return this.prisma.marketProduct.findMany({
      where: {
        regionId,
        isActive: true,
        ...(opts?.categoryId ? { categoryId: opts.categoryId } : {}),
        ...(opts?.storeId ? { storeId: opts.storeId } : {}),
        store: { status: 'ACTIVE' },
        stock: { quantity: { gt: 0 } },
      },
      select: productSelect,
      orderBy: { name: 'asc' },
    });
  }

  listProducts(user: User, opts?: { categoryId?: string; storeId?: string }) {
    const regionFilter = this.regionAccess.regionWhere(user);
    return this.prisma.marketProduct.findMany({
      where: {
        ...regionFilter,
        isActive: true,
        ...(opts?.categoryId ? { categoryId: opts.categoryId } : {}),
        ...(opts?.storeId ? { storeId: opts.storeId } : {}),
        store: { status: 'ACTIVE' },
        stock: { quantity: { gt: 0 } },
      },
      select: productSelect,
      orderBy: { name: 'asc' },
    });
  }

  async getProductPublic(id: string, regionId: string) {
    const product = await this.prisma.marketProduct.findUnique({
      where: { id },
      select: productSelect,
    });
    if (!product || !product.isActive || product.regionId !== regionId) {
      throw new NotFoundException('Товар не найден');
    }
    return product;
  }

  async getProduct(user: User | null, id: string) {
    const product = await this.prisma.marketProduct.findUnique({
      where: { id },
      select: productSelect,
    });
    if (!product || !product.isActive) {
      throw new NotFoundException('Товар не найден');
    }
    if (user) {
      this.regionAccess.assertCanAccessRegion(user, product.regionId);
    }
    return product;
  }

  async createOrder(user: User, dto: CreateMarketOrderDto) {
    if (user.role !== Role.CLIENT) {
      throw new ForbiddenException('Заказ может оформить только клиент');
    }
    const clientRegionId = this.regionAccess.requireRegionId(user);

    const store = await this.prisma.store.findUnique({ where: { id: dto.storeId } });
    if (!store || store.status !== 'ACTIVE') {
      throw new NotFoundException('Магазин не найден или неактивен');
    }
    if (store.regionId !== clientRegionId) {
      throw new ForbiddenException('Нельзя заказать в магазине другого региона');
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.marketProduct.findMany({
      where: { id: { in: productIds } },
      include: { stock: true },
    });
    if (products.length !== productIds.length) {
      throw new NotFoundException('Один или несколько товаров не найдены');
    }

    let total = new Prisma.Decimal(0);
    const lineItems: { productId: string; name: string; price: Prisma.Decimal; qty: number }[] = [];

    for (const line of dto.items) {
      const product = products.find((p) => p.id === line.productId)!;
      if (product.storeId !== store.id) {
        throw new BadRequestException('Все товары должны быть из одного магазина');
      }
      if (product.regionId !== clientRegionId) {
        throw new ForbiddenException('Нельзя заказать товар из другого региона');
      }
      if (!product.isActive) {
        throw new BadRequestException(`Товар «${product.name}» недоступен`);
      }
      const available = (product.stock?.quantity ?? 0) - (product.stock?.reservedQuantity ?? 0);
      if (available < line.qty) {
        throw new BadRequestException(`Недостаточно остатка: ${product.name}`);
      }
      const lineTotal = product.price.mul(line.qty);
      total = total.add(lineTotal);
      lineItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        qty: line.qty,
      });
    }

    if (dto.deliveryType === 'DELIVERY' && !dto.address?.trim()) {
      throw new BadRequestException('Укажите адрес доставки');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const line of dto.items) {
        const updated = await tx.stock.updateMany({
          where: {
            productId: line.productId,
            quantity: { gte: line.qty },
          },
          data: {
            reservedQuantity: { increment: line.qty },
          },
        });
        if (updated.count === 0) {
          throw new BadRequestException('Остаток изменился, повторите заказ');
        }
      }

      return tx.marketOrder.create({
        data: {
          customerId: user.id,
          regionId: clientRegionId,
          storeId: store.id,
          totalAmount: total,
          status: MarketOrderStatus.NEW,
          deliveryType: dto.deliveryType,
          address: dto.address?.trim() || null,
          items: {
            create: lineItems.map((li) => ({
              productId: li.productId,
              name: li.name,
              price: li.price,
              qty: li.qty,
            })),
          },
        },
        include: {
          items: true,
          store: { select: { id: true, name: true } },
        },
      });
    });
  }
}
