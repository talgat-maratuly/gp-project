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
  User,
  WorkStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { requestStatusFromPartnerStatus } from './request-status.mapper';
import { legacyOnlineToWorkStatus, workStatusToLegacyOnline } from './work-status.util';
import { ACCOUNT_STATUS_UI } from './account-status.transitions';
import { AccountStatusService } from './account-status.service';

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
  constructor(
    private prisma: PrismaService,
    private accountStatus: AccountStatusService,
  ) {}

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

  /** Login: тек BANNED блок */
  assertCanLogin(user: Pick<User, 'accountStatus' | 'accountStatusReason'>): void {
    if (user.accountStatus === AccountStatus.BANNED) {
      throw new UnauthorizedException({
        message: ACCOUNT_STATUS_UI.BANNED,
        accountStatus: AccountStatus.BANNED,
        reason: user.accountStatusReason,
      });
    }
  }

  /** Негізгі әрекеттер: тек ACTIVE */
  assertCanPerformCoreActions(
    user: Pick<User, 'accountStatus'> & { accountStatusReason?: string | null },
  ): void {
    if (user.accountStatus === AccountStatus.ACTIVE) return;
    if (user.accountStatus === AccountStatus.SUSPENDED) {
      throw new ForbiddenException({
        message: ACCOUNT_STATUS_UI.SUSPENDED,
        accountStatus: AccountStatus.SUSPENDED,
        reason: user.accountStatusReason,
      });
    }
    throw new ForbiddenException({
      message: ACCOUNT_STATUS_UI.BANNED,
      accountStatus: AccountStatus.BANNED,
      reason: user.accountStatusReason,
    });
  }

  /** @deprecated assertCanPerformCoreActions қолданыңыз */
  assertAccountActive(
    user: Pick<User, 'accountStatus'> & { accountStatusReason?: string | null },
  ): void {
    this.assertCanPerformCoreActions(user);
  }

  assertCanUsePlatform(user: Pick<User, 'accountStatus' | 'accountStatusReason'>): void {
    this.assertCanPerformCoreActions(user);
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
    this.assertCanPerformCoreActions(user);
    this.assertRequestApproved(profile);
  }

  assertCanAcceptOrders(
    user: Pick<User, 'accountStatus'>,
    profile: PartnerProfileStatusSlice,
  ): void {
    this.assertCanPerformCoreActions(user);
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
    return this.accountStatus.operatorChange(
      actorId,
      targetUserId,
      status,
      reason ?? 'Manual status change',
    );
  }

  async setWorkStatus(userId: string, workStatus: WorkStatus): Promise<PartnerProfileStatusSlice> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Пайдаланушы табылмады');

    const profile = await this.prisma.partnerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Специалист профилі жоқ');

    if (workStatus === WorkStatus.ONLINE) {
      this.assertCanGoOnline(user, profile);
    } else {
      this.assertCanPerformCoreActions(user);
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
      this.assertCanPerformCoreActions(user);
      return;
    }
    throw new BadRequestException(`WorkStatus ${next} әлі қолдау көрсетілмейді`);
  }
}
