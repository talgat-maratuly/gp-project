/** GPartners — үш тәуелсіз статус жүйесі (Request / Account / Work) */

export const REQUEST_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
}

export const ACCOUNT_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  BANNED: 'BANNED',
}

export const WORK_STATUS = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  /** Кейіні: BUSY */
}

export function canUsePlatform(accountStatus) {
  return accountStatus === ACCOUNT_STATUS.ACTIVE
}

export function canWorkAsSpecialist({ requestStatus, accountStatus, workStatus }) {
  return (
    canUsePlatform(accountStatus) &&
    requestStatus === REQUEST_STATUS.APPROVED &&
    workStatus === WORK_STATUS.ONLINE
  )
}

export function canApplyAsSpecialist({ requestStatus }) {
  return !requestStatus || requestStatus === REQUEST_STATUS.REJECTED
}
