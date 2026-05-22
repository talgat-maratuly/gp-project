import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { QrService } from './qr.service';
import { UpdateQrOrderStatusDto } from './dto/update-qr-order-status.dto';

@ApiTags('qr-partner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARTNER)
@Controller('qr/partner')
export class QrPartnerController {
  constructor(private qr: QrService) {}

  @Get('orders')
  @ApiQuery({ name: 'serviceType', required: false })
  listOrders(
    @CurrentUser() user: { partnerProfile?: { id: string } },
    @Query('serviceType') serviceType?: string,
  ) {
    const partnerId = user.partnerProfile?.id;
    if (!partnerId) return [];
    return this.qr.listOrdersForPartner(partnerId, serviceType);
  }

  @Patch('orders/:id/status')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: { partnerProfile?: { id: string } },
    @Body() dto: UpdateQrOrderStatusDto,
  ) {
    const partnerId = user.partnerProfile?.id;
    if (!partnerId) throw new Error('Partner profile required');
    return this.qr.updateOrderStatus(id, partnerId, dto);
  }
}
