import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PortalRole, User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PortalRolesGuard } from '../rbac/guards/portal-roles.guard';
import { PortalRoles } from '../rbac/decorators/portal-roles.decorator';
import { AccountStatusService } from './account-status.service';
import { AccountStatusAuditService } from './account-status-audit.service';
import { AccountComplaintsService } from './account-complaints.service';
import { AutoModerationService } from './auto-moderation.service';
import { UpdateAccountStatusDto } from './dto/update-account-status.dto';
import { ListAccountsQueryDto } from './dto/list-accounts-query.dto';
import { FileComplaintDto } from './dto/file-complaint.dto';
@ApiTags('account-moderation')
@ApiBearerAuth()
@Controller('moderator/accounts')
@UseGuards(JwtAuthGuard, PortalRolesGuard)
@PortalRoles(
  PortalRole.GP_OPERATOR,
  PortalRole.FRANCHISE_OWNER,
  PortalRole.GLOBAL_OPERATOR,
  PortalRole.ADMIN,
)
export class AccountModerationController {
  constructor(
    private accountStatus: AccountStatusService,
    private audit: AccountStatusAuditService,
    private complaints: AccountComplaintsService,
    private autoModeration: AutoModerationService,
  ) {}

  @Get()
  list(@CurrentUser() actor: User, @Query() query: ListAccountsQueryDto) {
    return this.accountStatus.listUsersForModerator(actor.id, query);
  }

  @Get('users/:userId/logs')
  logs(@Param('userId') userId: string) {
    return this.audit.listForUser(userId);
  }

  @Patch('users/:userId/status')
  changeStatus(
    @CurrentUser() actor: User,
    @Param('userId') userId: string,
    @Body() dto: UpdateAccountStatusDto,
  ) {
    return this.accountStatus.operatorChange(
      actor.id,
      userId,
      dto.accountStatus,
      dto.reason ?? 'Manual moderation',
    );
  }

  @Post('complaints')
  fileComplaint(@CurrentUser() actor: User, @Body() dto: FileComplaintDto) {
    return this.complaints.fileComplaint(dto.targetUserId, dto.reason, actor.id);
  }

  @Post('auto-moderation/run')
  runAutoScan(@Query('limit') limit?: string) {
    return this.autoModeration.runScheduledScan(limit ? Number(limit) : 100);
  }

  @Post('users/:userId/auto-moderation/evaluate')
  evaluateUser(@Param('userId') userId: string) {
    return this.autoModeration.evaluateUser(userId);
  }
}
