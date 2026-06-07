import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface OrderMsg {
  title: string;
  body: string;
}

interface NotifyOpts {
  reason?: string;
  fromStatus?: OrderStatus;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  /** Создаёт in-app уведомление и (стаб) отправляет push на устройства пользователя. */
  async notifyUser(userId: string, title: string, body: string, orderId?: string) {
    const notification = await this.prisma.notification.create({
      data: { userId, title, body, orderId },
    });
    await this.dispatchPush(userId, title, body, orderId);
    return notification;
  }

  /**
   * Событийная рассылка по смене статуса заказа.
   * Получатели и тексты определяются статусом (см. спецификацию lifecycle).
   */
  async notifyOrderStatusChange(orderId: string, status: OrderStatus, opts: NotifyOpts = {}) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: { include: { user: true } },
        partner: { include: { user: true } },
      },
    });
    if (!order) return;

    const clientUserId = order.client.userId;
    const partnerUserId = order.partner?.userId;

    const toClient = this.clientMessage(status, order.serviceName, opts);
    if (toClient && clientUserId) {
      await this.notifyUser(clientUserId, toClient.title, toClient.body, orderId);
    }

    const toSpec = this.specMessage(status, order.serviceName);
    if (toSpec && partnerUserId) {
      await this.notifyUser(partnerUserId, toSpec.title, toSpec.body, orderId);
    }
  }

  private clientMessage(
    status: OrderStatus,
    serviceName: string | null,
    opts: NotifyOpts,
  ): OrderMsg | null {
    switch (status) {
      case OrderStatus.ACCEPTED:
        return { title: 'Заказ принят', body: 'Исполнитель принял вашу заявку' };
      case OrderStatus.ON_WAY:
        return { title: 'Специалист в пути', body: 'Исполнитель выехал к вам' };
      case OrderStatus.IN_PROCESS:
        return { title: 'Работа началась', body: 'Исполнитель приступил к работе' };
      case OrderStatus.COMPLETED:
        return { title: 'Заказ выполнен', body: 'Подтвердите выполнение в приложении' };
      case OrderStatus.EXPIRED:
        return {
          title: 'Заявка истекла',
          body: 'Никто не принял заказ. Перенесите время или создайте новую заявку.',
        };
      case OrderStatus.NO_SHOW:
        return {
          title: 'Специалист не приехал',
          body: 'Перенесите заказ или выберите другого специалиста.',
        };
      case OrderStatus.CANCELED_BY_SPEC: {
        const body =
          opts.fromStatus === OrderStatus.ACCEPTED
            ? 'Специалист отменил заказ. Дождитесь другого специалиста.'
            : 'Специалист остановил заказ. Перенесите заявку.';
        return { title: 'Заказ отменён исполнителем', body };
      }
      default:
        return null;
    }
  }

  private specMessage(status: OrderStatus, serviceName: string | null): OrderMsg | null {
    switch (status) {
      case OrderStatus.NEW:
        return { title: 'Новая заявка', body: serviceName || 'Новый заказ в вашем направлении' };
      case OrderStatus.COMPLETED:
        return { title: 'Заказ выполнен', body: 'Заказ успешно завершён' };
      case OrderStatus.CANCELED_BY_CLIENT:
        return { title: 'Клиент отменил заказ', body: 'Заявка отменена клиентом' };
      case OrderStatus.NO_SHOW:
        return {
          title: 'Неявка',
          body: 'Вы не приступили к заказу вовремя. Возможны штрафные меры.',
        };
      default:
        return null;
    }
  }

  /** Стаб push-доставки. Готов к подключению FCM/APNs через UserDevice.pushToken. */
  private async dispatchPush(userId: string, title: string, body: string, orderId?: string) {
    const devices = await this.prisma.userDevice.findMany({
      where: { userId, pushToken: { not: null } },
      select: { pushToken: true },
    });
    if (!devices.length) return;
    // TODO: интеграция с FCM/APNs. Пока только лог намерения доставки.
    this.logger.debug(
      `push → user=${userId} devices=${devices.length} title="${title}" order=${orderId ?? '-'}`,
    );
  }

  listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  markRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }
}
