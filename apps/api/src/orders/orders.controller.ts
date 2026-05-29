import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OrderStatus, PortalRole, Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OnlyServicePartnerGuard } from '../partners/guards/only-service-partner.guard';
import { AccountCoreActionsGuard } from '../user-status/guards/account-core-actions.guard';
import { PortalRolesGuard } from '../rbac/guards/portal-roles.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { PortalRoles } from '../rbac/decorators/portal-roles.decorator';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AccountCoreActionsGuard, PortalRolesGuard, PermissionGuard)
  @PortalRoles(
    PortalRole.CLIENT,
    PortalRole.GP_OPERATOR,
    PortalRole.GLOBAL_OPERATOR,
    PortalRole.ADMIN,
  )
  @RequirePermission('order:create')
  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateOrderDto) {
    return this.orders.createOrder(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'category', required: false })
  list(
    @CurrentUser() user: { id: string; role: Role },
    @Query('status') status?: OrderStatus,
    @Query('category') category?: string,
  ) {
    return this.orders.findForUser(user.id, user.role, { status, category });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  one(@CurrentUser() user: { role: Role }, @Param('id') id: string) {
    return this.orders.findOne(id, user.role);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, OnlyServicePartnerGuard)
  @Roles(Role.PARTNER)
  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: { id: string; role: Role },
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orders.updateStatus(user.id, user.role, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  @Patch(':id/confirm')
  confirmByClient(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.orders.confirmByClient(user.id, id);
  }
}
