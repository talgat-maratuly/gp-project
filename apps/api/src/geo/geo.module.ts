import { Module } from '@nestjs/common';
import { GeoController } from './geo.controller';
import { GeoService } from './geo.service';
import { GpsTrackingService } from './gps-tracking.service';
import { GeofenceService } from './geofence.service';
import { GeoGatewayModule } from './geo-gateway.module';
import { PartnersModule } from '../partners/partners.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrderLifecycleModule } from '../orders/order-lifecycle.module';

@Module({
  imports: [PartnersModule, NotificationsModule, GeoGatewayModule, OrderLifecycleModule],
  controllers: [GeoController],
  providers: [GeoService, GpsTrackingService, GeofenceService],
  exports: [GeoService, GpsTrackingService, GeofenceService, GeoGatewayModule],
})
export class GeoModule {}
