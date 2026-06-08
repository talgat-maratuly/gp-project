import { BadRequestException, Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PartnerRole, PartnerType, Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PartnerApplyDto } from './dto/partner-apply.dto';
import { PartnerResubmitDto } from './dto/partner-resubmit.dto';
import { PartnerModerationService } from './partner-moderation.service';

const FURNITURE_SUBSERVICE_IDS = new Set([
  'furniture_manufacturing',
  'furniture_assembly',
  'furniture_repair',
]);

function assertShopPartnerApply(dto: PartnerApplyDto) {
  if (dto.partnerRole === PartnerRole.SHOP || dto.partnerType === PartnerType.SHOP) return;
  const subs = dto.subserviceIds ?? [];
  if (subs.length > 0 && subs.every((id) => FURNITURE_SUBSERVICE_IDS.has(id))) return;
  throw new BadRequestException(
    'Для специалиста используйте POST /api/specialist/applications. Этот endpoint предназначен для магазина или мебельного исполнителя.',
  );
}

@ApiTags('partner')
@ApiBearerAuth()
@Controller('partner')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARTNER)
export class PartnerApplicationController {
  constructor(private moderation: PartnerModerationService) {}

  @Post('apply')
  apply(@CurrentUser() user: { id: string }, @Body() dto: PartnerApplyDto) {
    assertShopPartnerApply(dto);
    return this.moderation.apply(user.id, dto);
  }

  @Get('me')
  me(@CurrentUser() user: { id: string }) {
    return this.moderation.getMe(user.id);
  }

  @Patch('me/resubmit')
  resubmit(@CurrentUser() user: { id: string }, @Body() dto: PartnerResubmitDto) {
    assertShopPartnerApply(dto as PartnerApplyDto);
    return this.moderation.resubmit(user.id, dto);
  }
}
