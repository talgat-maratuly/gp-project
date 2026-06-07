import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GpDeliveryService } from './gp-delivery.service';

@ApiTags('gp-delivery')
@Controller('delivery')
export class GpDeliveryController {
  constructor(private delivery: GpDeliveryService) {}

  @Get('routes')
  @UseGuards(OptionalJwtAuthGuard)
  routes(@Query() query: Record<string, string>) {
    return this.delivery.publicRoutes(query);
  }

  @Post('orders')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  createOrder(@CurrentUser() user: User, @Body() body: Record<string, unknown>) {
    return this.delivery.createOrder(user, body);
  }

  @Get('orders/mine')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  myOrders(@CurrentUser() user: User) {
    return this.delivery.myOrders(user);
  }

  @Patch('offers/:id/accept')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  acceptOffer(@CurrentUser() user: User, @Param('id') id: string) {
    return this.delivery.acceptOffer(user, id);
  }
}
