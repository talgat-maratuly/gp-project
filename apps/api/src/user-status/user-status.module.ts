import { Global, Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserStatusService } from './user-status.service';
import { AccountActiveGuard } from './guards/account-active.guard';
import { AccountCoreActionsGuard } from './guards/account-core-actions.guard';
import { SpecialistOnlineGuard } from './guards/specialist-online.guard';
import { UserStatusController } from './user-status.controller';
import { AccountModerationController } from './account-moderation.controller';
import { AccountStatusService } from './account-status.service';
import { AccountStatusAuditService } from './account-status-audit.service';
import { AutoModerationService } from './auto-moderation.service';
import { AccountComplaintsService } from './account-complaints.service';

@Global()
@Module({
  imports: [NotificationsModule],
  controllers: [UserStatusController, AccountModerationController],
  providers: [
    UserStatusService,
    AccountStatusService,
    AccountStatusAuditService,
    AutoModerationService,
    AccountComplaintsService,
    AccountActiveGuard,
    AccountCoreActionsGuard,
    SpecialistOnlineGuard,
  ],
  exports: [
    UserStatusService,
    AccountStatusService,
    AccountStatusAuditService,
    AutoModerationService,
    AccountComplaintsService,
    AccountActiveGuard,
    AccountCoreActionsGuard,
    SpecialistOnlineGuard,
  ],
})
export class UserStatusModule {}
