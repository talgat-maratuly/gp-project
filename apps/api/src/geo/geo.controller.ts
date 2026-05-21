import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { GeoService } from './geo.service';
import { GpsTrackingService } from './gps-tracking.service';
import { GeofenceService } from './geofence.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { GpsPointDto } from './dto/gps-point.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('geo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('geo')
export class GeoController {
  constructor(
    private geo: GeoService,
    private tracking: GpsTrackingService,
    private geofence: GeofenceService,
  ) {}

  @Get('geofences')
  listGeofences() {
    return this.geofence.listActive();
  }

  @Get('orders/:orderId/tracking')
  getTracking(@Param('orderId') orderId: string, @CurrentUser() user: { id: string; role: Role }) {
    return this.geo.getOrderTracking(orderId, user.id, user.role);
  }

  @Get('orders/:orderId/history')
  getHistory(@Param('orderId') orderId: string) {
    return this.tracking.getTripHistory(orderId);
  }

  @Post('gps')
  @Roles(Role.PARTNER)
  ingestGps(@CurrentUser() user: { id: string }, @Body() dto: GpsPointDto) {
    return this.tracking.ingestGps(user.id, dto);
  }

  @Patch('location')
  @Roles(Role.PARTNER)
  updateLocation(@CurrentUser() user: { id: string }, @Body() dto: UpdateLocationDto) {
    return this.geo.updatePartnerLocation(user.id, dto.lat, dto.lng, dto.orderId);
  }

  @Post('orders/:orderId/mock-move')
  @Roles(Role.PARTNER)
  mockMove(@CurrentUser() user: { id: string }, @Param('orderId') orderId: string) {
    return this.geo.mockMove(user.id, orderId);
  }

  @Get('admin/fleet')
  @Roles(Role.ADMIN)
  fleet() {
    return this.tracking.getFleetSnapshot();
  }
}
