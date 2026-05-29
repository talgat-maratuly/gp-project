import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccountActiveGuard } from '../user-status/guards/account-active.guard';
import { SpecialistRequestsService } from './specialist-requests.service';
import {
  CreateSpecialistRequestDto,
  ResubmitSpecialistRequestDto,
} from './dto/create-specialist-request.dto';

@ApiTags('specialist-requests')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, AccountActiveGuard, RolesGuard)
export class SpecialistRequestsController {
  constructor(private specialistRequests: SpecialistRequestsService) {}

  @Post('specialist-requests')
  @Roles(Role.PARTNER)
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateSpecialistRequestDto) {
    return this.specialistRequests.submit(user.id, dto);
  }

  @Get('specialist/my-requests')
  @Roles(Role.PARTNER)
  myRequests(@CurrentUser() user: { id: string }) {
    return this.specialistRequests.getMyRequest(user.id);
  }
}

@ApiTags('specialist-requests')
@ApiBearerAuth()
@Controller('specialist-requests')
@UseGuards(JwtAuthGuard, AccountActiveGuard, RolesGuard)
@Roles(Role.PARTNER)
export class SpecialistMyRequestsAliasController {
  constructor(private specialistRequests: SpecialistRequestsService) {}

  @Post('resubmit')
  resubmit(@CurrentUser() user: { id: string }, @Body() dto: ResubmitSpecialistRequestDto) {
    return this.specialistRequests.resubmit(user.id, dto);
  }
}
