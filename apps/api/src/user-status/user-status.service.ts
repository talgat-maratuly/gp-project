import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AccountStatus,
  PartnerStatus,
  RequestStatus,
  Role,
  User,
  WorkStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { requestStatusFromPartnerStatus } from './request-status.mapper';
import { legacyOnlineToWorkStatus, workStatusToLegacyOnline } from './work-status.util';

export type UserStatusSnapshot = {
  accountStatus: AccountStatus;
  requestStatus: RequestStatus | null;
  workStatus: WorkStatus | null;
  partnerWorkflowStatus: PartnerStatus | null;
};

export type PartnerProfileStatusSlice = {
  status: PartnerStatus;
  requestStatus: RequestStatus | null;
  workStatus: WorkStatus;
  isOnline: boolean;
};

@Injectable()
export class UserStatusService {
  constructor(private prisma: PrismaService) {}

  snapshot(
    user: Pick<User, 'accountStatus'>,
    partner?: PartnerProfileStatusSlice | null,
  ): UserStatusSnapshot {
    return {
      accountStatus: user.accountStatus,
      requestStatus: partner?.requestStatus ?? null,
      workStatus: partner ? partner.workStatus : null,
      partnerWorkflowStatus: partner?.status ?? null,
    };
  }

  assertAccountActive(
    user: Pick<User, 'accountStatus'> & { accountStatusReason?: string | null },
  ): void {
    if (user.accountStatus === AccountStatus.ACTIVE) return;
    if (user.accountStatus === AccountStatus.SUSPENDED) {
      throw new UnauthorizedException({
        message: 'Аккаунт уақытша тоқтатылған',
        accountStatus: AccountStatus.SUSPENDED,
        reason: user.accountStatusReason,
      });
    }
    throw new UnauthorizedException({
      message: 'Аккаунт бұғатталған',
      accountStatus: AccountStatus.BANNED,
      reason: user.accountStatusReason,
    });
  }

  assertCanUsePlatform(user: Pick<User, 'accountStatus' | 'accountStatusReason'>): void {
    this.assertAccountActive(user);
  }

  assertRequestApproved(profile: Pick<PartnerProfileStatusSlice, 'requestStatus' | 'status'>): void {
    const request = profile.requestStatus ?? requestStatusFromPartnerStatus(profile.status);
    if (request !== RequestStatus.APPROVED) {
      throw new ForbiddenException({
        message: 'Специалист рұқсаты бекітілмеген',
        requestStatus: request,
      });
    }
  }

  assertCanGoOnline(
    user: Pick<User, 'accountStatus'>,
    profile: Pick<PartnerProfileStatusSlice, 'requestStatus' | 'status'>,
  ): void {
    this.assertAccountActive(user);
    this.assertRequestApproved(profile);
  }

  assertCanAcceptOrders(
    user: Pick<User, 'accountStatus'>,
    profile: PartnerProfileStatusSlice,
  ): void {
    this.assertAccountActive(user);
    this.assertRequestApproved(profile);
    if (profile.status !== PartnerStatus.APPROVED) {
      throw new ForbiddenException({
        message: 'Партнёр профилі белсенді емес',
        partnerStatus: profile.status,
      });
    }
    if (profile.workStatus !== WorkStatus.ONLINE) {
      throw new ForbiddenException({
        message: 'Специалист жұмысқа дайын емес (OFFLINE)',
        workStatus: profile.workStatus,
      });
    }
  }

  async setAccountStatus(
    actorId: string,
    targetUserId: string,
    status: AccountStatus,
    reason?: string,
  ): Promise<User> {
    const actor = await this.prisma.user.findUnique({ where: { id: actorId } });
    if (!actor) throw new NotFoundException('Actor табылмады');
    if (actor.role !== Role.ADMIN && actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Тек ADMIN аккаунт статусын өзгерте алады');
    }

    const target = await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        accountStatus: status,
        accountStatusReason: reason?.trim() || null,
        accountStatusChangedAt: new Date(),
      },
    });

    if (status !== AccountStatus.ACTIVE) {
      await this.prisma.partnerProfile.updateMany({
        where: { userId: targetUserId },
        data: {
          workStatus: WorkStatus.OFFLINE,
          isOnline: false,
        },
      });
    }

    return target;
  }

  async setWorkStatus(userId: string, workStatus: WorkStatus): Promise<PartnerProfileStatusSlice> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Пайдаланушы табылмады');

    const profile = await this.prisma.partnerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Специалист профилі жоқ');

    if (workStatus === WorkStatus.ONLINE) {
      this.assertCanGoOnline(user, profile);
    } else {
      this.assertAccountActive(user);
    }

    const updated = await this.prisma.partnerProfile.update({
      where: { id: profile.id },
      data: {
        workStatus,
        isOnline: workStatusToLegacyOnline(workStatus),
      },
      select: {
        status: true,
        requestStatus: true,
        workStatus: true,
        isOnline: true,
      },
    });
    return updated;
  }

  /** Partner moderation workflow синхрондау */
  syncRequestStatusFromPartnerStatus(
    partnerStatus: PartnerStatus,
  ): RequestStatus | null {
    return requestStatusFromPartnerStatus(partnerStatus);
  }

  async applyPartnerWorkflowStatus(
    partnerId: string,
    partnerStatus: PartnerStatus,
    extra?: { workStatus?: WorkStatus },
  ): Promise<void> {
    const requestStatus = this.syncRequestStatusFromPartnerStatus(partnerStatus);
    await this.prisma.partnerProfile.update({
      where: { id: partnerId },
      data: {
        status: partnerStatus,
        requestStatus,
        ...(extra?.workStatus != null
          ? {
              workStatus: extra.workStatus,
              isOnline: workStatusToLegacyOnline(extra.workStatus),
            }
          : partnerStatus === PartnerStatus.APPROVED
            ? {}
            : partnerStatus === PartnerStatus.SUSPENDED ||
                partnerStatus === PartnerStatus.REJECTED
              ? {
                  workStatus: WorkStatus.OFFLINE,
                  isOnline: false,
                }
              : {}),
      },
    });
  }

  resolveWorkStatusFromBody(body: {
    workStatus?: WorkStatus;
    isOnline?: boolean;
  }): WorkStatus | undefined {
    if (body.workStatus) return body.workStatus;
    if (body.isOnline !== undefined) return legacyOnlineToWorkStatus(body.isOnline);
    return undefined;
  }

  assertValidWorkStatusTransition(
    current: WorkStatus,
    next: WorkStatus,
    profile: Pick<PartnerProfileStatusSlice, 'requestStatus' | 'status'>,
    user: Pick<User, 'accountStatus'>,
  ): void {
    if (current === next) return;
    if (next === WorkStatus.ONLINE) {
      this.assertCanGoOnline(user, profile);
      return;
    }
    if (next === WorkStatus.OFFLINE) {
      this.assertAccountActive(user);
      return;
    }
    throw new BadRequestException(`WorkStatus ${next} әлі қолдау көрсетілмейді`);
  }
}
