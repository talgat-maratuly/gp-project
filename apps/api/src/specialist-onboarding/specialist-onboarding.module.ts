import { Module, forwardRef } from '@nestjs/common';
import { SpecialistOnboardingService } from './specialist-onboarding.service';
import {
  SpecialistOnboardingController,
  SpecialistOnboardingPublicController,
} from './specialist-onboarding.controller';
import { SpecialistRequestsModule } from '../specialist-requests/specialist-requests.module';
@Module({
  imports: [forwardRef(() => SpecialistRequestsModule)],
  controllers: [SpecialistOnboardingPublicController, SpecialistOnboardingController],
  providers: [SpecialistOnboardingService],
  exports: [SpecialistOnboardingService],
})
export class SpecialistOnboardingModule {}
