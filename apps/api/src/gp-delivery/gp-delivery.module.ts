import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GpDeliveryAdminController } from './gp-delivery-admin.controller';
import { GpDeliveryController } from './gp-delivery.controller';
import { GpDeliveryPartnerController } from './gp-delivery-partner.controller';
import { GpDeliveryService } from './gp-delivery.service';

@Module({
  imports: [AuthModule],
  controllers: [GpDeliveryController, GpDeliveryPartnerController, GpDeliveryAdminController],
  providers: [GpDeliveryService],
  exports: [GpDeliveryService],
})
export class GpDeliveryModule {}
