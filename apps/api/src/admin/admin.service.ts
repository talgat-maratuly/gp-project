import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PartnersService } from '../partners/partners.service';
import { UpdateOfferingStatusDto } from './dto/update-offering-status.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private partners: PartnersService,
  ) {}

  dashboard() {
    return Promise.all([
      this.prisma.user.count({ where: { role: 'CLIENT' } }),
      this.prisma.user.count({ where: { role: 'PARTNER' } }),
      this.prisma.order.count(),
      this.prisma.order.aggregate({ _sum: { gpCommission: true } }),
    ]).then(([clients, partners, orders, commissionSum]) => ({
      clients,
      partners,
      orders,
      totalCommission: commissionSum._sum.gpCommission ?? 0,
    }));
  }

  listClients() {
    return this.prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        clientProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listPartners() {
    return this.prisma.partnerProfile.findMany({
      include: {
        user: { select: { id: true, email: true, name: true, phone: true } },
        serviceOfferings: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listOrders() {
    return this.prisma.order.findMany({
      include: {
        client: { include: { user: { select: { name: true, phone: true } } } },
        partner: { include: { user: { select: { name: true, phone: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listCommissions() {
    return this.prisma.balanceTransaction.findMany({
      where: { type: 'COMMISSION' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOfferingStatus(offeringId: string, dto: UpdateOfferingStatusDto) {
    const offering = await this.prisma.partnerServiceOffering.findUnique({
      where: { id: offeringId },
    });
    if (!offering) throw new NotFoundException('Предложение не найдено');

    const updated = await this.prisma.partnerServiceOffering.update({
      where: { id: offeringId },
      data: {
        status: dto.status,
        ...(dto.moderationNote !== undefined ? { moderationNote: dto.moderationNote } : {}),
      },
    });
    await this.partners.syncDirectionsFromOfferings(offering.partnerId);
    return updated;
  }
}
