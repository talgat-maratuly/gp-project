import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FurnitureServiceType, QrOrderStatus, Role } from '@prisma/client';
import { FurnitureExecutorService } from './furniture-executor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('furniture-executor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARTNER)
@Controller('furniture-executor/partner')
export class FurnitureExecutorController {
  constructor(
    private furniture: FurnitureExecutorService,
    private prisma: PrismaService,
  ) {}

  private async partnerId(userId: string) {
    const p = await this.prisma.partnerProfile.findUnique({ where: { userId } });
    if (!p) throw new Error('partner_not_found');
    return p.id;
  }

  @Get('orders')
  @ApiQuery({ name: 'serviceType', required: false, enum: FurnitureServiceType })
  async list(
    @CurrentUser() user: { id: string },
    @Query('serviceType') serviceType?: FurnitureServiceType,
  ) {
    const partnerId = await this.partnerId(user.id);
    return this.furniture.listForPartner(partnerId, serviceType);
  }

  @Post('orders/:id/accept')
  accept(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.partnerId(user.id).then((pid) => this.furniture.accept(id, pid));
  }

  @Patch('orders/:id/status')
  status(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: { status: QrOrderStatus },
  ) {
    return this.partnerId(user.id).then((pid) =>
      this.furniture.updateStatus(id, pid, body.status),
    );
  }

  @Post('orders/:id/decline')
  decline(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.partnerId(user.id).then((pid) => this.furniture.decline(id, pid));
  }
}
