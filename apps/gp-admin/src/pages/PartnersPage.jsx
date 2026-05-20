import { useCallback, useEffect, useState } from 'react'
import { api } from '@gp/shared/api'
import {
  getAccountTypeLabel,
  getPartnerOfferingStatusLabel,
  getPartnerSubserviceLabel,
} from '@gp/shared/constants'

const STATUSES = ['PENDING_MODERATION', 'ACTIVE', 'TEMPORARILY_BLOCKED', 'REJECTED']

export default function PartnersPage() {
  const [rows, setRows] = useState([])
  const [err, setErr] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(() => {
    return api
      .adminPartners()
      .then(setRows)
      .catch((e) => setErr(e.message || 'Ошибка'))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const patchOffering = async (offeringId, status) => {
    setBusyId(offeringId)
    setErr('')
    try {
      await api.adminUpdateOfferingStatus(offeringId, { status })
      await load()
    } catch (e) {
      setErr(e.message || 'Не удалось обновить')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Партнёры</h1>
      <p className="text-xs text-slate-500 mb-6">
        Модерация по подуслугам: статус не блокирует весь аккаунт.
      </p>
      {err && <p className="text-rose-400 text-sm mb-4">{err}</p>}
      <div className="space-y-6">
        {rows.map((p) => (
          <div key={p.id} className="admin-card">
            <div className="flex flex-wrap justify-between gap-2 mb-3">
              <div>
                <p className="font-semibold text-white">{p.company || p.user?.name}</p>
                <p className="text-xs text-sky-400/80">{getAccountTypeLabel(p.accountType)}</p>
                <p className="text-xs text-slate-500">
                  {p.user?.email} · {p.user?.phone || '—'}
                  {p.bin ? ` · БИН ${p.bin}` : ''}
                </p>
              </div>
            </div>
            {(p.serviceOfferings || []).length === 0 ? (
              <p className="text-xs text-slate-500">Нет подуслуг в профиле</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="admin-table text-xs">
                  <thead>
                    <tr>
                      <th>Подуслуга</th>
                      <th>ID</th>
                      <th>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.serviceOfferings.map((o) => (
                      <tr key={o.id}>
                        <td>{getPartnerSubserviceLabel(o.subserviceId)}</td>
                        <td className="font-mono text-slate-500">{o.subserviceId}</td>
                        <td>
                          <select
                            className="admin-input py-1 text-xs max-w-[200px]"
                            value={o.status}
                            disabled={busyId === o.id}
                            onChange={(e) => patchOffering(o.id, e.target.value)}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {getPartnerOfferingStatusLabel(s)}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
        {!rows.length && !err && <p className="text-slate-500 text-sm">Нет записей</p>}
      </div>
    </div>
  )
}
