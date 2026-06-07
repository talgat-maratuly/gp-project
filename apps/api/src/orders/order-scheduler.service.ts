import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderActorRole, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrderLifecycleService } from './order-lifecycle.service';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/**
 * Автоматика жизненного цикла заказа (системные события, role = system):
 * предупреждение NEW, истечение NEW, напоминание ACCEPTED, неявка NO_SHOW.
 */
@Injectable()
export class OrderSchedulerService {
  private readonly logger = new Logger(OrderSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private lifecycle: OrderLifecycleService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async tick() {
    const now = new Date();
    await this.warnNewOrders(now);
    await this.expireNewOrders(now);
    await this.remindAcceptedOrders(now);
    await this.markNoShows(now);
  }

  /** За 15 минут до времени заказ всё ещё NEW → предупредить клиента. */
  private async warnNewOrders(now: Date) {
    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.NEW,
        newWarningSentAt: null,
        scheduledDate: { gt: now, lte: new Date(now.getTime() + 15 * MIN) },
      },
      include: { client: true },
    });
    for (const order of orders) {
      await this.notifications.notifyUser(
        order.client.userId,
        'Заказ ещё не принят',
        'Никто из специалистов пока не принял заявку. Вы можете изменить время или создать новую заявку.',
        order.id,
      );
      await this.prisma.order.update({
        where: { id: order.id },
        data: { newWarningSentAt: now },
      });
    }
  }

  /** Время заказа прошло, всё ещё NEW → EXPIRED. */
  private async expireNewOrders(now: Date) {
    const orders = await this.prisma.order.findMany({
      where: { status: OrderStatus.NEW, scheduledDate: { lt: now } },
      select: { id: true },
    });
    for (const order of orders) {
      await this.safeTransition(order.id, OrderStatus.EXPIRED);
    }
  }

  /** За 1 час до времени напомнить принявшему специалисту. */
  private async remindAcceptedOrders(now: Date) {
    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.ACCEPTED,
        acceptedReminderSentAt: null,
        scheduledDate: { gt: now, lte: new Date(now.getTime() + HOUR) },
        assignedPartnerId: { not: null },
      },
      include: { partner: true },
    });
    for (const order of orders) {
      if (!order.partner) continue;
      await this.notifications.notifyUser(
        order.partner.userId,
        'Скоро заказ',
        'У вас предстоящий заказ. Подготовьтесь к выезду.',
        order.id,
      );
      await this.prisma.order.update({
        where: { id: order.id },
        data: { acceptedReminderSentAt: now },
      });
    }
  }

  /** ACCEPTED, время прошло, специалист не приступил (> 1 дня) → NO_SHOW. */
  private async markNoShows(now: Date) {
    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.ACCEPTED,
        scheduledDate: { lt: new Date(now.getTime() - DAY) },
      },
      select: { id: true },
    });
    for (const order of orders) {
      await this.safeTransition(order.id, OrderStatus.NO_SHOW);
    }
  }

  private async safeTransition(orderId: string, to: OrderStatus) {
    try {
      await this.lifecycle.transition({ orderId, to, role: OrderActorRole.system });
    } catch (err) {
      this.logger.warn(`auto-transition ${orderId} → ${to} пропущен: ${(err as Error).message}`);
    }
  }
}
