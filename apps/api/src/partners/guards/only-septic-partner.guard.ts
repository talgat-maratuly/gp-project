import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PartnerStatus, PartnerType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** GPS / карта — только септик */
@Injectable()
export class OnlySepticPartnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const userId = context.switchToHttp().getRequest().user?.id;
    if (!userId) throw new ForbiddenException('Требуется авторизация');

    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
      select: { status: true, partnerType: true },
    });
    if (!profile) throw new ForbiddenException('Профиль партнёра не найден');
    if (profile.status !== PartnerStatus.APPROVED) {
      throw new ForbiddenException('Доступ открыт после одобрения заявки');
    }
    if (profile.partnerType !== PartnerType.SEPTIC_SERVICE) {
      throw new ForbiddenException('Карта и GPS доступны только партнёрам септика');
    }
    return true;
  }
}
