import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ServiceTypesService } from './service-types.service';
import {
  CreateServiceTypeDto,
  CreateSubserviceTypeDto,
  UpdateServiceTypeDto,
  UpdateSubserviceTypeDto,
} from './service-catalog.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.REGION_ADMIN)
@Controller('admin/service-types')
export class ServiceTypesAdminController {
  constructor(private types: ServiceTypesService) {}

  @Get()
  @ApiQuery({ name: 'code', required: false })
  list(@Query('code') code?: string) {
    return this.types.list(code?.trim() || undefined);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.types.get(id);
  }

  @Post()
  create(@Body() dto: CreateServiceTypeDto) {
    return this.types.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceTypeDto) {
    return this.types.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.types.remove(id);
  }

  @Post(':serviceTypeId/subservices')
  addSub(@Param('serviceTypeId') serviceTypeId: string, @Body() dto: CreateSubserviceTypeDto) {
    return this.types.addSubservice(serviceTypeId, dto);
  }

  @Patch(':serviceTypeId/subservices/:subId')
  updateSub(
    @Param('serviceTypeId') serviceTypeId: string,
    @Param('subId') subId: string,
    @Body() dto: UpdateSubserviceTypeDto,
  ) {
    return this.types.updateSubservice(serviceTypeId, subId, dto);
  }

  @Delete(':serviceTypeId/subservices/:subId')
  removeSub(@Param('serviceTypeId') serviceTypeId: string, @Param('subId') subId: string) {
    return this.types.removeSubservice(serviceTypeId, subId);
  }
}
