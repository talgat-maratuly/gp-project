import { Role } from '@prisma/client';

/** Клиентам не отдаём комиссию GP и служебные поля партнёра. */
export function sanitizeOrderForRole<T extends Record<string, unknown>>(order: T, role: Role): T {
  if (role !== Role.CLIENT) return order;
  const { gpCommission: _c, commissionPaid: _p, ...rest } = order;
  return rest as T;
}

export function sanitizeOrdersForRole<T extends Record<string, unknown>>(orders: T[], role: Role): T[] {
  return orders.map((o) => sanitizeOrderForRole(o, role));
}
