import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PartnerStatus } from '@prisma/client';
import { isShopPartnerType } from '../../common/partner-access.util';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OnlyShopPartnerGuard implements CanActivate {
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
    if (!isShopPartnerType(profile.partnerType)) {
      throw new ForbiddenException('Раздел доступен только партнёрам типа «Магазин» (SHOP)');
    }
    return true;
  }
}
