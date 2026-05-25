/** @deprecated import from @gp/shared-core — re-export for compatibility */
export {
  PARTNER_ROLES,
  PARTNER_ROLE_LABELS,
  PARTNER_ROLE_ALIASES,
  SHOP_MAIN_GROUP_IDS,
  normalizePartnerRoleInput,
  resolvePartnerRoleFromGroups,
  resolvePartnerRoleFromType,
  getEffectivePartnerRole,
} from '@gp/shared-core/roles'

export {
  canAccessShopModule,
  canAccessServiceModule,
  getPartnerAccess,
} from '@gp/shared-core/permissions'
