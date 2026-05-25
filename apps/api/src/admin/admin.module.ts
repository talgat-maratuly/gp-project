import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PartnerModerationController, StoreModerationController } from './partner-moderation.controller';
import { PartnerModerationAdminService } from './partner-moderation.service';
import { PartnersModule } from '../partners/partners.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PartnersModule, NotificationsModule],
  controllers: [AdminController, PartnerModerationController, StoreModerationController],
  providers: [AdminService, PartnerModerationAdminService],
})
export class AdminModule {}
