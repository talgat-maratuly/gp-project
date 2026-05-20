import { useEffect, useState } from 'react'
import { api } from '@gp/shared/api'
import { formatDate, formatPrice } from '@gp/shared/utils'

export default function OrdersPage() {
  const [rows, setRows] = useState([])
  const [err, setErr] = useState('')

  useEffect(() => {
    api
      .adminOrders()
      .then(setRows)
      .catch((e) => setErr(e.message || 'Ошибка'))
  }, [])

  if (err) return <p className="text-rose-400">{err}</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Заказы</h1>
      <div className="admin-card overflow-x-auto p-0">
        <table className="admin-table text-xs">
          <thead>
            <tr>
              <th>Услуга</th>
              <th>Статус</th>
              <th>Клиент</th>
              <th>Партнёр</th>
              <th>Сумма</th>
              <th>Комиссия GP</th>
              <th>Дата</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td className="text-white max-w-[180px]">{o.serviceName || o.category}</td>
                <td>{o.status}</td>
                <td>{o.client?.user?.name || '—'}</td>
                <td>{o.partner?.user?.name || '—'}</td>
                <td>{formatPrice(Number(o.total))}</td>
                <td className="text-amber-200/90">{o.gpCommission != null ? formatPrice(Number(o.gpCommission)) : '—'}</td>
                <td className="text-slate-500">{formatDate(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-slate-500 text-sm">Нет заказов</p>}
      </div>
    </div>
  )
}
