import { Injectable } from '@nestjs/common';
import { OrderActorRole, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface OrderEventInput {
  orderId: string;
  role: OrderActorRole;
  action: string;
  userId?: string | null;
  fromStatus?: OrderStatus | null;
  toStatus?: OrderStatus | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Неизменяемый журнал событий заказа.
 * Только запись и чтение — обновление/удаление не предусмотрены (аудит, споры, аналитика).
 */
@Injectable()
export class OrderEventLogService {
  constructor(private prisma: PrismaService) {}

  record(event: OrderEventInput) {
    return this.prisma.orderEventLog.create({
      data: {
        orderId: event.orderId,
        userId: event.userId ?? null,
        role: event.role,
        action: event.action,
        fromStatus: event.fromStatus ?? null,
        toStatus: event.toStatus ?? null,
        metadata: (event.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  listForOrder(orderId: string) {
    return this.prisma.orderEventLog.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
