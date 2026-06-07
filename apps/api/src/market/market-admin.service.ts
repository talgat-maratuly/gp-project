import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarketAdminService {
  constructor(private prisma: PrismaService) {}

  listRegionOrders(regionId: string) {
    return this.listOrders({ regionId });
  }

  listOrders(where: Prisma.MarketOrderWhereInput = {}) {
    return this.prisma.marketOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        store: { select: { id: true, name: true, phone: true, address: true, status: true } },
        region: { select: { id: true, name: true, code: true } },
        customer: { select: { id: true, name: true, phone: true, email: true } },
      },
    });
  }

  listStores(where: Prisma.StoreWhereInput = {}) {
    return this.prisma.store.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        region: { select: { id: true, name: true, code: true } },
        owner: { select: { id: true, name: true, phone: true, email: true } },
        _count: { select: { products: true, orders: true } },
      },
    });
  }
}
