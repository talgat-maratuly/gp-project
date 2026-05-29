import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccountActiveGuard } from '../user-status/guards/account-active.guard';
import { SpecialistOnboardingService } from './specialist-onboarding.service';
import { SubmitOnboardingApplicationDto } from './dto/submit-onboarding-application.dto';

@ApiTags('specialist-onboarding')
@Controller('specialist/onboarding')
export class SpecialistOnboardingPublicController {
  constructor(private onboarding: SpecialistOnboardingService) {}

  @Get('catalog')
  getCatalog() {
    return this.onboarding.getCatalog();
  }
}

@ApiTags('specialist-onboarding')
@ApiBearerAuth()
@Controller('specialist')
@UseGuards(JwtAuthGuard, AccountActiveGuard, RolesGuard)
@Roles(Role.PARTNER)
export class SpecialistOnboardingController {
  constructor(private onboarding: SpecialistOnboardingService) {}

  @Get('applications')
  listApplications(@CurrentUser() user: { id: string }) {
    return this.onboarding.listMyApplications(user.id);
  }

  @Get('applications/:id')
  getApplication(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.onboarding.getMyApplication(user.id, id);
  }

  @Post('applications')
  submit(@CurrentUser() user: { id: string }, @Body() dto: SubmitOnboardingApplicationDto) {
    return this.onboarding.submit(user.id, dto);
  }
}
