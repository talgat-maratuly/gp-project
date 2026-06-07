import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountStatus,
  AccountStatusChangeType,
  PortalRole,
  Prisma,
  Role,
  User,
  WorkStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';
import { hasGlobalRegionAccess } from '../rbac/rbac.permissions';
import { AccountStatusAuditService } from './account-status-audit.service';
import { assertOperatorTransition } from './account-status.transitions';
import { NotificationsService } from '../notifications/notifications.service';

export type TransitionAccountStatusInput = {
  targetUserId: string;
  newStatus: AccountStatus;
  reason: string;
  changeType: AccountStatusChangeType;
  rule?: string | null;
  changedById?: string | null;
  skipOperatorCheck?: boolean;
};

@Injectable()
export class AccountStatusService {
  constructor(
    private prisma: PrismaService,
    private audit: AccountStatusAuditService,
    private rbac: RbacService,
    private notifications: NotificationsService,
  ) {}

  async transition(input: TransitionAccountStatusInput): Promise<User> {
    const target = await this.prisma.user.findUnique({ where: { id: input.targetUserId } });
    if (!target) throw new NotFoundException('Пайдаланушы табылмады');

    const oldStatus = target.accountStatus;
    if (oldStatus === input.newStatus) return target;

    if (input.changeType === AccountStatusChangeType.OPERATOR && input.changedById) {
      if (!input.skipOperatorCheck) {
        await this.assertOperatorCanChange(input.changedById, target, input.newStatus);
      }
    }

    if (input.changeType === AccountStatusChangeType.OPERATOR && input.changedById) {
      const actor = await this.prisma.user.findUnique({ where: { id: input.changedById } });
      const isAdmin =
        actor?.role === Role.ADMIN ||
        actor?.role === Role.SUPER_ADMIN ||
        this.rbac.resolvePortalRoles(actor!).includes(PortalRole.ADMIN);
      assertOperatorTransition(oldStatus, input.newStatus, { isAdmin });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: input.targetUserId },
        data: {
          accountStatus: input.newStatus,
          accountStatusReason: input.reason.trim(),
          accountStatusChangedAt: new Date(),
        },
      });

      if (input.newStatus !== AccountStatus.ACTIVE) {
        await tx.partnerProfile.updateMany({
          where: { userId: input.targetUserId },
          data: { workStatus: WorkStatus.OFFLINE, isOnline: false },
        });
      }

      await tx.accountStatusLog.create({
        data: {
          userId: input.targetUserId,
          oldStatus,
          newStatus: input.newStatus,
          changeType: input.changeType,
          reason: input.reason.trim(),
          rule: input.rule ?? null,
          changedById: input.changedById ?? null,
        },
      });

      return user;
    });

    await this.notifyUserStatusChange(updated, oldStatus, input.newStatus);
    if (
      input.changeType === AccountStatusChangeType.AUTO &&
      (input.newStatus === AccountStatus.SUSPENDED || input.newStatus === AccountStatus.BANNED)
    ) {
      await this.notifyModeratorsAutoAction(updated, input.newStatus, input.reason, input.rule);
    }

    return updated;
  }

  async operatorChange(
    actorId: string,
    targetUserId: string,
    newStatus: AccountStatus,
    reason: string,
  ): Promise<User> {
    return this.transition({
      targetUserId,
      newStatus,
      reason,
      changeType: AccountStatusChangeType.OPERATOR,
      changedById: actorId,
    });
  }

  async systemEnsureActive(userId: string, reason: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.accountStatus === AccountStatus.ACTIVE) return user!;
    return this.transition({
      targetUserId: userId,
      newStatus: AccountStatus.ACTIVE,
      reason,
      changeType: AccountStatusChangeType.SYSTEM,
      rule: 'SYSTEM_REGISTRATION',
      skipOperatorCheck: true,
    });
  }

  private async assertOperatorCanChange(
    actorId: string,
    target: User,
    newStatus: AccountStatus,
  ): Promise<void> {
    const actor = await this.prisma.user.findUnique({ where: { id: actorId } });
    if (!actor) throw new NotFoundException('Оператор табылмады');

    const roles = this.rbac.resolvePortalRoles(actor);
    const moderatorRoles: PortalRole[] = [
      PortalRole.GP_OPERATOR,
      PortalRole.FRANCHISE_OWNER,
      PortalRole.GLOBAL_OPERATOR,
      PortalRole.ADMIN,
    ];
    const canModerate = roles.some((r) => moderatorRoles.includes(r));
    if (!canModerate) {
      throw new ForbiddenException('Аккаунт статусын өзгертуге рұқсат жоқ');
    }

    if (hasGlobalRegionAccess(roles) || roles.includes(PortalRole.ADMIN)) return;

    if (roles.includes(PortalRole.GP_OPERATOR)) {
      if (!actor.regionId || actor.regionId !== target.regionId) {
        throw new ForbiddenException('Басқа аймақтағы пайдаланушыға қолжетімділік жоқ');
      }
      return;
    }

    if (roles.includes(PortalRole.FRANCHISE_OWNER)) {
      const franchise = actor.franchiseId
        ? await this.prisma.franchise.findUnique({ where: { id: actor.franchiseId } })
        : null;
      if (!franchise?.regionId || franchise.regionId !== target.regionId) {
        throw new ForbiddenException('Франшиза аймағынан тыс пайдаланушы');
      }
      return;
    }

    throw new ForbiddenException('Аймақ шектеуі');
  }

  async listUsersForModerator(
    actorId: string,
    query: {
      accountStatus?: AccountStatus;
      regionId?: string;
      dateFrom?: string;
      dateTo?: string;
      changeType?: AccountStatusChangeType;
      rule?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const actor = await this.prisma.user.findUnique({ where: { id: actorId } });
    if (!actor) throw new NotFoundException('Оператор табылмады');

    const roles = this.rbac.resolvePortalRoles(actor);
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const userWhere: Prisma.UserWhereInput = {
      ...(query.accountStatus ? { accountStatus: query.accountStatus } : {}),
      ...(query.regionId ? { regionId: query.regionId } : {}),
    };

    if (!hasGlobalRegionAccess(roles) && !roles.includes(PortalRole.ADMIN)) {
      if (roles.includes(PortalRole.GP_OPERATOR) && actor.regionId) {
        userWhere.regionId = actor.regionId;
      } else if (roles.includes(PortalRole.FRANCHISE_OWNER) && actor.franchiseId) {
        const fr = await this.prisma.franchise.findUnique({ where: { id: actor.franchiseId } });
        if (fr?.regionId) userWhere.regionId = fr.regionId;
      } else {
        throw new ForbiddenException('Тізімге қолжетімділік жоқ');
      }
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: userWhere,
        skip,
        take: limit,
        orderBy: { accountStatusChangedAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          regionId: true,
          accountStatus: true,
          accountStatusReason: true,
          accountStatusChangedAt: true,
          portalRoles: true,
          _count: { select: { complaintsReceived: true } },
        },
      }),
      this.prisma.user.count({ where: userWhere }),
    ]);

    let logs: Awaited<ReturnType<AccountStatusAuditService['listModerator']>> | null = null;
    if (query.changeType || query.rule || query.dateFrom || query.dateTo) {
      const logWhere: Prisma.AccountStatusLogWhereInput = {
        ...(query.changeType ? { changeType: query.changeType } : {}),
        ...(query.rule ? { rule: query.rule } : {}),
        ...(query.dateFrom || query.dateTo
          ? {
              createdAt: {
                ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
                ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
              },
            }
          : {}),
        user: userWhere,
      };
      logs = await this.audit.listModerator(logWhere, page, limit);
    }

    return {
      users,
      logs: logs?.items ?? null,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  private async notifyUserStatusChange(
    user: User,
    oldStatus: AccountStatus,
    newStatus: AccountStatus,
  ) {
    if (newStatus === AccountStatus.SUSPENDED) {
      await this.notifications.notifyUser(
        user.id,
        'Аккаунт тоқтатылды',
        'Your account has been temporarily suspended.\nPlease contact support for more information.',
      );
    }
    if (newStatus === AccountStatus.BANNED) {
      await this.notifications.notifyUser(
        user.id,
        'Аккаунт бұғатталды',
        'Your account has been banned.',
      );
    }
    if (oldStatus !== AccountStatus.ACTIVE && newStatus === AccountStatus.ACTIVE) {
      await this.notifications.notifyUser(
        user.id,
        'Аккаунт қалпына келтірілді',
        'Your account is active again.',
      );
    }
  }

  private async notifyModeratorsAutoAction(
    target: User,
    status: AccountStatus,
    reason: string,
    rule?: string | null,
  ) {
    if (!target.regionId) return;
    const moderators = await this.prisma.user.findMany({
      where: {
        accountStatus: AccountStatus.ACTIVE,
        OR: [
          { regionId: target.regionId, portalRoles: { has: PortalRole.GP_OPERATOR } },
          { portalRoles: { hasSome: [PortalRole.GLOBAL_OPERATOR, PortalRole.ADMIN] } },
        ],
      },
      select: { id: true },
    });
    const title =
      status === AccountStatus.BANNED ? 'Auto-ban' : 'Auto-suspend';
    const body = `User ${target.id}: ${reason}${rule ? ` (${rule})` : ''}`;
    await Promise.all(
      moderators.map((m) => this.notifications.notifyUser(m.id, title, body)),
    );
  }
}
