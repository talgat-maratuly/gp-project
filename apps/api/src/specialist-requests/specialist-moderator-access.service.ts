import { ForbiddenException, Injectable } from '@nestjs/common';
import { AccountStatus, PortalRole, Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';
import { hasGlobalRegionAccess } from '../rbac/rbac.permissions';

@Injectable()
export class SpecialistModeratorAccessService {
  constructor(
    private prisma: PrismaService,
    private rbac: RbacService,
  ) {}

  private readonly moderatorRoles: PortalRole[] = [
    PortalRole.GP_OPERATOR,
    PortalRole.FRANCHISE_OWNER,
    PortalRole.GLOBAL_OPERATOR,
    PortalRole.ADMIN,
  ];

  canModerate(actor: User): boolean {
    return this.rbac.resolvePortalRoles(actor).some((r) => this.moderatorRoles.includes(r));
  }

  assertCanModerate(actor: User): void {
    if (!this.canModerate(actor)) {
      throw new ForbiddenException('Модерацияға рұқсат жоқ');
    }
  }

  /** Prisma where для модератор тізімі */
  async buildListWhere(actor: User): Promise<Prisma.SpecialistRequestWhereInput> {
    const roles = this.rbac.resolvePortalRoles(actor);
    if (hasGlobalRegionAccess(roles) || roles.includes(PortalRole.ADMIN)) {
      return {};
    }

    if (roles.includes(PortalRole.FRANCHISE_OWNER)) {
      const franchiseId = actor.franchiseId;
      if (!franchiseId) {
        throw new ForbiddenException('Франшиза орнатылмаған');
      }
      const franchise = await this.prisma.franchise.findUnique({
        where: { id: franchiseId },
      });
      if (!franchise?.regionId) {
        throw new ForbiddenException('Франшиза аймағы жоқ');
      }
      return { regionId: franchise.regionId };
    }

    if (roles.includes(PortalRole.GP_OPERATOR)) {
      if (!actor.regionId) {
        throw new ForbiddenException('Оператор аймағы орнатылмаған');
      }
      return { regionId: actor.regionId };
    }

    throw new ForbiddenException('Модерацияға рұқсат жоқ');
  }

  async assertCanModerateRequest(actor: User, regionId: string): Promise<void> {
    const where = await this.buildListWhere(actor);
    if (Object.keys(where).length === 0) return;
    if ('regionId' in where && where.regionId !== regionId) {
      throw new ForbiddenException('Бұл аймақтағы өтінімдерге қолжетімділік жоқ');
    }
  }

  async findModeratorsToNotify(regionId: string): Promise<string[]> {
    const franchise = await this.prisma.franchise.findFirst({
      where: { regionId, isActive: true },
    });

    const userIds = new Set<string>();

    const gpOperators = await this.prisma.user.findMany({
      where: {
        regionId,
        accountStatus: AccountStatus.ACTIVE,
        portalRoles: { has: PortalRole.GP_OPERATOR },
      },
      select: { id: true },
    });
    gpOperators.forEach((u) => userIds.add(u.id));

    if (franchise) {
      const owners = await this.prisma.user.findMany({
        where: {
          franchiseId: franchise.id,
          accountStatus: AccountStatus.ACTIVE,
          portalRoles: { has: PortalRole.FRANCHISE_OWNER },
        },
        select: { id: true },
      });
      owners.forEach((u) => userIds.add(u.id));
    } else {
      const globals = await this.prisma.user.findMany({
        where: {
          accountStatus: AccountStatus.ACTIVE,
          portalRoles: { hasSome: [PortalRole.GLOBAL_OPERATOR, PortalRole.ADMIN] },
        },
        select: { id: true },
      });
      globals.forEach((u) => userIds.add(u.id));
    }

    return [...userIds];
  }
}
