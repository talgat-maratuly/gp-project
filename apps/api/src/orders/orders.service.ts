import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountType,
  FurnitureServiceType,
  OrderCategory,
  OrderStatus,
  PartnerType,
  PortalRole,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PartnersService } from '../partners/partners.service';
import { PartnerBalanceService } from '../partner-balance/partner-balance.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  calcOrderCommission,
  calcServiceTotal,
} from '../common/commission.util';
import {
  isOrderAllowedForPartnerType,
  isShopPartnerProfile,
  isServicePartnerProfile,
} from '../common/partner-access.util';
import {
  getPartnerBusySlots,
  isOrderSlotBlockedForPartner,
  PREFERRED_TIME_SLOTS,
} from '../common/schedule.util';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { sanitizeOrderForRole, sanitizeOrdersForRole } from '../common/order-response.util';
import { ORDER_STATUS_UI } from '../common/order-status-ui.util';
import { FurnitureExecutorService } from '../furniture-executor/furniture-executor.service';
import { RbacService } from '../rbac/rbac.service';
import { RbacRegionService } from '../rbac/rbac-region.service';
import { UserStatusService } from '../user-status/user-status.service';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';

const FURNITURE_SERVICE_ID_TO_TYPE: Record<string, FurnitureServiceType> = {
  'furniture-manufacturing': FurnitureServiceType.furniture_manufacturing,
  'furniture-assembly': FurnitureServiceType.furniture_assembly,
  'furniture-repair': FurnitureServiceType.furniture_repair,
};
import { GeoGateway } from '../geo/geo.gateway';

const PARTNER_FLOW: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.NEW]: OrderStatus.ACCEPTED,
  [OrderStatus.ACCEPTED]: OrderStatus.ON_THE_WAY,
  [OrderStatus.ON_THE_WAY]: OrderStatus.ARRIVED,
  [OrderStatus.ARRIVED]: OrderStatus.STARTED,
  [OrderStatus.STARTED]: OrderStatus.COMPLETED,
};

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private partners: PartnersService,
    private balance: PartnerBalanceService,
    private notifications: NotificationsService,
    private furnitureExecutor: FurnitureExecutorService,
    private gateway: GeoGateway,
    private rbac: RbacService,
    private rbacRegion: RbacRegionService,
    private userStatus: UserStatusService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { clientProfile: true, partnerProfile: true },
    });
    if (!actor) throw new NotFoundException('Пайдаланушы табылмады');
    this.userStatus.assertCanUsePlatform(actor);
    this.rbac.assertCanCreateOrder(actor);

    if (dto.onBehalfClientPhone) {
      return this.createForOperator(actor, dto);
    }
    if (actor.clientProfile) {
      return this.createForClient(userId, dto);
    }
    const roles = this.rbac.resolvePortalRoles(actor);
    const operatorRoles: PortalRole[] = [
      PortalRole.GP_OPERATOR,
      PortalRole.GLOBAL_OPERATOR,
      PortalRole.ADMIN,
    ];
    const isOperator = roles.some((r) => operatorRoles.includes(r));
    if (isOperator) {
      return this.createForOperator(actor, dto);
    }
    throw new ForbiddenException('Клиент профилі жоқ — onBehalfClientPhone көрсетіңіз');
  }

  private async createForOperator(
    actor: { id: string; regionId: string | null; name: string },
    dto: CreateOrderDto,
  ) {
    const regionId = this.rbacRegion.resolveOrderRegionId(
      actor as Parameters<RbacRegionService['resolveOrderRegionId']>[0],
      dto.regionId,
    );
    const phone = dto.onBehalfClientPhone?.trim();
    if (!phone) {
      throw new BadRequestException('Оператор тапсырысы үшін onBehalfClientPhone міндетті');
    }

    let clientUser = await this.prisma.user.findFirst({
      where: { phone },
      include: { clientProfile: true },
    });

    if (!clientUser) {
      const ts = Date.now();
      const passwordHash = await bcrypt.hash(randomBytes(16).toString('hex'), 10);
      clientUser = await this.prisma.user.create({
        data: {
          email: `guest_${ts}_${phone.replace(/\D/g, '')}@gp.local`,
          passwordHash,
          name: dto.onBehalfClientName?.trim() || 'Клиент GP',
          phone,
          role: Role.CLIENT,
          portalRoles: [PortalRole.CLIENT],
          regionId,
          clientProfile: {
            create: {
              accountType: AccountType.INDIVIDUAL,
              city: dto.onBehalfCity?.trim() || 'Уральск',
            },
          },
        },
        include: { clientProfile: true },
      });
    } else if (!clientUser.clientProfile) {
      await this.prisma.clientProfile.create({
        data: {
          userId: clientUser.id,
          accountType: AccountType.INDIVIDUAL,
          city: dto.onBehalfCity?.trim() || 'Уральск',
        },
      });
      clientUser = await this.prisma.user.findUniqueOrThrow({
        where: { id: clientUser.id },
        include: { clientProfile: true },
      });
    }

    if (!clientUser.clientProfile) {
      throw new BadRequestException('Клиент профилін құру мүмкін болмады');
    }

    return this.createOrderForClientProfile(clientUser, clientUser.clientProfile.id, dto);
  }

  private async createOrderForClientProfile(
    user: { id: string; name: string | null; phone: string | null },
    clientId: string,
    dto: CreateOrderDto,
  ) {
    this.validateSchedule(dto);
    const client = await this.prisma.clientProfile.findUniqueOrThrow({ where: { id: clientId } });
    const total = calcServiceTotal({
      serviceId: dto.serviceId,
      category: dto.category,
      septicVolume: dto.septicVolume,
      lawnAreaSqm: dto.lawnAreaSqm,
      fallbackTotal: dto.total,
    });
    const commission = calcOrderCommission(dto.category, {
      septicVolume: dto.septicVolume,
      serviceId: dto.serviceId,
    });
    const preferredDate = this.parsePreferredDate(dto.preferredDate);

    const order = await this.prisma.order.create({
      data: {
        clientId,
        category: dto.category,
        serviceName: dto.serviceName,
        serviceId: dto.serviceId,
        address: dto.address,
        clientName: user.name,
        clientPhone: user.phone,
        clientLat: dto.clientLat ?? 51.233,
        clientLng: dto.clientLng ?? 51.367,
        total,
        paymentMethod: dto.paymentMethod,
        paymentStatus: 'DIRECT_TO_PARTNER',
        comment: dto.comment,
        septicVolume: dto.septicVolume,
        gpCommission: commission,
        preferredDate,
        preferredTime: dto.flexibleTime ? null : dto.preferredTime,
        flexibleTime: dto.flexibleTime ?? false,
        lawnAreaSqm: dto.lawnAreaSqm,
        lawnWorkType: dto.lawnWorkType,
        scheduledDate: preferredDate,
        items: dto.items?.length
          ? {
              create: dto.items.map((i) => ({
                productId: i.productId,
                name: i.name,
                price: i.price,
                qty: i.qty,
              })),
            }
          : undefined,
      },
      include: this.orderInclude(),
    });

    const furnitureType = dto.serviceId ? FURNITURE_SERVICE_ID_TO_TYPE[dto.serviceId] : undefined;
    if (furnitureType) {
      await this.furnitureExecutor.createFromServiceRequest({
        serviceType: furnitureType,
        clientName: user.name || 'Клиент',
        phone: user.phone || '',
        address: dto.address,
        comment: dto.comment,
        city: client.city || undefined,
        totalPrice: Number(total),
        franchiseId: undefined,
      });
    }

    await this.notifications.notifyOrderStatusChange(order.id, OrderStatus.NEW);
    this.broadcastOrderStatus(order.id, OrderStatus.NEW);
    return order;
  }

  private broadcastOrderStatus(orderId: string, status: OrderStatus) {
    this.gateway.emitOrderStatus(orderId, {
      status,
      uiStatus: ORDER_STATUS_UI[status],
      at: new Date().toISOString(),
    });
  }

  private orderInclude() {
    return {
      items: { include: { product: true } },
      client: { include: { user: { select: { id: true, name: true, phone: true, email: true } } } },
      partner: {
        include: {
          user: { select: { id: true, name: true, phone: true } },
        },
      },
    };
  }

  private parsePreferredDate(value?: string) {
    if (!value) return undefined;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) throw new BadRequestException('Некорректная дата');
    return d;
  }

  private validateSchedule(dto: CreateOrderDto) {
    if (dto.category === OrderCategory.SEPTIC) {
      if (!dto.septicVolume || dto.septicVolume < 1) {
        throw new BadRequestException('Укажите объём септика');
      }
    }

    const lawnServices = [
      'lawn-roll-prep',
      'lawn-seeding',
      'lawn-trim',
      'grass-mowing',
      'lawn-roll',
    ];
    if (dto.category === OrderCategory.LAWN || (dto.serviceId && lawnServices.includes(dto.serviceId))) {
      if (!dto.lawnAreaSqm || dto.lawnAreaSqm < 1) {
        throw new BadRequestException('Укажите площадь в м²');
      }
    }

    const needsSlot = ['SEPTIC', 'LAWN', 'AUTOWATERING', 'FILTERS'].includes(dto.category);
    if (!needsSlot) return;

    if (dto.flexibleTime) return;

    if (!dto.preferredDate) {
      throw new BadRequestException('Укажите желаемую дату');
    }
    if (!dto.preferredTime || !PREFERRED_TIME_SLOTS.includes(dto.preferredTime as never)) {
      throw new BadRequestException('Выберите время из списка или «любое свободное»');
    }
  }

  async createForClient(userId: string, dto: CreateOrderDto) {
    const client = await this.prisma.clientProfile.findUnique({ where: { userId } });
    if (!client) throw new ForbiddenException('Только клиент может создавать заказы');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Пайдаланушы табылмады');
    const order = await this.createOrderForClientProfile(user, client.id, dto);
    return sanitizeOrderForRole(order, Role.CLIENT);
  }

  /** Только заказы, назначенные админом (без пула неназначенных). */
  private filterOrdersForPartner(
    orders: Awaited<ReturnType<typeof this.prisma.order.findMany>>,
    profileId: string,
    partnerType: PartnerType | null,
  ) {
    return orders.filter((o) => {
      if (o.assignedPartnerId !== profileId) return false;
      return isOrderAllowedForPartnerType(o, partnerType);
    });
  }

  async findForUser(userId: string, role: Role, filters?: { status?: OrderStatus; category?: string }) {
    if (role === Role.CLIENT) {
      const client = await this.prisma.clientProfile.findUnique({ where: { userId } });
      if (!client) return [];
      const list = await this.prisma.order.findMany({
        where: {
          clientId: client.id,
          ...(filters?.status && { status: filters.status }),
          ...(filters?.category && { category: filters.category as never }),
        },
        include: this.orderInclude(),
        orderBy: { createdAt: 'desc' },
      });
      return sanitizeOrdersForRole(list, Role.CLIENT);
    }

    if (role === Role.PARTNER) {
      const profile = await this.partners.ensurePartnerProfile(userId);
      if (profile.status !== 'APPROVED') return [];
      if (!isServicePartnerProfile(profile)) return [];
      const all = await this.prisma.order.findMany({
        where: {
          assignedPartnerId: profile.id,
          ...(filters?.status && { status: filters.status }),
          ...(filters?.category && { category: filters.category as never }),
        },
        include: this.orderInclude(),
        orderBy: { createdAt: 'desc' },
      });
      return this.filterOrdersForPartner(all, profile.id, profile.partnerType);
    }

    return this.prisma.order.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
      },
      include: this.orderInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPartnerOrders(userId: string) {
    return this.findForUser(userId, Role.PARTNER);
  }

  async findPartnerNewOrders(userId: string) {
    return this.findForUser(userId, Role.PARTNER, { status: OrderStatus.NEW });
  }

  async findOne(id: string, role?: Role) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.orderInclude(),
    });
    if (!order) throw new NotFoundException('Заказ не найден');
    return role ? sanitizeOrderForRole(order, role) : order;
  }

  private async chargeCommissionIfNeeded(
    order: {
      id: string;
      category: OrderCategory;
      septicVolume: number | null;
      gpCommission: unknown;
      commissionPaid: boolean;
      serviceName: string | null;
      serviceId: string | null;
    },
    partnerId: string,
  ) {
    if (order.commissionPaid) return;
    const commission =
      Number(order.gpCommission) ||
      calcOrderCommission(order.category, {
        septicVolume: order.septicVolume,
        serviceId: order.serviceId ?? undefined,
      });
    if (commission <= 0) return;

    await this.balance.chargeCommission(
      partnerId,
      order.id,
      commission,
      `Комиссия GP · ${order.serviceName || order.category}`,
    );
    await this.prisma.order.update({
      where: { id: order.id },
      data: { commissionPaid: true },
    });
  }

  async updateStatus(userId: string, role: Role, orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOne(orderId);

    if (role === Role.PARTNER) {
      const profile = await this.partners.ensurePartnerProfile(userId);
      if (!isServicePartnerProfile(profile)) {
        throw new ForbiddenException('Заказы услуг недоступны для партнёров-магазинов');
      }
      if (!isOrderAllowedForPartnerType(order, profile.partnerType)) {
        throw new ForbiddenException('Этот тип заказа недоступен для вашего профиля партнёра');
      }

      if (dto.status === OrderStatus.ACCEPTED) {
        if (order.status !== OrderStatus.NEW) throw new BadRequestException('Заказ уже принят');
        if (!order.assignedPartnerId) {
          throw new BadRequestException('Заказ не назначен администратором');
        }
        if (order.assignedPartnerId !== profile.id) {
          throw new BadRequestException('Заказ назначен другому партнёру');
        }

        const all = await this.prisma.order.findMany({ select: {
          assignedPartnerId: true, preferredDate: true, preferredTime: true, flexibleTime: true, status: true,
        } });
        const busySlots = getPartnerBusySlots(profile.id, all);
        if (isOrderSlotBlockedForPartner(order, busySlots)) {
          throw new BadRequestException('У вас уже есть заказ на это время');
        }

        const updated = await this.prisma.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.ACCEPTED,
            assignedPartnerId: profile.id,
            acceptedAt: new Date(),
            executorLat: dto.executorLat ?? profile.lat ?? undefined,
            executorLng: dto.executorLng ?? profile.lng ?? undefined,
          },
          include: this.orderInclude(),
        });
        if (order.category === OrderCategory.SEPTIC) {
          await this.prisma.trip.upsert({
            where: { orderId },
            create: { orderId, partnerId: profile.id },
            update: {},
          });
        }
        await this.notifications.notifyOrderStatusChange(orderId, OrderStatus.ACCEPTED);
        this.broadcastOrderStatus(orderId, OrderStatus.ACCEPTED);
        return updated;
      }

      if (order.assignedPartnerId !== profile.id) throw new ForbiddenException('Заказ не ваш');

      if (dto.status === OrderStatus.CANCELLED) {
        const updated = await this.prisma.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.CANCELLED },
          include: this.orderInclude(),
        });
        await this.notifications.notifyOrderStatusChange(orderId, OrderStatus.CANCELLED);
        this.broadcastOrderStatus(orderId, OrderStatus.CANCELLED);
        return updated;
      }

      const expected = PARTNER_FLOW[order.status];
      if (expected !== dto.status) {
        throw new BadRequestException(`Ожидался статус ${expected}`);
      }

      const data: Record<string, unknown> = {
        status: dto.status,
        executorLat: dto.executorLat,
        executorLng: dto.executorLng,
      };
      if (dto.status === OrderStatus.COMPLETED) {
        data.completedAt = new Date();
      }

      const updated = await this.prisma.order.update({
        where: { id: orderId },
        data,
        include: this.orderInclude(),
      });

      await this.notifications.notifyOrderStatusChange(orderId, dto.status);
      this.broadcastOrderStatus(orderId, dto.status);
      return updated;
    }

    throw new ForbiddenException();
  }

  async acceptPartnerOrder(userId: string, orderId: string) {
    return this.updateStatus(userId, Role.PARTNER, orderId, { status: OrderStatus.ACCEPTED });
  }

  async rejectPartnerOrder(userId: string, orderId: string) {
    return this.updateStatus(userId, Role.PARTNER, orderId, { status: OrderStatus.CANCELLED });
  }

  async updatePartnerOrderStatus(userId: string, orderId: string, dto: UpdateOrderStatusDto) {
    return this.updateStatus(userId, Role.PARTNER, orderId, dto);
  }

  async confirmByClient(userId: string, orderId: string) {
    const client = await this.prisma.clientProfile.findUnique({ where: { userId } });
    if (!client) throw new ForbiddenException();

    const order = await this.findOne(orderId);
    if (order.clientId !== client.id) throw new ForbiddenException('Не ваш заказ');
    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException('Подтвердить можно только после завершения работы партнёром');
    }
    if (!order.assignedPartnerId) throw new BadRequestException('Партнёр не назначен');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CLIENT_CONFIRMED,
        clientConfirmedAt: new Date(),
      },
      include: this.orderInclude(),
    });

    await this.chargeCommissionIfNeeded(order, order.assignedPartnerId);
    await this.notifications.notifyOrderStatusChange(orderId, OrderStatus.CLIENT_CONFIRMED);
    this.broadcastOrderStatus(orderId, OrderStatus.CLIENT_CONFIRMED);
    return sanitizeOrderForRole(updated, Role.CLIENT);
  }
}
