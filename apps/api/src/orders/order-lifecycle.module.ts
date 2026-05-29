import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { GeoGatewayModule } from '../geo/geo-gateway.module';
import { OrderEventLogService } from './order-event-log.service';
import { OrderLifecycleService } from './order-lifecycle.service';

/**
 * Ядро жизненного цикла заказа: машина состояний + аудит + realtime.
 * Импортируется orders / geo / admin — без циклов (gateway вынесен отдельно).
 */
@Module({
  imports: [NotificationsModule, GeoGatewayModule],
  providers: [OrderEventLogService, OrderLifecycleService],
  exports: [OrderEventLogService, OrderLifecycleService],
})
export class OrderLifecycleModule {}
