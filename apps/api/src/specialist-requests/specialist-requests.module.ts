import { Module, forwardRef } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PartnersModule } from '../partners/partners.module';
import { SpecialistRequestsService } from './specialist-requests.service';
import { SpecialistModeratorAccessService } from './specialist-moderator-access.service';
import { SpecialistRequestNotificationsService } from './specialist-request-notifications.service';
import {
  SpecialistMyRequestsAliasController,
  SpecialistRequestsController,
} from './specialist-requests.controller';
import { ModeratorSpecialistRequestsController } from './moderator-specialist-requests.controller';
import { SpecialistRequestApprovedGuard } from './guards/specialist-request-approved.guard';

@Module({
  imports: [NotificationsModule, forwardRef(() => PartnersModule)],
  controllers: [
    SpecialistRequestsController,
    SpecialistMyRequestsAliasController,
    ModeratorSpecialistRequestsController,
  ],
  providers: [
    SpecialistRequestsService,
    SpecialistModeratorAccessService,
    SpecialistRequestNotificationsService,
    SpecialistRequestApprovedGuard,
  ],
  exports: [
    SpecialistRequestsService,
    SpecialistRequestApprovedGuard,
    SpecialistRequestNotificationsService,
    SpecialistModeratorAccessService,
  ],
})
export class SpecialistRequestsModule {}
