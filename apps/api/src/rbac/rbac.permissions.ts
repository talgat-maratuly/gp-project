import { PortalRole } from '@prisma/client';

export const ORDER_CREATE_ROLES: PortalRole[] = [
  PortalRole.CLIENT,
  PortalRole.GP_OPERATOR,
  PortalRole.GLOBAL_OPERATOR,
  PortalRole.ADMIN,
];

export const SPECIALIST_ORDER_ROLES: PortalRole[] = [PortalRole.SPECIALIST];

export const REGIONAL_OPERATOR_ROLES: PortalRole[] = [
  PortalRole.GP_OPERATOR,
  PortalRole.FRANCHISE_OWNER,
];

export const GLOBAL_ACCESS_ROLES: PortalRole[] = [
  PortalRole.GLOBAL_OPERATOR,
  PortalRole.ADMIN,
];

export function canCreateOrder(roles: PortalRole[]): boolean {
  return ORDER_CREATE_ROLES.some((r) => roles.includes(r));
}

export function canAcceptOrders(roles: PortalRole[]): boolean {
  return roles.includes(PortalRole.SPECIALIST);
}

const APPROVE_SPECIALIST_ROLES: PortalRole[] = [
  PortalRole.GP_OPERATOR,
  PortalRole.FRANCHISE_OWNER,
  PortalRole.GLOBAL_OPERATOR,
  PortalRole.ADMIN,
];

const ASSIGN_GP_OPERATOR_ROLES: PortalRole[] = [
  PortalRole.ADMIN,
  PortalRole.GLOBAL_OPERATOR,
  PortalRole.FRANCHISE_OWNER,
];

const GLOBAL_ACCESS: PortalRole[] = [PortalRole.GLOBAL_OPERATOR, PortalRole.ADMIN];

export function canApproveSpecialists(roles: PortalRole[]): boolean {
  return roles.some((r) => APPROVE_SPECIALIST_ROLES.includes(r));
}

export function canAssignGpOperator(roles: PortalRole[]): boolean {
  return roles.some((r) => ASSIGN_GP_OPERATOR_ROLES.includes(r));
}

export function canAssignFranchiseOwner(roles: PortalRole[]): boolean {
  return roles.includes(PortalRole.ADMIN);
}

export function canAssignGlobalOperator(roles: PortalRole[]): boolean {
  return roles.includes(PortalRole.ADMIN);
}

export function hasGlobalRegionAccess(roles: PortalRole[]): boolean {
  return roles.some((r) => GLOBAL_ACCESS.includes(r));
}
