import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { GeoService } from './geo.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('geo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('geo')
export class GeoController {
  constructor(private geo: GeoService) {}

  @Get('orders/:orderId/tracking')
  tracking(@Param('orderId') orderId: string, @CurrentUser() user: { id: string; role: Role }) {
    return this.geo.getOrderTracking(orderId, user.id, user.role);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.PARTNER)
  @Patch('location')
  updateLocation(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateLocationDto & { orderId?: string },
  ) {
    return this.geo.updatePartnerLocation(user.id, dto.lat, dto.lng, dto.orderId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.PARTNER)
  @Post('orders/:orderId/mock-move')
  mockMove(@CurrentUser() user: { id: string }, @Param('orderId') orderId: string) {
    return this.geo.mockMove(user.id, orderId);
  }
}
