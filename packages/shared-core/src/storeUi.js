/** UI states for partner store registration (not Prisma enums). */
export const STORE_UI_STATE = {
  NOT_REGISTERED: 'NOT_REGISTERED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
}

const UNDER_REVIEW = new Set([
  'DRAFT',
  'PENDING_REVIEW',
  'NEEDS_REVISION',
  'INACTIVE',
])

const APPROVED = new Set(['APPROVED', 'ACTIVE'])

const REJECTED = new Set(['REJECTED', 'SUSPENDED', 'BLOCKED'])

/**
 * @param {Array<{ status?: string, rejectionReason?: string }> | { status?: string } | null | undefined} input
 */
export function getStoreUiState(input) {
  const store = Array.isArray(input) ? input[0] : input
  if (!store?.status) return { state: STORE_UI_STATE.NOT_REGISTERED, store: null }
  const status = String(store.status).toUpperCase()
  if (APPROVED.has(status)) {
    return { state: STORE_UI_STATE.APPROVED, store }
  }
  if (REJECTED.has(status)) {
    return {
      state: STORE_UI_STATE.REJECTED,
      store,
      rejectionReason: store.rejectionReason || store.rejectReason || '',
    }
  }
  if (UNDER_REVIEW.has(status)) {
    return { state: STORE_UI_STATE.UNDER_REVIEW, store }
  }
  return { state: STORE_UI_STATE.UNDER_REVIEW, store }
}

export function canManageShopProducts(storeUiState) {
  return storeUiState === STORE_UI_STATE.APPROVED
}

export function canShowShopNav(partnerAccess, storeUiState) {
  if (!partnerAccess?.shop) return false
  return true
}
