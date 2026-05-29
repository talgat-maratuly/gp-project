import { PartnerStatus, PortalRole, Role, User } from '@prisma/client';

type UserWithPartner = User & {
  partnerProfile?: { status: PartnerStatus } | null;
};

/**
 * Legacy бір `Role` + partner статусынан PortalRole[] құрастыру.
 * `portalRoles` DB-де толтырылған болса — оны қолданыңыз (RbacService).
 */
export function mapLegacyToPortalRoles(user: UserWithPartner): PortalRole[] {
  const roles = new Set<PortalRole>([PortalRole.CLIENT]);

  switch (user.role) {
    case Role.REGION_ADMIN:
      roles.add(PortalRole.GP_OPERATOR);
      break;
    case Role.SUPER_ADMIN:
      roles.add(PortalRole.GLOBAL_OPERATOR);
      roles.add(PortalRole.ADMIN);
      break;
    case Role.ADMIN:
      roles.add(PortalRole.ADMIN);
      roles.add(PortalRole.GLOBAL_OPERATOR);
      break;
    case Role.PARTNER:
      roles.add(PortalRole.SPECIALIST);
      break;
    case Role.CLIENT:
    default:
      break;
  }

  if (
    user.partnerProfile?.status === PartnerStatus.APPROVED &&
    user.role !== Role.REGION_ADMIN &&
    user.role !== Role.SUPER_ADMIN &&
    user.role !== Role.ADMIN
  ) {
    roles.add(PortalRole.SPECIALIST);
  }

  if (user.franchiseId) {
    roles.add(PortalRole.FRANCHISE_OWNER);
  }

  return [...roles].sort();
}

/** Жаңа portalRoles ↔ legacy Role синхрондау (бір негізгі рөл) */
export function syncLegacyRoleFromPortalRoles(portalRoles: PortalRole[]): Role {
  if (portalRoles.includes(PortalRole.ADMIN) || portalRoles.includes(PortalRole.GLOBAL_OPERATOR)) {
    return portalRoles.includes(PortalRole.GLOBAL_OPERATOR) ? Role.SUPER_ADMIN : Role.ADMIN;
  }
  if (portalRoles.includes(PortalRole.GP_OPERATOR) || portalRoles.includes(PortalRole.FRANCHISE_OWNER)) {
    return Role.REGION_ADMIN;
  }
  if (portalRoles.includes(PortalRole.SPECIALIST)) {
    return Role.PARTNER;
  }
  return Role.CLIENT;
}
