import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DeliveryPartnerStatus, Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GpDeliveryService } from './gp-delivery.service';

@ApiTags('admin-delivery')
@ApiBearerAuth()
@Controller('admin/delivery')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.REGION_ADMIN)
export class GpDeliveryAdminController {
  constructor(private delivery: GpDeliveryService) {}

  @Get('partners')
  partners(@Query('status') status?: DeliveryPartnerStatus) {
    return this.delivery.adminPartners(status);
  }

  @Patch('partners/:id/approve')
  approve(@Param('id') id: string) {
    return this.delivery.adminSetPartnerStatus(id, DeliveryPartnerStatus.APPROVED);
  }

  @Patch('partners/:id/reject')
  reject(@Param('id') id: string) {
    return this.delivery.adminSetPartnerStatus(id, DeliveryPartnerStatus.REJECTED);
  }

  @Get('orders')
  orders() {
    return this.delivery.adminOrders();
  }
}
