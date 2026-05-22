import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role, ServiceProjectStatus, ServiceProjectType } from '@prisma/client';
import { ServiceProjectsService } from './service-projects.service';
import { CreateHunterProjectDto } from './dto/create-hunter-project.dto';
import { CreateFurnitureProjectDto } from './dto/create-furniture-project.dto';
import { UpdateProjectStatusDto } from './dto/update-project-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('service-projects')
@Controller('service-projects')
export class ServiceProjectsController {
  constructor(private projects: ServiceProjectsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiQuery({ name: 'type', required: false, enum: ServiceProjectType })
  @ApiQuery({ name: 'status', required: false, enum: ServiceProjectStatus })
  list(
    @CurrentUser() user: { id: string; role: Role },
    @Query('type') type?: ServiceProjectType,
    @Query('status') status?: ServiceProjectStatus,
  ) {
    return this.projects.findAll(user.id, user.role, { type, status });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  one(@CurrentUser() user: { id: string; role: Role }, @Param('id') id: string) {
    return this.projects.findOne(id, user.id, user.role);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PARTNER, Role.ADMIN)
  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: { id: string; role: Role },
    @Param('id') id: string,
    @Body() dto: UpdateProjectStatusDto,
  ) {
    return this.projects.updateStatus(id, user.id, user.role, dto.status);
  }
}

@ApiTags('hunter-projects')
@Controller('hunter-projects')
export class HunterProjectsController {
  constructor(private projects: ServiceProjectsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateHunterProjectDto) {
    return this.projects.createHunter(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  list(@CurrentUser() user: { id: string; role: Role }) {
    return this.projects.findAll(user.id, user.role, { type: ServiceProjectType.hunter_irrigation });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  one(@CurrentUser() user: { id: string; role: Role }, @Param('id') id: string) {
    return this.projects.findOne(id, user.id, user.role);
  }
}

@ApiTags('furniture-projects')
@Controller('furniture-projects')
export class FurnitureProjectsController {
  constructor(private projects: ServiceProjectsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateFurnitureProjectDto) {
    return this.projects.createFurniture(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  list(@CurrentUser() user: { id: string; role: Role }) {
    return this.projects.findAll(user.id, user.role, { type: ServiceProjectType.furniture });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  one(@CurrentUser() user: { id: string; role: Role }, @Param('id') id: string) {
    return this.projects.findOne(id, user.id, user.role);
  }
}
