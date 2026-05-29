import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { PartnerOrdersController } from './partner-orders.controller';
import { OrdersService } from './orders.service';
import { OrderSchedulerService } from './order-scheduler.service';
import { OrdersLifecycleController } from './orders-lifecycle.controller';
import { PartnersModule } from '../partners/partners.module';
import { PartnerBalanceModule } from '../partner-balance/partner-balance.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrderLifecycleModule } from './order-lifecycle.module';
import { FurnitureExecutorModule } from '../furniture-executor/furniture-executor.module';
import { SpecialistRequestsModule } from '../specialist-requests/specialist-requests.module';

@Module({
  imports: [
    PartnersModule,
    PartnerBalanceModule,
    NotificationsModule,
    OrderLifecycleModule,
    FurnitureExecutorModule,
    SpecialistRequestsModule,
  ],
  controllers: [OrdersController, PartnerOrdersController, OrdersLifecycleController],
  providers: [OrdersService, OrderSchedulerService],
  exports: [OrdersService],
})
export class OrdersModule {}
