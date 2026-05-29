import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import {
  PartnerModerationController,
  PartnerModerationLegacyController,
  StoreModerationController,
} from './partner-moderation.controller';
import { PartnerModerationAdminService } from './partner-moderation.service';
import { PartnersModule } from '../partners/partners.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SpecialistRequestsModule } from '../specialist-requests/specialist-requests.module';

@Module({
  imports: [PartnersModule, NotificationsModule, SpecialistRequestsModule],
  controllers: [
    AdminController,
    PartnerModerationController,
    PartnerModerationLegacyController,
    StoreModerationController,
  ],
  providers: [AdminService, PartnerModerationAdminService],
})
export class AdminModule {}
