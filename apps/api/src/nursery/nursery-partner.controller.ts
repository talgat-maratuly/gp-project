import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { NurseryService } from './nursery.service';

@ApiTags('partner-nursery')
@ApiBearerAuth()
@Controller('partner/nursery')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARTNER)
export class NurseryPartnerController {
  constructor(private nursery: NurseryService) {}

  @Post('apply')
  apply(@CurrentUser() user: User, @Body() body: Record<string, unknown>) {
    return this.nursery.apply(user, body);
  }

  @Get('me')
  me(@CurrentUser() user: User) {
    return this.nursery.myNursery(user);
  }

  @Get('products')
  products(@CurrentUser() user: User) {
    return this.nursery.listMyProducts(user);
  }

  @Post('products')
  createProduct(@CurrentUser() user: User, @Body() body: Record<string, unknown>) {
    return this.nursery.createProduct(user, body);
  }

  @Get('requests/feed')
  requestFeed(@CurrentUser() user: User) {
    return this.nursery.requestFeed(user);
  }

  @Post('requests/:id/offers')
  createOffer(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.nursery.createOffer(user, id, body);
  }

  @Get('preorders/feed')
  preorderFeed(@CurrentUser() user: User) {
    return this.nursery.preorderFeed(user);
  }

  @Post('preorders/:id/offers')
  createPreorderOffer(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.nursery.createPreorderOffer(user, id, body);
  }
}
