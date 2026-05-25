import { Module } from '@nestjs/common';
import { FurnitureExecutorModule } from '../furniture-executor/furniture-executor.module';
import { PartnerApplicationController } from './partner-application.controller';
import { PartnerModerationService } from './partner-moderation.service';
import { PartnersController } from './partners.controller';
import { PartnersService } from './partners.service';
import { PartnerApprovedGuard } from './guards/partner-approved.guard';

@Module({
  imports: [FurnitureExecutorModule],
  controllers: [PartnersController, PartnerApplicationController],
  providers: [PartnersService, PartnerModerationService, PartnerApprovedGuard],
  exports: [PartnersService, PartnerModerationService, PartnerApprovedGuard],
})
export class PartnersModule {}
