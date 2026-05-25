import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PartnerApplyDto } from './dto/partner-apply.dto';
import { PartnerResubmitDto } from './dto/partner-resubmit.dto';
import { PartnerModerationService } from './partner-moderation.service';

@ApiTags('partner')
@ApiBearerAuth()
@Controller('partner')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARTNER)
export class PartnerApplicationController {
  constructor(private moderation: PartnerModerationService) {}

  @Post('apply')
  apply(@CurrentUser() user: { id: string }, @Body() dto: PartnerApplyDto) {
    return this.moderation.apply(user.id, dto);
  }

  @Get('me')
  me(@CurrentUser() user: { id: string }) {
    return this.moderation.getMe(user.id);
  }

  @Patch('me/resubmit')
  resubmit(@CurrentUser() user: { id: string }, @Body() dto: PartnerResubmitDto) {
    return this.moderation.resubmit(user.id, dto);
  }
}
