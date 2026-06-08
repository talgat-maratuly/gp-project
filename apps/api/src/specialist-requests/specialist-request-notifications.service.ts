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
      'Заявка на модерации',
      'Ваша заявка находится на проверке',
    );

    const moderatorIds = await this.moderatorAccess.findModeratorsToNotify(regionId);
    const title = isResubmit
      ? 'Обновленная заявка специалиста'
      : 'Новая заявка специалиста';
    const body = isResubmit
      ? 'Специалист отправил обновленную заявку'
      : 'Получена новая заявка специалиста';

    await Promise.all(
      moderatorIds
        .filter((id) => id !== specialistUserId)
        .map((id) => this.notifications.notifyUser(id, title, body)),
    );
  }

  async notifyApproved(specialistUserId: string) {
    await this.notifications.notifyUser(
      specialistUserId,
      'Заявка одобрена',
      'Ваша заявка специалиста одобрена',
    );
  }

  async notifyRejected(specialistUserId: string, reason: string) {
    await this.notifications.notifyUser(
      specialistUserId,
      'Заявка отклонена',
      `Ваша заявка отклонена.\nПричина: ${reason}\nВы можете отредактировать и отправить ее повторно.`,
    );
  }
}
