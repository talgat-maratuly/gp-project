import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GpDeliveryService } from './gp-delivery.service';

@ApiTags('partner-delivery')
@ApiBearerAuth()
@Controller('partner/delivery')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARTNER)
export class GpDeliveryPartnerController {
  constructor(private delivery: GpDeliveryService) {}

  @Post('apply')
  apply(@CurrentUser() user: User, @Body() body: Record<string, unknown>) {
    return this.delivery.apply(user, body);
  }

  @Get('me')
  me(@CurrentUser() user: User) {
    return this.delivery.me(user);
  }

  @Post('routes')
  createRoute(@CurrentUser() user: User, @Body() body: Record<string, unknown>) {
    return this.delivery.createRoute(user, body);
  }

  @Get('orders/feed')
  orderFeed(@CurrentUser() user: User) {
    return this.delivery.orderFeed(user);
  }

  @Post('orders/:id/offers')
  createOffer(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.delivery.createOffer(user, id, body);
  }
}
