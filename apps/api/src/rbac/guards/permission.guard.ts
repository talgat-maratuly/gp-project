import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PortalRole } from '@prisma/client';
import {
  PERMISSION_KEY,
  RbacPermission,
} from '../decorators/require-permission.decorator';
import { RbacService } from '../rbac.service';
import {
  canApproveSpecialists,
  canCreateOrder,
  canAcceptOrders,
  canAssignGpOperator,
} from '../rbac.permissions';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbac: RbacService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<RbacPermission>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!permission) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    const roles = this.rbac.resolvePortalRoles(user);
    user.effectivePortalRoles = roles;

    const allowed = this.check(permission, roles);
    if (!allowed) {
      throw new ForbiddenException('Рұқсат жоқ');
    }
    return true;
  }

  private check(permission: RbacPermission, roles: PortalRole[]): boolean {
    switch (permission) {
      case 'order:create':
        return canCreateOrder(roles);
      case 'order:accept':
        return canAcceptOrders(roles);
      case 'specialist:approve':
        return canApproveSpecialists(roles);
      case 'user:assign-roles':
        return canAssignGpOperator(roles) || roles.includes(PortalRole.ADMIN);
      default:
        return false;
    }
  }
}
