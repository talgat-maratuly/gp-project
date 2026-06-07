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
  CreateStandaloneSubserviceDto,
  UpdateSubserviceTypeDto,
} from './service-catalog.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.REGION_ADMIN)
@Controller('admin/subservices')
export class SubserviceTypesAdminController {
  constructor(private types: ServiceTypesService) {}

  @Get()
  @ApiQuery({ name: 'serviceCode', required: false })
  list(@Query('serviceCode') serviceCode?: string) {
    return this.types.listSubservices(serviceCode?.trim() || undefined);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.types.getSubservice(id);
  }

  @Post()
  create(@Body() dto: CreateStandaloneSubserviceDto) {
    return this.types.createSubservice(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubserviceTypeDto) {
    return this.types.updateSubserviceById(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.types.removeSubserviceById(id);
  }
}
