import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PortalRole } from '@prisma/client';
import { PORTAL_ROLES_KEY } from '../decorators/portal-roles.decorator';
import { RbacService } from '../rbac.service';

@Injectable()
export class PortalRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbac: RbacService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<PortalRole[]>(PORTAL_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    const effective = this.rbac.resolvePortalRoles(user);
    user.effectivePortalRoles = effective;
    return required.some((r) => effective.includes(r));
  }
}
