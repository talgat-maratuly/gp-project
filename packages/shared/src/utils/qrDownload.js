import QRCode from 'qrcode'
import { getQrPublicUrl } from './qrUrl.js'

export async function generateQrDataUrl(qrCode, options = {}) {
  const url = getQrPublicUrl(qrCode)
  return QRCode.toDataURL(url, { width: options.width || 512, margin: 2, ...options })
}

export async function downloadQrPng(qrCode, filename) {
  const dataUrl = await generateQrDataUrl(qrCode)
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename || `${qrCode}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** Печать наклейки / «PDF» через диалог печати браузера */
export async function printQrSticker(qrCode, title = 'GP Service') {
  const dataUrl = await generateQrDataUrl(qrCode, { width: 400 })
  const url = getQrPublicUrl(qrCode)
  const w = window.open('', '_blank', 'width=480,height=640')
  if (!w) return
  w.document.write(`<!DOCTYPE html><html><head><title>QR ${qrCode}</title>
<style>body{font-family:system-ui;text-align:center;padding:24px}img{width:280px;height:280px}p{font-size:14px;color:#333}</style></head>
<body><h1>${title}</h1><img src="${dataUrl}" alt="QR"/><p>${qrCode}</p><p style="font-size:11px;word-break:break-all">${url}</p>
<script>window.onload=function(){window.print()}</script></body></html>`)
  w.document.close()
}
