import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PortalRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PortalRolesGuard } from '../rbac/guards/portal-roles.guard';
import { PortalRoles } from '../rbac/decorators/portal-roles.decorator';
import { UserStatusService } from './user-status.service';
import { ACCOUNT_STATUS_UI } from './account-status.transitions';
import { AccountStatusAuditService } from './account-status-audit.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('user-status')
@ApiBearerAuth()
@Controller('user-status')
export class UserStatusController {
  constructor(
    private userStatus: UserStatusService,
    private prisma: PrismaService,
    private audit: AccountStatusAuditService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: { id: string }) {
    const row = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        accountStatus: true,
        accountStatusReason: true,
        accountStatusChangedAt: true,
        partnerProfile: {
          select: {
            requestStatus: true,
            workStatus: true,
            status: true,
            isOnline: true,
          },
        },
      },
    });
    return {
      ...row,
      uiMessage: row ? ACCOUNT_STATUS_UI[row.accountStatus] : null,
      canPerformCoreActions: row?.accountStatus === 'ACTIVE',
      statuses: row
        ? this.userStatus.snapshot(row, row.partnerProfile ?? null)
        : null,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/account-logs')
  myLogs(@CurrentUser() user: { id: string }) {
    return this.audit.listForUser(user.id);
  }
}
