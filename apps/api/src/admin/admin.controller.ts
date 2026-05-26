import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { UpdateOfferingStatusDto } from './dto/update-offering-status.dto';
import { AdminAssignOrderDto } from './dto/admin-assign-order.dto';
import { AdminUpdateOrderStatusDto } from './dto/admin-update-order-status.dto';
import { ModerateMarketProductDto } from './dto/moderate-market-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.REGION_ADMIN)
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

  @Patch('orders/:orderId/assign')
  assignOrder(@Param('orderId') orderId: string, @Body() dto: AdminAssignOrderDto) {
    return this.admin.assignOrder(orderId, dto);
  }

  @Patch('orders/:orderId/status')
  updateOrderStatus(@Param('orderId') orderId: string, @Body() dto: AdminUpdateOrderStatusDto) {
    return this.admin.updateOrderStatus(orderId, dto);
  }

  @Get('market/products')
  listMarketProducts() {
    return this.admin.listMarketProducts();
  }

  @Patch('market/products/:productId')
  moderateMarketProduct(
    @Param('productId') productId: string,
    @Body() dto: ModerateMarketProductDto,
  ) {
    return this.admin.moderateMarketProduct(productId, dto);
  }

  @Get('offerings')
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'scope', enum: ['specialist'], required: false })
  listOfferings(
    @CurrentUser() admin: User,
    @Query('status') status?: string,
    @Query('scope') scope?: 'specialist',
  ) {
    return this.admin.listOfferingsForModeration(admin, { status, scope });
  }

  @Patch('offerings/:offeringId')
  updateOfferingStatus(
    @CurrentUser() admin: User,
    @Param('offeringId') offeringId: string,
    @Body() dto: UpdateOfferingStatusDto,
  ) {
    return this.admin.updateOfferingStatus(admin, offeringId, dto);
  }
}
