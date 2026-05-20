import { useEffect, useState } from 'react'
import { api } from '@gp/shared/api'
import { getAccountTypeLabel } from '@gp/shared/constants'
import { formatDate } from '@gp/shared/utils'

export default function ClientsPage() {
  const [rows, setRows] = useState([])
  const [err, setErr] = useState('')

  useEffect(() => {
    api
      .adminClients()
      .then(setRows)
      .catch((e) => setErr(e.message || 'Ошибка'))
  }, [])

  if (err) return <p className="text-rose-400">{err}</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Клиенты</h1>
      <div className="admin-card overflow-x-auto p-0">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Тип</th>
              <th>Имя / организация</th>
              <th>Email</th>
              <th>Телефон</th>
              <th>Регистрация</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>{getAccountTypeLabel(u.clientProfile?.accountType)}</td>
                <td className="text-white font-medium">
                  {u.clientProfile?.companyName || u.name}
                </td>
                <td>{u.email}</td>
                <td>{u.phone || '—'}</td>
                <td className="text-slate-500 text-xs">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-slate-500 text-sm">Нет записей</p>}
      </div>
    </div>
  )
}
