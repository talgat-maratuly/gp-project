import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PartnerStatus, PortalRole, Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  canAssignFranchiseOwner,
  canAssignGlobalOperator,
  canAssignGpOperator,
  canApproveSpecialists,
  canCreateOrder,
  hasGlobalRegionAccess,
} from './rbac.permissions';
import { mapLegacyToPortalRoles, syncLegacyRoleFromPortalRoles } from './legacy-role.mapper';
import {
  assertValidRoleCombination,
  normalizePortalRoles,
  sanitizeRolesOnAssignment,
} from './role-conflict.validator';

export type UserWithProfiles = User & {
  partnerProfile?: { status: PartnerStatus } | null;
};

export type PortalJwtUser = UserWithProfiles & { effectivePortalRoles: PortalRole[] };

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  /** DB portalRoles немесе legacy mapping */
  resolvePortalRoles(user: UserWithProfiles): PortalRole[] {
    const stored = user.portalRoles?.filter(Boolean) ?? [];
    if (stored.length > 0) {
      return normalizePortalRoles(stored);
    }
    return mapLegacyToPortalRoles(user);
  }

  attachEffectiveRoles<T extends UserWithProfiles>(user: T): T & { effectivePortalRoles: PortalRole[] } {
    return { ...user, effectivePortalRoles: this.resolvePortalRoles(user) };
  }

  assertCanCreateOrder(user: UserWithProfiles): void {
    const roles = this.resolvePortalRoles(user);
    if (!canCreateOrder(roles)) {
      throw new ForbiddenException('Тапсырыс құруға рұқсат жоқ');
    }
  }

  assertCanApproveSpecialists(actor: UserWithProfiles): void {
    if (!canApproveSpecialists(this.resolvePortalRoles(actor))) {
      throw new ForbiddenException('Специалисттерді бекітуге рұқсат жоқ');
    }
  }

  assertCanAccessRegion(user: UserWithProfiles, regionId: string): void {
    if (hasGlobalRegionAccess(this.resolvePortalRoles(user))) return;
    const roles = this.resolvePortalRoles(user);
    const regionalRoles: PortalRole[] = [PortalRole.GP_OPERATOR, PortalRole.FRANCHISE_OWNER];
    const regional = roles.some((r) => regionalRoles.includes(r));
    if (!regional || !user.regionId || user.regionId !== regionId) {
      throw new ForbiddenException('Бұл аймаққа қолжетімділік жоқ');
    }
  }

  async assignPortalRoles(
    actor: UserWithProfiles,
    targetUserId: string,
    nextRoles: PortalRole[],
    opts?: { regionId?: string; franchiseId?: string },
  ): Promise<User> {
    const actorRoles = this.resolvePortalRoles(actor);
    const sanitized = sanitizeRolesOnAssignment(nextRoles);

    if (sanitized.includes(PortalRole.GP_OPERATOR) && !canAssignGpOperator(actorRoles)) {
      throw new ForbiddenException('GP_OPERATOR тағайындауға рұқсат жоқ');
    }
    if (sanitized.includes(PortalRole.FRANCHISE_OWNER) && !canAssignFranchiseOwner(actorRoles)) {
      throw new ForbiddenException('FRANCHISE_OWNER тек ADMIN тағайындай алады');
    }
    if (sanitized.includes(PortalRole.GLOBAL_OPERATOR) && !canAssignGlobalOperator(actorRoles)) {
      throw new ForbiddenException('GLOBAL_OPERATOR тек ADMIN тағайындай алады');
    }

    if (sanitized.includes(PortalRole.FRANCHISE_OWNER)) {
      if (!opts?.franchiseId && !opts?.regionId) {
        throw new ForbiddenException('FRANCHISE_OWNER үшін franchiseId немесе regionId керек');
      }
    }

    if (sanitized.includes(PortalRole.GP_OPERATOR) && opts?.regionId) {
      await this.assertRegionActive(opts.regionId);
    }

    const legacyRole = syncLegacyRoleFromPortalRoles(sanitized);

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { partnerProfile: true },
    });
    if (!target) throw new NotFoundException('Пайдаланушы табылмады');

    const operatorRoles: PortalRole[] = [
      PortalRole.GP_OPERATOR,
      PortalRole.GLOBAL_OPERATOR,
      PortalRole.FRANCHISE_OWNER,
    ];

    const data: Prisma.UserUpdateInput = {
      portalRoles: sanitized,
      role: legacyRole,
      region: opts?.regionId
        ? { connect: { id: opts.regionId } }
        : target.regionId
          ? { connect: { id: target.regionId } }
          : undefined,
      franchise: opts?.franchiseId
        ? { connect: { id: opts.franchiseId } }
        : target.franchiseId
          ? { connect: { id: target.franchiseId } }
          : undefined,
    };

    if (sanitized.some((r) => operatorRoles.includes(r))) {
      if (target.partnerProfile) {
        await this.prisma.partnerProfile.update({
          where: { userId: targetUserId },
          data: { status: PartnerStatus.SUSPENDED },
        });
      }
    }

    return this.prisma.user.update({ where: { id: targetUserId }, data });
  }

  /** Specialist бекітілгенде CLIENT + SPECIALIST */
  async onSpecialistApproved(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Пайдаланушы табылмады');

    const current = this.resolvePortalRoles(user);
    const next = sanitizeRolesOnAssignment([
      ...current.filter((r) => r !== PortalRole.SPECIALIST),
      PortalRole.CLIENT,
      PortalRole.SPECIALIST,
    ]);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        portalRoles: next,
        role: Role.PARTNER,
      },
    });
  }

  /** Тіркелу: әрқашама CLIENT */
  defaultRolesForRegistration(): PortalRole[] {
    return [PortalRole.CLIENT];
  }

  validateCombination(roles: PortalRole[]): void {
    assertValidRoleCombination(normalizePortalRoles(roles));
  }

  private async assertRegionActive(regionId: string): Promise<void> {
    const region = await this.prisma.region.findUnique({ where: { id: regionId } });
    if (!region?.isActive) throw new NotFoundException('Аймақ табылмады');
  }
}
