import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SpecialistRequestsService } from './specialist-requests.service';

@ApiTags('specialist-requests')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SpecialistRequestsController {
  constructor(private specialistRequests: SpecialistRequestsService) {}

  @Get('specialist/my-requests')
  @Roles(Role.PARTNER)
  myRequests(@CurrentUser() user: { id: string }) {
    return this.specialistRequests.getMyRequest(user.id);
  }
}
