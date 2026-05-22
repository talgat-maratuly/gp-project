import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PartnersModule } from '../partners/partners.module';
import { PartnerBalanceModule } from '../partner-balance/partner-balance.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { GeoModule } from '../geo/geo.module';
import { FurnitureExecutorModule } from '../furniture-executor/furniture-executor.module';

@Module({
  imports: [PartnersModule, PartnerBalanceModule, NotificationsModule, GeoModule, FurnitureExecutorModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
