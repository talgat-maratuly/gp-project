import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  OrderStatus,
  PartnerOfferingStatus,
  PartnerRole,
  PartnerStatus,
  PartnerType,
  User,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PartnersService } from '../partners/partners.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegionAccessService } from '../common/region-access.service';
import { UpdateOfferingStatusDto } from './dto/update-offering-status.dto';
import { AdminAssignOrderDto } from './dto/admin-assign-order.dto';
import { AdminUpdateOrderStatusDto } from './dto/admin-update-order-status.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private partners: PartnersService,
    private notifications: NotificationsService,
    private regionAccess: RegionAccessService,
  ) {}

  /** Сервисный партнёр (маман), не чистый магазин */
  private specialistPartnerWhere() {
    return {
      OR: [
        { partnerRole: { in: [PartnerRole.SPECIALIST, PartnerRole.MIXED_PARTNER] } },
        {
          partnerType: {
            in: [
              PartnerType.SPECIALIST,
              PartnerType.SEPTIC_SERVICE,
              PartnerType.LAWN_MOWING,
              PartnerType.IRRIGATION_SERVICE,
              PartnerType.CLEANING_SERVICE,
              PartnerType.DELIVERY,
              PartnerType.OTHER,
            ],
          },
        },
        {
          partnerRole: null,
          OR: [{ partnerType: { not: PartnerType.SHOP } }, { partnerType: null }],
        },
      ],
    };
  }

  private offeringPartnerWhere(
    admin: User,
    opts?: { scope?: 'specialist'; approvedPartnerOnly?: boolean },
  ) {
    const parts: Array<Record<string, unknown>> = [];
    const regionId = this.regionAccess.regionWhere(admin).regionId;
    if (regionId) parts.push({ regionId });
    if (opts?.approvedPartnerOnly) parts.push({ status: PartnerStatus.APPROVED });
    if (opts?.scope === 'specialist') parts.push(this.specialistPartnerWhere());
    if (!parts.length) return {};
    return parts.length === 1 ? parts[0] : { AND: parts };
  }

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

    const assignedPartnerId = dto.assignedPartnerId ?? dto.partnerId;
    const partner = await this.prisma.partnerProfile.findUnique({
      where: { id: assignedPartnerId },
      include: { user: true },
    });
    if (!partner) throw new NotFoundException('Партнёр не найден');
    if (partner.status !== PartnerStatus.APPROVED) {
      throw new BadRequestException('Партнёр должен быть одобрен (active) для назначения заказов');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { assignedPartnerId },
      include: {
        client: { include: { user: { select: { name: true, phone: true } } } },
        partner: { include: { user: { select: { name: true, phone: true } } } },
      },
    });
  }

  async updateOrderStatus(orderId: string, dto: AdminUpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Заказ не найден');

    const data: { status: OrderStatus; assignedPartnerId?: string } = { status: dto.status };
    const assignId = dto.assignedPartnerId ?? dto.partnerId;
    if (assignId) {
      const partner = await this.prisma.partnerProfile.findUnique({ where: { id: assignId } });
      if (!partner) throw new NotFoundException('Партнёр не найден');
      if (partner.status !== PartnerStatus.APPROVED) {
        throw new BadRequestException('Партнёр должен быть одобрен');
      }
      data.assignedPartnerId = assignId;
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

  listMarketProducts(opts?: { regionId?: string; storeId?: string; q?: string; isActive?: boolean }) {
    const search = opts?.q?.trim();
    return this.prisma.marketProduct.findMany({
      where: {
        ...(opts?.regionId ? { regionId: opts.regionId } : {}),
        ...(opts?.storeId ? { storeId: opts.storeId } : {}),
        ...(opts?.isActive !== undefined ? { isActive: opts.isActive } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        store: { select: { id: true, name: true, status: true, regionId: true } },
        stock: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMarketProduct(body: {
    storeId: string;
    name: string;
    description?: string;
    categoryId: string;
    price: number;
    quantity: number;
    images?: string[];
    isActive?: boolean;
  }) {
    const store = await this.prisma.store.findUnique({ where: { id: body.storeId } });
    if (!store) throw new NotFoundException('Магазин не найден');

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.marketProduct.create({
        data: {
          storeId: store.id,
          regionId: store.regionId,
          name: body.name.trim(),
          description: body.description?.trim() || '',
          categoryId: body.categoryId,
          price: body.price,
          images: body.images ?? [],
          isActive: body.isActive ?? true,
        },
      });
      await tx.stock.create({
        data: {
          productId: product.id,
          storeId: store.id,
          regionId: store.regionId,
          quantity: body.quantity,
          reservedQuantity: 0,
        },
      });
      return tx.marketProduct.findUnique({
        where: { id: product.id },
        include: { store: true, stock: true },
      });
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

  listOfferingsForModeration(
    admin: User,
    opts?: { status?: string; scope?: 'specialist' },
  ) {
    const status = opts?.status as PartnerOfferingStatus | undefined;
    const approvedPartnerOnly =
      status === PartnerOfferingStatus.PENDING_MODERATION;
    const partnerWhere = this.offeringPartnerWhere(admin, {
      scope: opts?.scope,
      approvedPartnerOnly,
    });

    return this.prisma.partnerServiceOffering.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(Object.keys(partnerWhere).length ? { partner: partnerWhere } : {}),
      },
      include: {
        partner: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            region: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOfferingStatus(admin: User, offeringId: string, dto: UpdateOfferingStatusDto) {
    const offering = await this.prisma.partnerServiceOffering.findUnique({
      where: { id: offeringId },
      include: { partner: { select: { regionId: true } } },
    });
    if (!offering) throw new NotFoundException('Предложение не найдено');
    if (offering.partner.regionId) {
      this.regionAccess.assertCanAccessRegion(admin, offering.partner.regionId);
    }

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
