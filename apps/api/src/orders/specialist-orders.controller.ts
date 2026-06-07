import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PartnerApprovedGuard } from '../partners/guards/partner-approved.guard';
import { SpecialistOnlineGuard } from '../user-status/guards/specialist-online.guard';
import { SpecialistRequestApprovedGuard } from '../specialist-requests/guards/specialist-request-approved.guard';
import { OrdersService } from './orders.service';

/**
 * Лента доступных заказов и приём из пула.
 * Вся видимость/matching/право приёма проверяются на бэкенде (security requirement).
 */
@ApiTags('specialist-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PartnerApprovedGuard, SpecialistRequestApprovedGuard)
@Roles(Role.PARTNER)
@Controller()
export class SpecialistOrdersController {
  constructor(private orders: OrdersService) {}

  @Get('specialist/orders/feed')
  feed(@CurrentUser() user: { id: string }) {
    return this.orders.getSpecialistFeed(user.id);
  }

  @Patch('orders/:id/accept')
  @UseGuards(SpecialistOnlineGuard)
  accept(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.orders.acceptFromPool(user.id, id);
  }
}
