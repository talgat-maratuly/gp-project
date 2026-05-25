import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarketAdminService {
  constructor(private prisma: PrismaService) {}

  listRegionOrders(regionId: string) {
    return this.prisma.marketOrder.findMany({
      where: { regionId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        store: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, phone: true, email: true } },
      },
    });
  }
}
