import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async notifyUser(userId: string, title: string, body: string, orderId?: string) {
    return this.prisma.notification.create({
      data: { userId, title, body, orderId },
    });
  }

  async notifyOrderStatusChange(orderId: string, status: OrderStatus) {
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

    const clientMessages: Partial<Record<OrderStatus, { title: string; body: string }>> = {
      ACCEPTED: { title: 'Заказ принят', body: 'Исполнитель принял вашу заявку' },
      ON_THE_WAY: { title: 'Исполнитель в пути', body: 'Водитель/мастер выехал к вам' },
      ARRIVED: { title: 'Исполнитель на месте', body: 'Мастер приехал по вашему адресу' },
      COMPLETED: { title: 'Заказ выполнен', body: 'Спасибо! Заказ завершён' },
      CANCELLED: { title: 'Заказ отменён', body: 'Заявка была отменена' },
    };

    const partnerMessages: Partial<Record<OrderStatus, { title: string; body: string }>> = {
      NEW: { title: 'Новая заявка', body: order.serviceName || 'Новый заказ в вашем направлении' },
    };

    const cm = clientMessages[status];
    if (cm) await this.notifyUser(clientUserId, cm.title, cm.body, orderId);

    if (status === OrderStatus.NEW && partnerUserId) {
      const pm = partnerMessages.NEW;
      if (pm) await this.notifyUser(partnerUserId, pm.title, pm.body, orderId);
    }
  }

  async listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }
}
