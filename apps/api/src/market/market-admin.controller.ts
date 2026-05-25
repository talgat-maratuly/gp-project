import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RegionAccessService } from '../common/region-access.service';
import { MarketAdminService } from './market-admin.service';

@ApiTags('market-admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.REGION_ADMIN, Role.ADMIN, Role.SUPER_ADMIN)
export class MarketAdminController {
  constructor(
    private marketAdmin: MarketAdminService,
    private regionAccess: RegionAccessService,
  ) {}

  @Get('regions/:regionId/orders')
  regionOrders(
    @CurrentUser() user: User,
    @Param('regionId') regionId: string,
  ) {
    this.regionAccess.assertCanAccessRegion(user, regionId);
    return this.marketAdmin.listRegionOrders(regionId);
  }
}
