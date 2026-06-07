import { OrderStatus, SepticStage } from '@prisma/client';

/** API enum → UI id (как на фронтенде) */
export const ORDER_STATUS_UI: Record<OrderStatus, string> = {
  [OrderStatus.NEW]: 'new',
  [OrderStatus.ACCEPTED]: 'accepted',
  [OrderStatus.ON_WAY]: 'on_way',
  [OrderStatus.IN_PROCESS]: 'in_process',
  [OrderStatus.COMPLETED]: 'completed',
  [OrderStatus.EXPIRED]: 'expired',
  [OrderStatus.CANCELED_BY_CLIENT]: 'canceled_by_client',
  [OrderStatus.CANCELED_BY_SPEC]: 'canceled_by_spec',
  [OrderStatus.NO_SHOW]: 'no_show',
};

/** Под-статус септик-рейса → UI id */
export const SEPTIC_STAGE_UI: Record<SepticStage, string> = {
  [SepticStage.ARRIVED]: 'on_site',
  [SepticStage.PUMPING]: 'pumping',
  [SepticStage.LOADED]: 'loaded',
  [SepticStage.DISPOSAL_ARRIVED]: 'disposal_arrived',
  [SepticStage.DISPOSAL_COMPLETED]: 'disposal_completed',
};
