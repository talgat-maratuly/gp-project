import { useEffect, useState } from 'react'
import { api } from '@gp/shared/api'
import { formatDate, formatPrice } from '@gp/shared/utils'

export default function CommissionsPage() {
  const [rows, setRows] = useState([])
  const [err, setErr] = useState('')

  useEffect(() => {
    api
      .adminCommissions()
      .then(setRows)
      .catch((e) => setErr(e.message || 'Ошибка'))
  }, [])

  if (err) return <p className="text-rose-400">{err}</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Комиссии GP</h1>
      <p className="text-xs text-slate-500 mb-6">Списания с баланса партнёров после подтверждения клиентом</p>
      <div className="admin-card overflow-x-auto p-0">
        <table className="admin-table text-xs">
          <thead>
            <tr>
              <th>Сумма</th>
              <th>Заказ</th>
              <th>Примечание</th>
              <th>Дата</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td className="text-amber-200 font-medium">{formatPrice(t.amount)}</td>
                <td className="font-mono">{t.orderId || '—'}</td>
                <td className="max-w-[240px] truncate">{t.note || '—'}</td>
                <td className="text-slate-500">{formatDate(t.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-slate-500 text-sm">Нет операций</p>}
      </div>
    </div>
  )
}
