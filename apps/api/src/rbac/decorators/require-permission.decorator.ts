import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'rbac_permission';

export type RbacPermission =
  | 'order:create'
  | 'order:accept'
  | 'specialist:approve'
  | 'user:assign-roles';

export const RequirePermission = (permission: RbacPermission) =>
  SetMetadata(PERMISSION_KEY, permission);
