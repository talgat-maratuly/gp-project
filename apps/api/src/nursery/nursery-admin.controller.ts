import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PartnerStatus, Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { NurseryService } from './nursery.service';

@ApiTags('admin-nursery')
@ApiBearerAuth()
@Controller('admin/nursery')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.REGION_ADMIN)
export class NurseryAdminController {
  constructor(private nursery: NurseryService) {}

  @Get('partners')
  partners(@Query('status') status?: PartnerStatus) {
    return this.nursery.adminNurseries(status);
  }

  @Patch('partners/:id/approve')
  approve(@Param('id') id: string) {
    return this.nursery.adminSetNurseryStatus(id, PartnerStatus.APPROVED);
  }

  @Patch('partners/:id/reject')
  reject(@Param('id') id: string) {
    return this.nursery.adminSetNurseryStatus(id, PartnerStatus.REJECTED);
  }

  @Get('requests')
  requests() {
    return this.nursery.adminRequests();
  }

  @Get('preorders')
  preorders() {
    return this.nursery.adminPreorders();
  }
}
