import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrderCategory, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AvailabilityService } from './availability.service';

@ApiTags('availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private availability: AvailabilityService) {}

  @Get('services')
  serviceAvailability(
    @Query('city') city?: string,
    @Query('serviceId') serviceId?: string,
    @Query('category') category?: OrderCategory,
  ) {
    return this.availability.publicServiceAvailability({ city, serviceId, category });
  }

  @Get('admin/summary')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.REGION_ADMIN)
  adminSummary() {
    return this.availability.adminSummary();
  }
}
