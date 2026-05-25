import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('super-admin')
@ApiBearerAuth()
@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
export class SuperAdminController {
  constructor(private prisma: PrismaService) {}

  @Get('regions')
  listRegions() {
    return this.prisma.region.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { stores: true, products: true, orders: true, users: true },
        },
      },
    });
  }
}
