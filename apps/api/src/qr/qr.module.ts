import { Module } from '@nestjs/common';
import { PartnersModule } from '../partners/partners.module';
import { QrService } from './qr.service';
import { QrPublicController } from './qr-public.controller';
import { QrAdminController } from './qr-admin.controller';
import { QrPartnerController } from './qr-partner.controller';

@Module({
  imports: [PartnersModule],
  controllers: [QrPublicController, QrAdminController, QrPartnerController],
  providers: [QrService],
  exports: [QrService],
})
export class QrModule {}
