import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PartnerApprovedGuard } from '../partners/guards/partner-approved.guard';
import { SpecialistOnlineGuard } from '../user-status/guards/specialist-online.guard';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('partner-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PartnerApprovedGuard)
@Roles(Role.PARTNER)
@Controller('partner/orders')
export class PartnerOrdersController {
  constructor(private orders: OrdersService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.orders.findPartnerOrders(user.id);
  }

  @Get('new')
  listNew(@CurrentUser() user: { id: string }) {
    return this.orders.findPartnerNewOrders(user.id);
  }

  @Patch(':id/accept')
  @UseGuards(SpecialistOnlineGuard)
  accept(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.orders.acceptPartnerOrder(user.id, id);
  }

  @Patch(':id/reject')
  reject(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.orders.rejectPartnerOrder(user.id, id);
  }

  @Patch(':id/status')
  updateStatus(@CurrentUser() user: { id: string }, @Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    return this.orders.updatePartnerOrderStatus(user.id, id, body);
  }
}
