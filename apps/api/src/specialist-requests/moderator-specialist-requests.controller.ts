import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccountActiveGuard } from '../user-status/guards/account-active.guard';
import { PortalRolesGuard } from '../rbac/guards/portal-roles.guard';
import { PortalRoles } from '../rbac/decorators/portal-roles.decorator';
import { PortalRole } from '@prisma/client';
import { SpecialistRequestsService } from './specialist-requests.service';
import { ModeratorSpecialistRequestsQueryDto } from './dto/moderator-list-query.dto';
import { RejectSpecialistRequestDto } from './dto/reject-specialist-request.dto';

@ApiTags('moderator-specialist-requests')
@ApiBearerAuth()
@Controller('moderator/specialist-requests')
@UseGuards(JwtAuthGuard, AccountActiveGuard, PortalRolesGuard)
@PortalRoles(
  PortalRole.GP_OPERATOR,
  PortalRole.FRANCHISE_OWNER,
  PortalRole.GLOBAL_OPERATOR,
  PortalRole.ADMIN,
)
export class ModeratorSpecialistRequestsController {
  constructor(private specialistRequests: SpecialistRequestsService) {}

  @Get()
  list(@CurrentUser() actor: User, @Query() query: ModeratorSpecialistRequestsQueryDto) {
    return this.specialistRequests.listForModerator(actor, query);
  }

  @Get(':id')
  one(@CurrentUser() actor: User, @Param('id') id: string) {
    return this.specialistRequests.getForModerator(actor, id);
  }

  @Patch(':id/approve')
  approve(@CurrentUser() actor: User, @Param('id') id: string) {
    return this.specialistRequests.approve(actor, id);
  }

  @Patch(':id/reject')
  reject(
    @CurrentUser() actor: User,
    @Param('id') id: string,
    @Body() dto: RejectSpecialistRequestDto,
  ) {
    return this.specialistRequests.reject(actor, id, dto.rejectionReason);
  }
}
