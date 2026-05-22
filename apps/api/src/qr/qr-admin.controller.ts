import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { QrService } from './qr.service';
import { CreateQrObjectDto } from './dto/create-qr-object.dto';

@ApiTags('qr-admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('qr/admin')
export class QrAdminController {
  constructor(private qr: QrService) {}

  @Get('stats')
  stats() {
    return this.qr.stats();
  }

  @Get('objects')
  listObjects() {
    return this.qr.listObjects();
  }

  @Post('objects')
  createObject(@Body() dto: CreateQrObjectDto) {
    return this.qr.createObject(dto);
  }

  @Get('objects/:id')
  getObject(@Param('id') id: string) {
    return this.qr.getObject(id);
  }

  @Patch('objects/:id')
  updateObject(@Param('id') id: string, @Body() dto: Partial<CreateQrObjectDto>) {
    return this.qr.updateObject(id, dto);
  }

  @Get('orders')
  listOrders() {
    return this.qr.listAllOrders();
  }
}
