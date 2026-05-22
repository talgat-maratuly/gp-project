import { api } from '@gp/shared/api'
import {
  getQrObjectPublic,
  logQrScan,
  createQrServiceOrder,
  findQrObjectByCode,
} from '@gp/shared/demo'
import { isDemoMode } from '@gp/shared/demo'

export async function fetchQrPublic(qrCode) {
  if (isDemoMode()) {
    logQrScan(qrCode, {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      deviceType: /mobile/i.test(navigator?.userAgent || '') ? 'mobile' : 'desktop',
      action: 'view',
    })
    return getQrObjectPublic(qrCode)
  }
  return api.getQrPublic(qrCode)
}

export async function submitQrOrder(qrCode, payload) {
  if (isDemoMode()) {
    return createQrServiceOrder({ qrCode, ...payload })
  }
  return api.createQrOrder(qrCode, payload)
}

export function qrExists(qrCode) {
  if (isDemoMode()) return !!findQrObjectByCode(qrCode)
  return true
}
