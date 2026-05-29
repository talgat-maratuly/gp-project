import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  AccountType,
  PartnerRole,
  PartnerStatus,
  PartnerType,
  PortalRole,
  Role,
  User,
} from '@prisma/client';
import {
  assertValidRoleCombination,
  normalizePortalRoles,
} from '../rbac/role-conflict.validator';
import { syncLegacyRoleFromPortalRoles } from '../rbac/legacy-role.mapper';
import { MobileOtpVerifyDto } from './dto/mobile-otp-verify.dto';

export type OtpLoginAs = 'client' | 'partner' | 'admin';

const STAFF_ROLES = new Set<Role>([Role.ADMIN, Role.SUPER_ADMIN, Role.REGION_ADMIN]);

export function resolveOtpLoginAs(dto: MobileOtpVerifyDto): OtpLoginAs {
  if (dto.loginAs === 'partner' || dto.loginAs === 'admin' || dto.loginAs === 'client') {
    return dto.loginAs;
  }
  return dto.desiredRole === Role.PARTNER ? 'partner' : 'client';
}

export function resolveOtpSessionRole(user: Pick<User, 'role'>, loginAs: OtpLoginAs): Role {
  if (loginAs === 'admin') {
    if (STAFF_ROLES.has(user.role)) return user.role;
    throw new ForbiddenException('Бұл нөмірге admin қолжетімділік берілмеген');
  }
  if (loginAs === 'partner') return Role.PARTNER;
  return Role.CLIENT;
}

/** OTP кіру кезінде portalRoles: CLIENT + SPECIALIST (+ бар admin рөлдері сақталады) */
export function mergePortalRolesForOtpLogin(
  existing: PortalRole[] | null | undefined,
  loginAs: OtpLoginAs,
): PortalRole[] {
  const next = new Set<PortalRole>(existing?.length ? existing : [PortalRole.CLIENT]);
  next.add(PortalRole.CLIENT);
  if (loginAs === 'partner') {
    next.add(PortalRole.SPECIALIST);
  }
  const normalized = normalizePortalRoles([...next]);
  assertValidRoleCombination(normalized);
  return normalized;
}

export function assertAdminOtpLoginAllowed(user: Pick<User, 'role'>, portalRoles: PortalRole[]) {
  if (STAFF_ROLES.has(user.role)) return;
  const adminPortal = portalRoles.some(
    (r) =>
      r === PortalRole.ADMIN ||
      r === PortalRole.GLOBAL_OPERATOR ||
      r === PortalRole.GP_OPERATOR,
  );
  if (!adminPortal) {
    throw new ForbiddenException('Бұл нөмірге admin қолжетімділік берілмеген');
  }
}

export function syncUserRoleFromPortalRoles(portalRoles: PortalRole[]): Role {
  return syncLegacyRoleFromPortalRoles(portalRoles);
}

export function buildNewUserCreateData(params: {
  email: string;
  passwordHash: string;
  phone: string;
  name?: string;
  regionId?: string | null;
  city: string;
  loginAs: OtpLoginAs;
  accountType: AccountType;
  portalRoles: PortalRole[];
}) {
  const { loginAs, portalRoles, accountType, city, regionId } = params;
  const legacyRole = syncUserRoleFromPortalRoles(portalRoles);

  const base = {
    email: params.email,
    passwordHash: params.passwordHash,
    name: params.name?.trim() || (loginAs === 'partner' ? 'Серіктес' : 'Клиент GP'),
    phone: params.phone,
    role: legacyRole,
    portalRoles,
    regionId: regionId ?? undefined,
  };

  const profiles: Record<string, unknown> = {};

  if (loginAs === 'client' || loginAs === 'admin') {
    profiles.clientProfile = {
      create: { accountType: AccountType.INDIVIDUAL, city },
    };
  }

  if (loginAs === 'partner') {
    profiles.partnerProfile = {
      create: {
        regionId,
        status: PartnerStatus.DRAFT,
        accountType,
        partnerRole: PartnerRole.SPECIALIST,
        partnerType: PartnerType.OTHER,
        fullName: params.name?.trim() || 'Серіктес',
        companyName: params.name?.trim() || 'Серіктес',
        company: params.name?.trim() || 'Серіктес',
        city,
        directions: [],
        balance: 10000,
      },
    };
    if (!profiles.clientProfile) {
      profiles.clientProfile = {
        create: { accountType: AccountType.INDIVIDUAL, city },
      };
    }
  }

  return { ...base, ...profiles };
}

export function validateLoginAsProfile(
  loginAs: OtpLoginAs,
  user: { clientProfile?: unknown | null; partnerProfile?: unknown | null },
) {
  if (loginAs === 'client' && !user.clientProfile) {
    throw new BadRequestException('Клиент профилі жоқ');
  }
  if (loginAs === 'partner' && !user.partnerProfile) {
    throw new BadRequestException('Партнёр профилі жоқ');
  }
}
