import { Module, forwardRef } from '@nestjs/common';
import { SpecialistOnboardingService } from './specialist-onboarding.service';
import {
  SpecialistOnboardingController,
  SpecialistOnboardingPublicController,
} from './specialist-onboarding.controller';
import { SpecialistRequestsModule } from '../specialist-requests/specialist-requests.module';
import { ServiceCatalogModule } from '../service-catalog/service-catalog.module';
@Module({
  imports: [forwardRef(() => SpecialistRequestsModule), ServiceCatalogModule],
  controllers: [SpecialistOnboardingPublicController, SpecialistOnboardingController],
  providers: [SpecialistOnboardingService],
  exports: [SpecialistOnboardingService],
})
export class SpecialistOnboardingModule {}
