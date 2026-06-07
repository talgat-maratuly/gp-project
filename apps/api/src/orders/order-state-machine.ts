import { BadRequestException } from '@nestjs/common';
import { OrderActorRole, OrderStatus } from '@prisma/client';

/**
 * Единственный источник правды по переходам статусов заказа.
 * Любое изменение статуса обязано пройти через эту машину состояний.
 */

export const TERMINAL_STATUSES: ReadonlySet<OrderStatus> = new Set([
  OrderStatus.COMPLETED,
  OrderStatus.EXPIRED,
  OrderStatus.CANCELED_BY_CLIENT,
  OrderStatus.CANCELED_BY_SPEC,
  OrderStatus.NO_SHOW,
]);

/** Разрешённые переходы из каждого статуса. */
export const ORDER_TRANSITIONS: Readonly<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.NEW]: [
    OrderStatus.ACCEPTED,
    OrderStatus.EXPIRED,
    OrderStatus.CANCELED_BY_CLIENT,
  ],
  [OrderStatus.ACCEPTED]: [
    OrderStatus.ON_WAY,
    OrderStatus.IN_PROCESS,
    OrderStatus.NO_SHOW,
    OrderStatus.CANCELED_BY_CLIENT,
    OrderStatus.CANCELED_BY_SPEC,
  ],
  [OrderStatus.ON_WAY]: [
    OrderStatus.IN_PROCESS,
    OrderStatus.CANCELED_BY_CLIENT,
    OrderStatus.CANCELED_BY_SPEC,
  ],
  [OrderStatus.IN_PROCESS]: [
    OrderStatus.COMPLETED,
    OrderStatus.CANCELED_BY_CLIENT,
    OrderStatus.CANCELED_BY_SPEC,
  ],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.EXPIRED]: [],
  [OrderStatus.CANCELED_BY_CLIENT]: [],
  [OrderStatus.CANCELED_BY_SPEC]: [],
  [OrderStatus.NO_SHOW]: [],
};

/** Какой статус какая роль вправе выставлять (бизнес-правила отмены/прогресса). */
const ROLE_ALLOWED_TARGETS: Readonly<Record<OrderActorRole, OrderStatus[]>> = {
  [OrderActorRole.client]: [OrderStatus.CANCELED_BY_CLIENT],
  [OrderActorRole.spec]: [
    OrderStatus.ACCEPTED,
    OrderStatus.ON_WAY,
    OrderStatus.IN_PROCESS,
    OrderStatus.COMPLETED,
    OrderStatus.CANCELED_BY_SPEC,
  ],
  [OrderActorRole.system]: [OrderStatus.EXPIRED, OrderStatus.NO_SHOW],
  [OrderActorRole.admin]: [
    OrderStatus.ACCEPTED,
    OrderStatus.ON_WAY,
    OrderStatus.IN_PROCESS,
    OrderStatus.COMPLETED,
    OrderStatus.EXPIRED,
    OrderStatus.NO_SHOW,
    OrderStatus.CANCELED_BY_CLIENT,
    OrderStatus.CANCELED_BY_SPEC,
  ],
};

/** Статус → действие для журнала событий. */
export const STATUS_ACTION: Readonly<Record<OrderStatus, string>> = {
  [OrderStatus.NEW]: 'ORDER_CREATED',
  [OrderStatus.ACCEPTED]: 'ORDER_ACCEPTED',
  [OrderStatus.ON_WAY]: 'ORDER_ON_WAY',
  [OrderStatus.IN_PROCESS]: 'ORDER_STARTED',
  [OrderStatus.COMPLETED]: 'ORDER_COMPLETED',
  [OrderStatus.EXPIRED]: 'ORDER_EXPIRED',
  [OrderStatus.NO_SHOW]: 'ORDER_NO_SHOW',
  [OrderStatus.CANCELED_BY_CLIENT]: 'ORDER_CANCELED_BY_CLIENT',
  [OrderStatus.CANCELED_BY_SPEC]: 'ORDER_CANCELED_BY_SPEC',
};

const CANCEL_STATUSES: ReadonlySet<OrderStatus> = new Set([
  OrderStatus.CANCELED_BY_CLIENT,
  OrderStatus.CANCELED_BY_SPEC,
]);

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

export function isCancelStatus(status: OrderStatus): boolean {
  return CANCEL_STATUSES.has(status);
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

export function roleCanSet(role: OrderActorRole, to: OrderStatus): boolean {
  return ROLE_ALLOWED_TARGETS[role]?.includes(to) ?? false;
}

/**
 * Проверяет переход с точки зрения автомата и роли актора.
 * Бросает BadRequestException при нарушении — никаких «тихих» переходов.
 */
export function assertTransition(
  from: OrderStatus,
  to: OrderStatus,
  role: OrderActorRole,
): void {
  if (from === to) {
    throw new BadRequestException(`Заказ уже в статусе ${to}`);
  }
  if (isTerminal(from)) {
    throw new BadRequestException(`Заказ завершён (${from}) — переходы запрещены`);
  }
  if (!canTransition(from, to)) {
    throw new BadRequestException(`Недопустимый переход ${from} → ${to}`);
  }
  if (!roleCanSet(role, to)) {
    throw new BadRequestException(`Роль ${role} не может выставить статус ${to}`);
  }
}
