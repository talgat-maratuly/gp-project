import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PortalRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PortalRolesGuard } from './guards/portal-roles.guard';
import { PortalRoles } from './decorators/portal-roles.decorator';
import { AssignPortalRolesDto } from './dto/assign-portal-roles.dto';
import { RbacService, UserWithProfiles } from './rbac.service';

@ApiTags('rbac')
@ApiBearerAuth()
@Controller('rbac')
@UseGuards(JwtAuthGuard, PortalRolesGuard)
export class RbacController {
  constructor(private rbac: RbacService) {}

  @PortalRoles(PortalRole.ADMIN, PortalRole.GLOBAL_OPERATOR, PortalRole.FRANCHISE_OWNER)
  @Patch('users/:userId/roles')
  assignRoles(
    @CurrentUser() actor: UserWithProfiles,
    @Param('userId') userId: string,
    @Body() dto: AssignPortalRolesDto,
  ) {
    return this.rbac.assignPortalRoles(actor, userId, dto.roles, {
      regionId: dto.regionId,
      franchiseId: dto.franchiseId,
    });
  }
}
