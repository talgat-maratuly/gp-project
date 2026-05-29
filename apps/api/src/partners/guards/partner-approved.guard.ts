import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PartnerStatus, RequestStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UserStatusService } from '../../user-status/user-status.service';
import { requestStatusFromPartnerStatus } from '../../user-status/request-status.mapper';

const STATUS_MESSAGES: Partial<Record<PartnerStatus, string>> = {
  DRAFT: 'Завершите и отправьте заявку на модерацию',
  PENDING_REVIEW: 'Заявка ожидает проверки администратором GP',
  NEEDS_REVISION: 'Заявка возвращена на доработку',
  REJECTED: 'Заявка отклонена',
  SUSPENDED: 'Аккаунт временно заблокирован',
};

@Injectable()
export class PartnerApprovedGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private userStatus: UserStatusService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id;
    if (!userId) throw new ForbiddenException('Требуется авторизация');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException('Пользователь не найден');
    this.userStatus.assertCanPerformCoreActions(user);

    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
      select: { status: true, rejectionReason: true, requestStatus: true, workStatus: true },
    });
    if (!profile) throw new ForbiddenException('Профиль партнёра не найден');

    const request =
      profile.requestStatus ?? requestStatusFromPartnerStatus(profile.status);
    if (request !== RequestStatus.APPROVED) {
      throw new ForbiddenException({
        message: 'Заявка специалиста не одобрена',
        requestStatus: request,
        status: profile.status,
      });
    }

    if (profile.status !== PartnerStatus.APPROVED) {
      const msg = STATUS_MESSAGES[profile.status] || 'Доступ к заказам закрыт до одобрения заявки';
      throw new ForbiddenException({
        message: msg,
        status: profile.status,
        rejectionReason: profile.rejectionReason,
      });
    }
    return true;
  }
}
