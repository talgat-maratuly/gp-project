import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RegionsModule } from '../regions/regions.module';
import { MarketAdminController } from './market-admin.controller';
import { MarketAdminService } from './market-admin.service';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { PartnerMarketController } from './partner-market.controller';
import { PartnerMarketService } from './partner-market.service';
import { SuperAdminController } from './super-admin.controller';

@Module({
  imports: [AuthModule, RegionsModule],
  controllers: [
    MarketController,
    PartnerMarketController,
    MarketAdminController,
    SuperAdminController,
  ],
  providers: [MarketService, PartnerMarketService, MarketAdminService],
  exports: [MarketService, PartnerMarketService],
})
export class MarketModule {}
