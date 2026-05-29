import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { PartnersService } from './partners.service';
import { AddPartnerOfferingsDto } from './dto/add-partner-offerings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PartnerApprovedGuard } from './guards/partner-approved.guard';
import { UpdatePartnerPresenceDto, UpdateWorkStatusDto } from '../user-status/dto/update-work-status.dto';
import { AccountActiveGuard } from '../user-status/guards/account-active.guard';

@ApiTags('partners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARTNER)
@Controller('partners')
export class PartnersController {
  constructor(private partners: PartnersService) {}

  @Get('me')
  getMe(@CurrentUser() user: { id: string }) {
    return this.partners.getProfile(user.id);
  }

  @Patch('me')
  @UseGuards(PartnerApprovedGuard)
  updateMe(@CurrentUser() user: { id: string }, @Body() body: UpdatePartnerPresenceDto) {
    return this.partners.updateProfile(user.id, body);
  }

  @Patch('me/work-status')
  @UseGuards(PartnerApprovedGuard, AccountActiveGuard)
  setWorkStatus(@CurrentUser() user: { id: string }, @Body() dto: UpdateWorkStatusDto) {
    return this.partners.updateWorkStatus(user.id, dto.workStatus);
  }

  @Post('me/offerings')
  @UseGuards(PartnerApprovedGuard)
  addOfferings(@CurrentUser() user: { id: string }, @Body() dto: AddPartnerOfferingsDto) {
    return this.partners.addOfferings(user.id, dto.subserviceIds);
  }
}
