import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PortalRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PortalRolesGuard } from '../rbac/guards/portal-roles.guard';
import { PortalRoles } from '../rbac/decorators/portal-roles.decorator';
import { AccountActiveGuard } from './guards/account-active.guard';
import { UserStatusService } from './user-status.service';
import { UpdateAccountStatusDto } from './dto/update-account-status.dto';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('user-status')
@ApiBearerAuth()
@Controller('user-status')
@UseGuards(JwtAuthGuard, AccountActiveGuard)
export class UserStatusController {
  constructor(
    private userStatus: UserStatusService,
    private prisma: PrismaService,
  ) {}

  @Get('me')
  me(@CurrentUser() user: { id: string; accountStatus: import('@prisma/client').AccountStatus }) {
    return this.prisma.user.findUnique({
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
  }

  @UseGuards(PortalRolesGuard)
  @PortalRoles(PortalRole.ADMIN, PortalRole.GLOBAL_OPERATOR, PortalRole.GP_OPERATOR)
  @Patch('users/:userId/account')
  updateAccount(
    @CurrentUser() actor: { id: string },
    @Param('userId') userId: string,
    @Body() dto: UpdateAccountStatusDto,
  ) {
    return this.userStatus.setAccountStatus(actor.id, userId, dto.accountStatus, dto.reason);
  }
}
