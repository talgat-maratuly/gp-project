import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { UpdateOfferingStatusDto } from './dto/update-offering-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.admin.dashboard();
  }

  @Get('clients')
  clients() {
    return this.admin.listClients();
  }

  @Get('partners')
  partners() {
    return this.admin.listPartners();
  }

  @Get('orders')
  orders() {
    return this.admin.listOrders();
  }

  @Get('commissions')
  commissions() {
    return this.admin.listCommissions();
  }

  @Patch('offerings/:offeringId')
  updateOfferingStatus(
    @Param('offeringId') offeringId: string,
    @Body() dto: UpdateOfferingStatusDto,
  ) {
    return this.admin.updateOfferingStatus(offeringId, dto);
  }
}
