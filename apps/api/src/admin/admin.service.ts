import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PartnerStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PartnersService } from '../partners/partners.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UpdateOfferingStatusDto } from './dto/update-offering-status.dto';
import { AdminAssignOrderDto } from './dto/admin-assign-order.dto';
import { AdminUpdateOrderStatusDto } from './dto/admin-update-order-status.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private partners: PartnersService,
    private notifications: NotificationsService,
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

  async assignOrder(orderId: string, dto: AdminAssignOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Заказ не найден');
    if (order.status !== OrderStatus.NEW) {
      throw new BadRequestException('Назначить партнёра можно только для нового заказа');
    }

    const partner = await this.prisma.partnerProfile.findUnique({
      where: { id: dto.partnerId },
      include: { user: true },
    });
    if (!partner) throw new NotFoundException('Партнёр не найден');
    if (partner.status !== PartnerStatus.APPROVED) {
      throw new BadRequestException('Партнёр должен быть одобрен (active) для назначения заказов');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { partnerId: dto.partnerId },
      include: {
        client: { include: { user: { select: { name: true, phone: true } } } },
        partner: { include: { user: { select: { name: true, phone: true } } } },
      },
    });
  }

  async updateOrderStatus(orderId: string, dto: AdminUpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Заказ не найден');

    const data: { status: OrderStatus; partnerId?: string } = { status: dto.status };
    if (dto.partnerId) {
      const partner = await this.prisma.partnerProfile.findUnique({ where: { id: dto.partnerId } });
      if (!partner) throw new NotFoundException('Партнёр не найден');
      if (partner.status !== PartnerStatus.APPROVED) {
        throw new BadRequestException('Партнёр должен быть одобрен');
      }
      data.partnerId = dto.partnerId;
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data,
      include: {
        client: { include: { user: { select: { name: true, phone: true } } } },
        partner: { include: { user: { select: { name: true, phone: true } } } },
      },
    });
    await this.notifications.notifyOrderStatusChange(orderId, dto.status);
    return updated;
  }

  listMarketProducts() {
    return this.prisma.marketProduct.findMany({
      include: {
        store: { select: { id: true, name: true, status: true, regionId: true } },
        stock: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async moderateMarketProduct(
    productId: string,
    body: { isActive?: boolean; moderationNote?: string },
  ) {
    const product = await this.prisma.marketProduct.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Товар не найден');
    return this.prisma.marketProduct.update({
      where: { id: productId },
      data: {
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(body.moderationNote !== undefined ? { description: body.moderationNote } : {}),
      },
      include: { store: true, stock: true },
    });
  }

  listOfferingsForModeration(status?: string) {
    return this.prisma.partnerServiceOffering.findMany({
      where: status ? { status: status as never } : undefined,
      include: {
        partner: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
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
    await this.partners.syncServiceAccessFromOfferings(offering.partnerId);
    return updated;
  }
}
