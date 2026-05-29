import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserStatusService } from '../user-status.service';

/** Request APPROVED + Work ONLINE + Account ACTIVE */
@Injectable()
export class SpecialistOnlineGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private userStatus: UserStatusService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id;
    if (!userId) throw new ForbiddenException('Требуется авторизация');

    this.userStatus.assertAccountActive(req.user);

    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new ForbiddenException('Профиль партнёра не найден');

    this.userStatus.assertCanAcceptOrders(req.user, profile);
    req.partnerProfile = profile;
    return true;
  }
}
