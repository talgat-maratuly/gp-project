import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Download, Printer } from 'lucide-react'
import { loadGlobalStore } from '@gp/shared/demo'
import { updateQrCodeObject } from '@gp/shared/demo'
import {
  QR_OBJECT_TYPE_LABELS,
  QR_SERVICE_TYPE_LABELS,
  QR_ORDER_STATUS_LABELS,
} from '@gp/shared/constants'
import { getQrPublicUrl, downloadQrPng, printQrSticker, generateQrDataUrl } from '@gp/shared/utils'

export default function QrDetailPage() {
  const { id } = useParams()
  const [obj, setObj] = useState(null)
  const [preview, setPreview] = useState('')

  const reload = () => {
    const store = loadGlobalStore()
    const found = store.qrCodeObjects?.find((o) => o.id === id)
    setObj(found || null)
    const orders = (store.qrServiceOrders || []).filter((o) => o.qrCodeObjectId === id)
    const scans = (store.qrScanLogs || []).filter((s) => s.qrCodeObjectId === id)
    if (found) {
      setObj({ ...found, _orders: orders, _scans: scans })
      generateQrDataUrl(found.qrCode).then(setPreview)
    }
  }

  useEffect(() => {
    reload()
    const iv = setInterval(reload, 3000)
    return () => clearInterval(iv)
  }, [id])

  if (!obj) {
    return <p className="text-slate-400">QR не найден. <Link to="/qr" className="text-sky-400">К списку</Link></p>
  }

  const publicUrl = getQrPublicUrl(obj.qrCode)

  return (
    <div className="max-w-3xl">
      <Link to="/qr" className="text-sm text-sky-400 mb-4 inline-block">← QR-сервис</Link>
      <h1 className="text-2xl font-bold mb-2">{obj.title}</h1>
      <p className="font-mono text-sky-300 mb-6">{obj.qrCode}</p>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="admin-card p-5 text-center">
          {preview && <img src={preview} alt="QR" className="mx-auto w-48 h-48" />}
          <p className="text-xs text-slate-500 mt-3 break-all">{publicUrl}</p>
          <div className="flex gap-2 mt-4 justify-center">
            <button type="button" onClick={() => downloadQrPng(obj.qrCode)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold">
              <Download className="w-4 h-4" /> PNG
            </button>
            <button type="button" onClick={() => printQrSticker(obj.qrCode, obj.title)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white/10 text-sm font-semibold">
              <Printer className="w-4 h-4" /> Печать / PDF
            </button>
          </div>
        </div>
        <div className="admin-card p-5 space-y-2 text-sm">
          <p><span className="text-slate-500">Тип:</span> {QR_OBJECT_TYPE_LABELS[obj.type]}</p>
          <p><span className="text-slate-500">Услуга:</span> {QR_SERVICE_TYPE_LABELS[obj.serviceType]}</p>
          <p><span className="text-slate-500">Адрес:</span> {obj.address}, {obj.city}</p>
          <p><span className="text-slate-500">Последняя:</span> {obj.lastServiceDate || '—'}</p>
          <p><span className="text-slate-500">Следующая:</span> {obj.nextServiceDate || '—'}</p>
          <p><span className="text-slate-500">Статус:</span> {obj.status}</p>
          <select
            className="admin-input mt-2"
            value={obj.status}
            onChange={(e) => {
              updateQrCodeObject(obj.id, { status: e.target.value })
              reload()
            }}
          >
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="archived">archived</option>
          </select>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-3">История сканов ({obj._scans?.length || 0})</h2>
      <ul className="space-y-1 text-xs text-slate-400 mb-8 max-h-40 overflow-y-auto">
        {(obj._scans || []).map((s) => (
          <li key={s.id}>{new Date(s.scannedAt).toLocaleString('ru-RU')} · {s.action} · {s.deviceType}</li>
        ))}
      </ul>

      <h2 className="text-lg font-bold mb-3">Заявки ({obj._orders?.length || 0})</h2>
      <ul className="space-y-2">
        {(obj._orders || []).map((o) => (
          <li key={o.id} className="p-3 rounded-xl border border-white/10">
            <p className="font-semibold">{o.clientName} · {o.phone}</p>
            <p className="text-xs text-slate-400">{QR_ORDER_STATUS_LABELS[o.status] || o.status} · {o.totalPrice} ₸</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
