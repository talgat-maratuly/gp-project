/** Specialist request moderation — mobile/admin UI */

export const SPECIALIST_REQUEST_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
}

export const SPECIALIST_REQUEST_UI = {
  PENDING: 'Your application is under moderation.\nPlease wait for review results.',
  REJECTED_TITLE: 'Application Status: Rejected',
  EDIT_BUTTON: 'Edit Application',
}

export function canViewSpecialistOrders(requestStatus) {
  return requestStatus === SPECIALIST_REQUEST_STATUS.APPROVED
}

export function canResubmitRequest(requestStatus) {
  return requestStatus === SPECIALIST_REQUEST_STATUS.REJECTED
}
