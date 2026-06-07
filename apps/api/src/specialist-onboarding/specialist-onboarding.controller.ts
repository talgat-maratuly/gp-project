import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
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

  @Get('subservices')
  @ApiQuery({ name: 'cityId', required: true })
  @ApiQuery({ name: 'mainServiceId', required: true })
  getSubservices(
    @Query('cityId') cityId: string,
    @Query('mainServiceId') mainServiceId: string,
  ) {
    return this.onboarding.getSubservicesForCity(cityId, mainServiceId);
  }

  @Get('main-services')
  @ApiQuery({ name: 'cityId', required: true })
  getMainServices(@Query('cityId') cityId: string) {
    return this.onboarding.getMainServicesForCity(cityId);
  }
}

@ApiTags('specialist-onboarding')
@ApiBearerAuth()
@Controller('specialist')
@UseGuards(JwtAuthGuard, RolesGuard)
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
