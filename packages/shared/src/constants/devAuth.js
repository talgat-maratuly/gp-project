/** Временный dev-вход. Не использовать в production. */
export const DEV_QUICK_LOGIN_PASSWORD = '0000'
export const LEGACY_DEV_QUICK_LOGIN_PASSWORD = '000000'

export function isDevQuickLogin(password) {
  return password === DEV_QUICK_LOGIN_PASSWORD || password === LEGACY_DEV_QUICK_LOGIN_PASSWORD
}
