/** Публичный URL страницы QR (сканируется с наклейки) */
export function getQrPublicBaseUrl() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GP_PUBLIC_URL) {
    return String(import.meta.env.VITE_GP_PUBLIC_URL).replace(/\/$/, '')
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '')
  }
  return 'http://localhost:5173'
}

export function getQrPublicUrl(qrCode) {
  return `${getQrPublicBaseUrl()}/qr/${encodeURIComponent(qrCode)}`
}
