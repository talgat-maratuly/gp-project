import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PartnerStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const STATUS_MESSAGES: Partial<Record<PartnerStatus, string>> = {
  DRAFT: 'Завершите и отправьте заявку на модерацию',
  PENDING_REVIEW: 'Заявка ожидает проверки администратором GP',
  NEEDS_REVISION: 'Заявка возвращена на доработку',
  REJECTED: 'Заявка отклонена',
  SUSPENDED: 'Аккаунт временно заблокирован',
};

@Injectable()
export class PartnerApprovedGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id;
    if (!userId) throw new ForbiddenException('Требуется авторизация');

    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
      select: { status: true, rejectionReason: true },
    });
    if (!profile) throw new ForbiddenException('Профиль партнёра не найден');

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
