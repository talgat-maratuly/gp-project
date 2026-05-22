import { Module } from '@nestjs/common';
import { QrService } from './qr.service';
import { QrPublicController } from './qr-public.controller';
import { QrAdminController } from './qr-admin.controller';
import { QrPartnerController } from './qr-partner.controller';

@Module({
  controllers: [QrPublicController, QrAdminController, QrPartnerController],
  providers: [QrService],
  exports: [QrService],
})
export class QrModule {}
