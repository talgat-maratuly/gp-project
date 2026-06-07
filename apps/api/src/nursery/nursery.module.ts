import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NurseryAdminController } from './nursery-admin.controller';
import { NurseryController } from './nursery.controller';
import { NurseryPartnerController } from './nursery-partner.controller';
import { NurseryService } from './nursery.service';

@Module({
  imports: [AuthModule],
  controllers: [NurseryController, NurseryPartnerController, NurseryAdminController],
  providers: [NurseryService],
  exports: [NurseryService],
})
export class NurseryModule {}
