import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PartnerStatus, Role, User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ModerationRejectDto } from './dto/moderation-reject.dto';
import { ModerationRevisionDto } from './dto/moderation-revision.dto';
import { PartnerModerationAdminService } from './partner-moderation.service';

@ApiTags('admin-moderation')
@ApiBearerAuth()
@Controller('admin/moderation/partners')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.REGION_ADMIN)
export class PartnerModerationController {
  constructor(private moderation: PartnerModerationAdminService) {}

  @Get()
  @ApiQuery({ name: 'status', enum: PartnerStatus, required: false })
  list(@CurrentUser() admin: User, @Query('status') status?: PartnerStatus) {
    return this.moderation.list(admin, status);
  }

  @Get(':id')
  getOne(@CurrentUser() admin: User, @Param('id') id: string) {
    return this.moderation.getOne(admin, id);
  }

  @Patch(':id/approve')
  approve(@CurrentUser() admin: User, @Param('id') id: string) {
    return this.moderation.approve(admin, id);
  }

  @Patch(':id/reject')
  reject(@CurrentUser() admin: User, @Param('id') id: string, @Body() dto: ModerationRejectDto) {
    return this.moderation.reject(admin, id, dto.reason);
  }

  @Patch(':id/revision')
  revision(@CurrentUser() admin: User, @Param('id') id: string, @Body() dto: ModerationRevisionDto) {
    return this.moderation.revision(admin, id, dto.comment);
  }

  @Patch(':id/suspend')
  suspend(@CurrentUser() admin: User, @Param('id') id: string, @Body() body?: { reason?: string }) {
    return this.moderation.suspend(admin, id, body?.reason);
  }

  @Patch(':id/restore')
  restore(@CurrentUser() admin: User, @Param('id') id: string) {
    return this.moderation.restore(admin, id);
  }
}

@ApiTags('admin-store-moderation')
@ApiBearerAuth()
@Controller('admin/moderation/stores')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.REGION_ADMIN)
export class StoreModerationController {
  constructor(private moderation: PartnerModerationAdminService) {}

  @Patch(':id/approve')
  approveStore(@CurrentUser() admin: User, @Param('id') id: string) {
    return this.moderation.approveStore(admin, id);
  }
}
