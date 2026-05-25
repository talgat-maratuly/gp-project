/** Re-export from @gp/shared-core/statuses */
export {
  PARTNER_STATUS_SPEC,
  PARTNER_STATUS_FROM_PRISMA,
  PARTNER_STATUS_LABELS_RU,
  SERVICE_STATUS_SPEC,
  SERVICE_STATUS_FROM_PRISMA,
  PRODUCT_STATUS_SPEC,
  ORDER_STATUS_SPEC,
  ORDER_STATUS_FROM_PRISMA,
  ADMIN_ORDER_UI_TO_PRISMA,
  partnerStatusToSpec,
  partnerStatusLabel,
  isPartnerActiveForOrders,
  orderHasAssignedPartner,
  mapAdminOrderStatusToPrisma,
} from '@gp/shared-core/statuses'
