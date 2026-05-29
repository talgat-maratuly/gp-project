import { BadRequestException } from '@nestjs/common';
import { PortalRole } from '@prisma/client';

const OPERATOR_ROLES: PortalRole[] = [
  PortalRole.GP_OPERATOR,
  PortalRole.GLOBAL_OPERATOR,
  PortalRole.FRANCHISE_OWNER,
];

const FORBIDDEN_WITH_SPECIALIST: PortalRole[] = [
  PortalRole.GP_OPERATOR,
  PortalRole.GLOBAL_OPERATOR,
  PortalRole.FRANCHISE_OWNER,
];

/** Рұқсат етілген комбинациялар (негізгі ережелер) */
export function normalizePortalRoles(roles: PortalRole[]): PortalRole[] {
  return [...new Set(roles)].sort();
}

export function assertValidRoleCombination(roles: PortalRole[]): void {
  const set = new Set(roles);

  if (set.has(PortalRole.SPECIALIST)) {
    for (const forbidden of FORBIDDEN_WITH_SPECIALIST) {
      if (set.has(forbidden)) {
        throw new BadRequestException(
          `Рөл конфликті: SPECIALIST бірге ${forbidden} болмауы керек`,
        );
      }
    }
  }

  if (set.has(PortalRole.FRANCHISE_OWNER) && set.has(PortalRole.SPECIALIST)) {
    throw new BadRequestException('FRANCHISE_OWNER SPECIALIST бола алмайды');
  }
}

/** GP/GLOBAL оператор тағайындалғанда SPECIALIST алып тасталады */
export function sanitizeRolesOnAssignment(
  next: PortalRole[],
  options?: { stripSpecialistForOperator?: boolean },
): PortalRole[] {
  let roles = normalizePortalRoles(next);
  if (options?.stripSpecialistForOperator !== false) {
    const hasOperator = roles.some((r) => OPERATOR_ROLES.includes(r));
    if (hasOperator) {
      roles = roles.filter((r) => r !== PortalRole.SPECIALIST);
    }
  }
  assertValidRoleCombination(roles);
  return roles;
}

export function hasAnyRole(roles: PortalRole[], required: PortalRole[]): boolean {
  return required.some((r) => roles.includes(r));
}

export function hasAllRoles(roles: PortalRole[], required: PortalRole[]): boolean {
  return required.every((r) => roles.includes(r));
}
