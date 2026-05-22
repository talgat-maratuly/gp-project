import {
  getQrObjectPublic,
  logQrScan,
  createQrServiceOrder,
  findQrObjectByCode,
} from '@gp/shared/demo'
import { isDemoMode } from '@gp/shared/demo'

const API = import.meta.env.VITE_API_URL || ''

export async function fetchQrPublic(qrCode) {
  if (isDemoMode()) {
    logQrScan(qrCode, {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      deviceType: /mobile/i.test(navigator?.userAgent || '') ? 'mobile' : 'desktop',
      action: 'view',
    })
    return getQrObjectPublic(qrCode)
  }
  const res = await fetch(`${API}/qr/public/${encodeURIComponent(qrCode)}`)
  if (!res.ok) throw new Error('QR не найден')
  return res.json()
}

export async function submitQrOrder(qrCode, payload) {
  if (isDemoMode()) {
    return createQrServiceOrder({ qrCode, ...payload })
  }
  const res = await fetch(`${API}/qr/public/${encodeURIComponent(qrCode)}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Ошибка создания заявки')
  }
  return res.json()
}

export function qrExists(qrCode) {
  if (isDemoMode()) return !!findQrObjectByCode(qrCode)
  return true
}
