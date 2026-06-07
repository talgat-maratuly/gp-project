import { OrderStatus } from '@prisma/client';

export const PREFERRED_TIME_SLOTS = ['09:00', '11:00', '13:00', '15:00', '17:00'] as const;

export type PreferredTimeSlot = (typeof PREFERRED_TIME_SLOTS)[number];

export function dateKey(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().slice(0, 10);
}

export type BusySlot = { date: string; time: string };

/** Слоты, занятые принятыми заказами партнёра (фиксированное время). */
export function getPartnerBusySlots(
  partnerId: string,
  orders: Array<{
    assignedPartnerId: string | null;
    preferredDate: Date | null;
    preferredTime: string | null;
    flexibleTime: boolean;
    status: OrderStatus;
  }>,
): BusySlot[] {
  const blocking: OrderStatus[] = [
    OrderStatus.ACCEPTED,
    OrderStatus.ON_WAY,
    OrderStatus.IN_PROCESS,
    OrderStatus.COMPLETED,
  ];

  return orders
    .filter(
      (o) =>
        o.assignedPartnerId === partnerId &&
        !o.flexibleTime &&
        o.preferredDate &&
        o.preferredTime &&
        blocking.includes(o.status),
    )
    .map((o) => ({
      date: dateKey(o.preferredDate)!,
      time: o.preferredTime!,
    }));
}

export function isOrderSlotBlockedForPartner(
  order: {
    flexibleTime: boolean;
    preferredDate: Date | null;
    preferredTime: string | null;
  },
  busySlots: BusySlot[],
): boolean {
  if (order.flexibleTime) return false;
  const dk = dateKey(order.preferredDate);
  if (!dk || !order.preferredTime) return false;
  return busySlots.some((s) => s.date === dk && s.time === order.preferredTime);
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

export const MAP_STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.NEW]: 'Новый заказ',
  [OrderStatus.ACCEPTED]: 'Заказ принят',
  [OrderStatus.ON_WAY]: 'Исполнитель в пути',
  [OrderStatus.IN_PROCESS]: 'Работа идёт',
  [OrderStatus.COMPLETED]: 'Заказ выполнен',
  [OrderStatus.EXPIRED]: 'Заявка истекла',
  [OrderStatus.NO_SHOW]: 'Неявка специалиста',
  [OrderStatus.CANCELED_BY_CLIENT]: 'Отменён клиентом',
  [OrderStatus.CANCELED_BY_SPEC]: 'Отменён исполнителем',
};
