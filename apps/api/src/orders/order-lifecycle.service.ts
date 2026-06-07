import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderActorRole, OrderStatus, Prisma, SepticStage, WorkStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { GeoGateway } from '../geo/geo.gateway';
import { ORDER_STATUS_UI, SEPTIC_STAGE_UI } from '../common/order-status-ui.util';
import { OrderEventLogService } from './order-event-log.service';
import { AvailabilityService } from '../availability/availability.service';
import {
  assertTransition,
  isCancelStatus,
  STATUS_ACTION,
} from './order-state-machine';

export interface TransitionParams {
  orderId: string;
  to: OrderStatus;
  role: OrderActorRole;
  userId?: string | null;
  reason?: string;
  septicStage?: SepticStage | null;
  executorLat?: number;
  executorLng?: number;
  metadata?: Record<string, unknown>;
}

export const ORDER_INCLUDE = {
  items: { include: { product: true } },
  client: { include: { user: { select: { id: true, name: true, phone: true, email: true } } } },
  partner: { include: { user: { select: { id: true, name: true, phone: true } } } },
} satisfies Prisma.OrderInclude;

/**
 * Единая точка изменения статуса заказа.
 * Гарантирует: валидный переход → запись в БД → аудит → нотификация → realtime.
 * Никаких «тихих» изменений статуса в обход этого сервиса.
 */
@Injectable()
export class OrderLifecycleService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private events: OrderEventLogService,
    private gateway: GeoGateway,
    private availability: AvailabilityService,
  ) {}

  async transition(params: TransitionParams) {
    const order = await this.prisma.order.findUnique({ where: { id: params.orderId } });
    if (!order) throw new NotFoundException('Заказ не найден');

    assertTransition(order.status, params.to, params.role);

    if (isCancelStatus(params.to) && !params.reason?.trim()) {
      throw new BadRequestException('Укажите причину отмены (cancelReason)');
    }

    const data = this.buildUpdateData(params);

    const updated = await this.prisma.order.update({
      where: { id: params.orderId },
      data,
      include: ORDER_INCLUDE,
    });

    await this.events.record({
      orderId: params.orderId,
      userId: params.userId ?? null,
      role: params.role,
      action: STATUS_ACTION[params.to],
      fromStatus: order.status,
      toStatus: params.to,
      metadata: {
        ...(params.reason ? { reason: params.reason } : {}),
        ...(params.septicStage ? { septicStage: params.septicStage } : {}),
        ...(params.metadata ?? {}),
      },
    });

    await this.notifications.notifyOrderStatusChange(params.orderId, params.to, {
      reason: params.reason,
      fromStatus: order.status,
    });
    await this.syncPartnerWorkStatus(updated);
    this.broadcast(updated.id, updated.status, updated.septicStage);

    return updated;
  }

  private async syncPartnerWorkStatus(order: { id: string; assignedPartnerId: string | null; status: OrderStatus }) {
    if (!order.assignedPartnerId) return;
    if (order.status === OrderStatus.ACCEPTED || order.status === OrderStatus.ON_WAY) {
      await this.availability.recordStatus(order.assignedPartnerId, WorkStatus.ON_ROUTE, {
        orderId: order.id,
        reason: 'order_on_route',
      });
      return;
    }
    if (order.status === OrderStatus.IN_PROCESS) {
      await this.availability.recordStatus(order.assignedPartnerId, WorkStatus.BUSY, {
        orderId: order.id,
        reason: 'order_in_process',
      });
      return;
    }
    if (
      order.status === OrderStatus.COMPLETED ||
      order.status === OrderStatus.CANCELED_BY_CLIENT ||
      order.status === OrderStatus.CANCELED_BY_SPEC ||
      order.status === OrderStatus.NO_SHOW ||
      order.status === OrderStatus.EXPIRED
    ) {
      await this.availability.recordStatus(order.assignedPartnerId, WorkStatus.ONLINE, {
        orderId: order.id,
        reason: 'order_finished',
      });
    }
  }

  /** Только realtime-уведомление о подстатусе септика (статус не меняется). */
  async updateSepticStage(orderId: string, septicStage: SepticStage) {
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { septicStage },
      include: ORDER_INCLUDE,
    });
    this.broadcast(updated.id, updated.status, updated.septicStage);
    return updated;
  }

  broadcast(orderId: string, status: OrderStatus, septicStage?: SepticStage | null) {
    this.gateway.emitOrderStatus(orderId, {
      status,
      uiStatus: ORDER_STATUS_UI[status],
      septicStage: septicStage ?? null,
      septicStageUi: septicStage ? SEPTIC_STAGE_UI[septicStage] : null,
      at: new Date().toISOString(),
    });
  }

  private buildUpdateData(params: TransitionParams): Prisma.OrderUpdateInput {
    const now = new Date();
    const data: Prisma.OrderUpdateInput = { status: params.to };

    if (params.executorLat != null) data.executorLat = params.executorLat;
    if (params.executorLng != null) data.executorLng = params.executorLng;
    if (params.septicStage !== undefined) data.septicStage = params.septicStage;

    switch (params.to) {
      case OrderStatus.ACCEPTED:
        data.acceptedAt = now;
        break;
      case OrderStatus.COMPLETED:
        data.completedAt = now;
        break;
      case OrderStatus.EXPIRED:
        data.expiredAt = now;
        break;
      case OrderStatus.NO_SHOW:
        data.noShowAt = now;
        break;
      case OrderStatus.CANCELED_BY_CLIENT:
      case OrderStatus.CANCELED_BY_SPEC:
        data.canceledAt = now;
        data.cancelReason = params.reason?.trim();
        data.canceledByRole =
          params.to === OrderStatus.CANCELED_BY_CLIENT
            ? OrderActorRole.client
            : OrderActorRole.spec;
        break;
      default:
        break;
    }

    return data;
  }
}
