import { Module } from '@nestjs/common';
import { PartnerBalanceController } from './partner-balance.controller';
import { PartnerBalanceService } from './partner-balance.service';
import { PartnersModule } from '../partners/partners.module';

@Module({
  imports: [PartnersModule],
  controllers: [PartnerBalanceController],
  providers: [PartnerBalanceService],
  exports: [PartnerBalanceService],
})
export class PartnerBalanceModule {}
