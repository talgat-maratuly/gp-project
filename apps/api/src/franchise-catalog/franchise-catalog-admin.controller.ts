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
import { FranchiseCatalogService } from './franchise-catalog.service';
import {
  CreateFranchiseServiceDto,
  CreateFranchiseSubserviceDto,
  UpdateFranchiseServiceDto,
  UpdateFranchiseSubserviceDto,
} from './franchise-catalog.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.REGION_ADMIN)
@Controller('admin/services')
export class FranchiseCatalogAdminController {
  constructor(private catalog: FranchiseCatalogService) {}

  @Get('franchises')
  listFranchises() {
    return this.catalog.listFranchises();
  }

  @Get()
  @ApiQuery({ name: 'franchiseId', required: false })
  list(@Query('franchiseId') franchiseId?: string) {
    return this.catalog.listServices(franchiseId?.trim() || undefined);
  }

  @Post()
  create(@Body() dto: CreateFranchiseServiceDto) {
    return this.catalog.createService(dto);
  }

  @Patch(':serviceId')
  update(@Param('serviceId') serviceId: string, @Body() dto: UpdateFranchiseServiceDto) {
    return this.catalog.updateService(serviceId, dto);
  }

  @Delete(':serviceId')
  remove(@Param('serviceId') serviceId: string) {
    return this.catalog.removeService(serviceId);
  }

  @Post(':serviceId/subservices')
  addSub(
    @Param('serviceId') serviceId: string,
    @Body() dto: CreateFranchiseSubserviceDto,
  ) {
    return this.catalog.addSubservice(serviceId, dto);
  }

  @Patch(':serviceId/subservices/:subId')
  updateSub(
    @Param('serviceId') serviceId: string,
    @Param('subId') subId: string,
    @Body() dto: UpdateFranchiseSubserviceDto,
  ) {
    return this.catalog.updateSubservice(serviceId, subId, dto);
  }

  @Delete(':serviceId/subservices/:subId')
  removeSub(
    @Param('serviceId') serviceId: string,
    @Param('subId') subId: string,
  ) {
    return this.catalog.removeSubservice(serviceId, subId);
  }
}
