import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersLifecycleController {
  constructor(private orders: OrdersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  @Patch(':id/cancel')
  cancel(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.orders.cancelByClient(user.id, id, dto.cancelReason);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  @Post(':id/recreate')
  recreate(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.orders.recreateOrder(user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/events')
  events(@Param('id') id: string) {
    return this.orders.getOrderEvents(id);
  }
}
