/** Временный dev-вход. Не использовать в production. */
export const DEV_QUICK_LOGIN_PASSWORD = '000000'

export function isDevQuickLogin(password) {
  return password === DEV_QUICK_LOGIN_PASSWORD
}
