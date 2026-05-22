import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { QrService } from './qr.service';
import { CreateQrOrderDto } from './dto/create-qr-order.dto';

@ApiTags('qr-public')
@Controller('qr')
export class QrPublicController {
  constructor(private qr: QrService) {}

  @Get('public/:qrCode')
  getPublic(@Param('qrCode') qrCode: string, @Req() req: Request) {
    this.qr.logScan(qrCode, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      deviceType: /mobile/i.test(String(req.headers['user-agent'] || '')) ? 'mobile' : 'desktop',
      action: 'view',
    }).catch(() => {});
    return this.qr.getPublic(qrCode);
  }

  @Post('public/:qrCode/orders')
  createOrder(@Param('qrCode') qrCode: string, @Body() dto: CreateQrOrderDto) {
    return this.qr.createPublicOrder(qrCode, dto);
  }
}
