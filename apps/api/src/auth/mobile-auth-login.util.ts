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
    throw new ForbiddenException('Для этого номера не настроен admin-доступ');
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
    throw new ForbiddenException('Для этого номера не настроен admin-доступ');
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
  legalForm?: string;
  companyName?: string;
  bin?: string;
  legalAddress?: string;
  contactPerson?: string;
  legalVerificationStatus?: string;
  egovCheckStatus?: string;
  egovProvider?: string | null;
  egovCheckedAt?: Date | null;
  ecpStatus?: string;
}) {
  const { loginAs, portalRoles, accountType, city, regionId } = params;
  const legacyRole = syncUserRoleFromPortalRoles(portalRoles);

  const base = {
    email: params.email,
    passwordHash: params.passwordHash,
    name: params.name?.trim() || (loginAs === 'partner' ? 'Партнёр' : 'Клиент GP'),
    phone: params.phone,
    role: legacyRole,
    portalRoles,
    regionId: regionId ?? undefined,
  };

  const profiles: Record<string, unknown> = {};

  if (loginAs === 'client' || loginAs === 'admin') {
    profiles.clientProfile = {
      create: {
        accountType,
        city,
        legalForm: accountType === AccountType.LEGAL_ENTITY ? params.legalForm ?? null : null,
        companyName:
          accountType === AccountType.LEGAL_ENTITY ? params.companyName?.trim() || null : null,
        bin: accountType === AccountType.LEGAL_ENTITY ? params.bin?.trim() || null : null,
        legalAddress:
          accountType === AccountType.LEGAL_ENTITY ? params.legalAddress?.trim() || city : null,
        contactPerson:
          accountType === AccountType.LEGAL_ENTITY ? params.contactPerson?.trim() || params.name?.trim() || null : null,
        legalVerificationStatus:
          accountType === AccountType.LEGAL_ENTITY ? params.legalVerificationStatus ?? 'PENDING' : 'VERIFIED',
        egovCheckStatus:
          accountType === AccountType.LEGAL_ENTITY ? params.egovCheckStatus ?? 'PENDING' : 'NOT_REQUIRED',
        egovProvider: accountType === AccountType.LEGAL_ENTITY ? params.egovProvider ?? null : null,
        egovCheckedAt: accountType === AccountType.LEGAL_ENTITY ? params.egovCheckedAt ?? null : null,
        ecpStatus: accountType === AccountType.LEGAL_ENTITY ? params.ecpStatus ?? 'PENDING' : 'NOT_REQUIRED',
      },
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
        fullName: params.name?.trim() || 'Партнёр',
        companyName: params.name?.trim() || 'Партнёр',
        company: params.name?.trim() || 'Партнёр',
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
    throw new BadRequestException('Профиль клиента не найден');
  }
  if (loginAs === 'partner' && !user.partnerProfile) {
    throw new BadRequestException('Профиль партнёра не найден');
  }
}
