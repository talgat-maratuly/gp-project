import { Module } from '@nestjs/common';
import { GeoController } from './geo.controller';
import { GeoService } from './geo.service';
import { GpsTrackingService } from './gps-tracking.service';
import { GeofenceService } from './geofence.service';
import { GeoGateway } from './geo.gateway';
import { PartnersModule } from '../partners/partners.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PartnersModule, NotificationsModule],
  controllers: [GeoController],
  providers: [GeoService, GpsTrackingService, GeofenceService, GeoGateway],
  exports: [GeoService, GpsTrackingService, GeofenceService, GeoGateway],
})
export class GeoModule {}
