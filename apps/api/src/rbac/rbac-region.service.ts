import { ForbiddenException, Injectable } from '@nestjs/common';
import { PortalRole } from '@prisma/client';
import { RegionAccessService, RegionScopedUser } from '../common/region-access.service';
import { RbacService, UserWithProfiles } from './rbac.service';
import { hasGlobalRegionAccess } from './rbac.permissions';

/**
 * Аймақтық оқшаулау — legacy RegionAccessService + Portal RBAC.
 */
@Injectable()
export class RbacRegionService {
  constructor(
    private regionAccess: RegionAccessService,
    private rbac: RbacService,
  ) {}

  regionWhere(user: UserWithProfiles): { regionId?: string } {
    const roles = this.rbac.resolvePortalRoles(user);
    if (hasGlobalRegionAccess(roles)) return {};
    if (roles.includes(PortalRole.GP_OPERATOR) || roles.includes(PortalRole.FRANCHISE_OWNER)) {
      if (!user.regionId) {
        throw new ForbiddenException('Оператор аймағы орнатылмаған');
      }
      return { regionId: user.regionId };
    }
    return this.regionAccess.regionWhere(user as RegionScopedUser);
  }

  assertCanAccessRegion(user: UserWithProfiles, regionId: string): void {
    this.rbac.assertCanAccessRegion(user, regionId);
  }

  resolveOrderRegionId(user: UserWithProfiles, requestedRegionId?: string): string {
    const roles = this.rbac.resolvePortalRoles(user);
    if (hasGlobalRegionAccess(roles)) {
      if (requestedRegionId) {
        return requestedRegionId;
      }
      if (user.regionId) return user.regionId;
      throw new ForbiddenException('GLOBAL оператор үшін regionId көрсетіңіз');
    }
    if (roles.includes(PortalRole.GP_OPERATOR)) {
      if (!user.regionId) {
        throw new ForbiddenException('GP оператор аймағы орнатылмаған');
      }
      if (requestedRegionId && requestedRegionId !== user.regionId) {
        throw new ForbiddenException('Басқа аймақта тапсырыс құруға болмайды');
      }
      return user.regionId;
    }
    return this.regionAccess.resolveClientRegionId(user as RegionScopedUser, requestedRegionId);
  }
}
