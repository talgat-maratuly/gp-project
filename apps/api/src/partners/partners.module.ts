import { forwardRef, Module } from '@nestjs/common';
import { FurnitureExecutorModule } from '../furniture-executor/furniture-executor.module';
import { PartnerApplicationController } from './partner-application.controller';
import { PartnerModerationService } from './partner-moderation.service';
import { PartnersController } from './partners.controller';
import { PartnersService } from './partners.service';
import { PartnerApprovedGuard } from './guards/partner-approved.guard';
import { OnlyShopPartnerGuard } from './guards/only-shop-partner.guard';
import { OnlyServicePartnerGuard } from './guards/only-service-partner.guard';
import { OnlySepticPartnerGuard } from './guards/only-septic-partner.guard';
import { SpecialistRequestsModule } from '../specialist-requests/specialist-requests.module';

@Module({
  imports: [forwardRef(() => FurnitureExecutorModule), forwardRef(() => SpecialistRequestsModule)],
  controllers: [PartnersController, PartnerApplicationController],
  providers: [
    PartnersService,
    PartnerModerationService,
    PartnerApprovedGuard,
    OnlyShopPartnerGuard,
    OnlyServicePartnerGuard,
    OnlySepticPartnerGuard,
  ],
  exports: [
    PartnersService,
    PartnerModerationService,
    PartnerApprovedGuard,
    OnlyShopPartnerGuard,
    OnlyServicePartnerGuard,
    OnlySepticPartnerGuard,
  ],
})
export class PartnersModule {}
