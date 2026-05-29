export const ACCOUNT_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  BANNED: 'BANNED',
}

export const ACCOUNT_STATUS_CHANGE_TYPE = {
  AUTO: 'AUTO',
  OPERATOR: 'OPERATOR',
  SYSTEM: 'SYSTEM',
}

export const ACCOUNT_STATUS_UI = {
  SUSPENDED:
    'Your account has been temporarily suspended.\nPlease contact support for more information.',
  BANNED: 'Your account has been banned.',
}

export function canLogin(accountStatus) {
  return accountStatus !== ACCOUNT_STATUS.BANNED
}

export function canPerformCoreActions(accountStatus) {
  return accountStatus === ACCOUNT_STATUS.ACTIVE
}
