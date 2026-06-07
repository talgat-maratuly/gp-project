import { SetMetadata } from '@nestjs/common';
import { PortalRole } from '@prisma/client';

export const PORTAL_ROLES_KEY = 'portal_roles';

/** Кез келген бір рөл жеткілікті (OR) */
export const PortalRoles = (...roles: PortalRole[]) => SetMetadata(PORTAL_ROLES_KEY, roles);
