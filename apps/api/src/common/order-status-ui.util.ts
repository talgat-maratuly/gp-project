import { OrderStatus } from '@prisma/client';

/** API enum → UI id (как на фронтенде) */
export const ORDER_STATUS_UI: Record<OrderStatus, string> = {
  [OrderStatus.NEW]: 'new',
  [OrderStatus.ACCEPTED]: 'accepted',
  [OrderStatus.ON_THE_WAY]: 'on_way',
  [OrderStatus.ARRIVED]: 'on_site',
  [OrderStatus.STARTED]: 'started',
  [OrderStatus.LOADED]: 'loaded',
  [OrderStatus.DISPOSAL_ARRIVED]: 'disposal_arrived',
  [OrderStatus.DISPOSAL_COMPLETED]: 'disposal_completed',
  [OrderStatus.COMPLETED]: 'done',
  [OrderStatus.CLIENT_CONFIRMED]: 'client_confirmed',
  [OrderStatus.CANCELLED]: 'cancelled',
};
