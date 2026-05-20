import { useEffect, useState } from 'react'
import { api } from '@gp/shared/api'
import { formatPrice } from '@gp/shared/utils'

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    api
      .adminDashboard()
      .then(setData)
      .catch((e) => setErr(e.message || 'Ошибка'))
  }, [])

  if (err) {
    return <p className="text-rose-400">{err}</p>
  }
  if (!data) {
    return <p className="text-slate-500">Загрузка…</p>
  }

  const tiles = [
    { label: 'Клиенты', value: String(data.clients) },
    { label: 'Партнёры', value: String(data.partners) },
    { label: 'Заказы', value: String(data.orders) },
    { label: 'Комиссия GP (по заказам)', value: formatPrice(data.totalCommission || 0) },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Обзор</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="admin-card">
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">{t.label}</p>
            <p className="text-2xl font-bold text-white">{t.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
