import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { SpecialistModeratorAccessService } from './specialist-moderator-access.service';

@Injectable()
export class SpecialistRequestNotificationsService {
  constructor(
    private notifications: NotificationsService,
    private moderatorAccess: SpecialistModeratorAccessService,
  ) {}

  async notifySubmitted(specialistUserId: string, regionId: string, isResubmit: boolean) {
    await this.notifications.notifyUser(
      specialistUserId,
      'Өтінім модерацияда',
      'Your application is under moderation review',
    );

    const moderatorIds = await this.moderatorAccess.findModeratorsToNotify(regionId);
    const title = isResubmit
      ? 'Жаңартылған specialist өтінімі'
      : 'Жаңа specialist өтінімі';
    const body = isResubmit
      ? 'Updated specialist application submitted'
      : 'New specialist request received';

    await Promise.all(
      moderatorIds
        .filter((id) => id !== specialistUserId)
        .map((id) => this.notifications.notifyUser(id, title, body)),
    );
  }

  async notifyApproved(specialistUserId: string) {
    await this.notifications.notifyUser(
      specialistUserId,
      'Өтінім бекітілді',
      'Your specialist application has been approved',
    );
  }

  async notifyRejected(specialistUserId: string, reason: string) {
    await this.notifications.notifyUser(
      specialistUserId,
      'Өтінім қабылданбады',
      `Your application was rejected.\nReason: ${reason}\nYou may edit and resubmit your application.`,
    );
  }
}
