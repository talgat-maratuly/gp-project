import { Link } from 'react-router-dom'
import { Plus, QrCode } from 'lucide-react'
import { useAccess } from '../context/AccessContext'
import { qrStats } from '@gp/shared/demo'
import {
  QR_OBJECT_TYPE_LABELS,
  QR_SERVICE_TYPE_LABELS,
  QR_OBJECT_STATUS,
} from '@gp/shared/constants'
import { getQrPublicUrl } from '@gp/shared/utils'

export default function QrDashboardPage() {
  const { scopedStore, scopeList } = useAccess()
  const objects = scopeList(scopedStore.qrCodeObjects || [])
  const orders = scopeList(scopedStore.qrServiceOrders || [])
  const stats = qrStats({ ...scopedStore, qrCodeObjects: objects, qrServiceOrders: orders, qrScanLogs: scopedStore.qrScanLogs || [] })

  const cards = [
    { label: 'QR-объектов', value: stats.objectsTotal },
    { label: 'Активных', value: stats.objectsActive },
    { label: 'Сканов', value: stats.scansTotal },
    { label: 'Заявок', value: stats.ordersTotal },
    { label: 'Новых заявок', value: stats.ordersNew },
    { label: 'Конверсия', value: `${stats.conversionPercent}%` },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <QrCode className="w-7 h-7 text-sky-400" /> QR-сервис
          </h1>
          <p className="text-sm text-slate-400 mt-1">Наклейки на объекты · скан → заявка</p>
        </div>
        <Link to="/qr/create" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white font-semibold text-sm">
          <Plus className="w-4 h-4" /> Создать QR
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className="text-2xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold mb-3">QR-объекты</h2>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/80 text-slate-400">
            <tr>
              <th className="text-left p-3">Код</th>
              <th className="text-left p-3">Название</th>
              <th className="text-left p-3">Тип</th>
              <th className="text-left p-3">Услуга</th>
              <th className="text-left p-3">Статус</th>
              <th className="text-right p-3" />
            </tr>
          </thead>
          <tbody>
            {objects.map((o) => (
              <tr key={o.id} className="border-t border-white/5">
                <td className="p-3 font-mono text-sky-300">{o.qrCode}</td>
                <td className="p-3 font-medium">{o.title}</td>
                <td className="p-3">{QR_OBJECT_TYPE_LABELS[o.type]}</td>
                <td className="p-3">{QR_SERVICE_TYPE_LABELS[o.serviceType]}</td>
                <td className="p-3">{o.status}</td>
                <td className="p-3 text-right">
                  <Link to={`/qr/${o.id}`} className="text-sky-400 hover:underline">Открыть</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!objects.length && <p className="p-4 text-slate-500 text-sm">Нет QR-объектов</p>}
      </div>

      <h2 className="text-lg font-bold mb-3 mt-8">Последние QR-заявки</h2>
      <ul className="space-y-2">
        {orders.slice(0, 15).map((o) => (
          <li key={o.id} className="p-3 rounded-xl border border-white/10 bg-slate-900/40 flex justify-between gap-2">
            <div>
              <p className="font-semibold">{o.clientName} · {o.phone}</p>
              <p className="text-xs text-slate-400">{o.qrCode} · {QR_SERVICE_TYPE_LABELS[o.serviceType]}</p>
            </div>
            <span className="text-xs text-amber-400 shrink-0">{o.status}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-600 mt-4 font-mono break-all">Демо URL: {objects[0] ? getQrPublicUrl(objects[0].qrCode) : '—'}</p>
    </div>
  )
}
