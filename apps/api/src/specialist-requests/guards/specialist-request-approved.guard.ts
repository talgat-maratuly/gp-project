import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { RequestStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SpecialistRequestsService } from '../specialist-requests.service';

/** PENDING specialist — тапсырыс көре/қабылдай алмайды */
@Injectable()
export class SpecialistRequestApprovedGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private specialistRequests: SpecialistRequestsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id;
    if (!userId) return false;

    const sr = await this.prisma.specialistRequest.findUnique({
      where: { userId },
      select: { status: true },
    });
    const status =
      sr?.status ??
      (
        await this.prisma.partnerProfile.findUnique({
          where: { userId },
          select: { requestStatus: true },
        })
      )?.requestStatus;

    this.specialistRequests.assertSpecialistCanViewOrders(userId, status ?? RequestStatus.PENDING);
    return true;
  }
}
