import { useCallback, useEffect, useState } from 'react'
import { api } from '@gp/shared/api'
import { PARTNER_OFFERING_STATUS_LABELS } from '@gp/shared/constants'
import { SERVICE_STATUS_SPEC, partnerStatusLabel } from '@gp/shared/constants/ecosystemStatuses'
import { isDemoMode } from '@gp/shared/demo'

const TABS = [
  { id: 'PENDING_MODERATION', label: 'На модерации' },
  { id: 'ACTIVE', label: 'Активные' },
  { id: 'REJECTED', label: 'Отклонённые' },
  { id: 'TEMPORARILY_BLOCKED', label: 'Скрытые' },
]

export default function OfferingModerationPage() {
  const [tab, setTab] = useState('PENDING_MODERATION')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (isDemoMode()) {
      setList([])
      setError('Модерация услуг доступна в API-режиме')
      return
    }
    setLoading(true)
    setError('')
    try {
      setList(await api.adminOfferings(tab))
    } catch (e) {
      setError(e?.message || 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    load()
  }, [load])

  const setStatus = async (id, status) => {
    setLoading(true)
    try {
      await api.adminUpdateOfferingStatus(id, { status })
      await load()
    } catch (e) {
      setError(e?.message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Модерация услуг партнёров</h1>
      <p className="text-sm text-slate-400">Подуслуги и направления — статус до появления в GP Service</p>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {TABS.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setTab(x.id)}
            className={`px-3 py-1.5 rounded-lg text-sm ${tab === x.id ? 'bg-sky-600 text-white' : 'bg-white/10'}`}
          >
            {x.label}
          </button>
        ))}
      </div>
      {loading && <p className="text-slate-400 text-sm">Загрузка…</p>}
      <ul className="space-y-2">
        {list.map((o) => (
          <li key={o.id} className="rounded-xl border border-white/10 p-3 flex flex-wrap justify-between gap-2">
            <div>
              <p className="font-semibold">{o.subserviceId}</p>
              <p className="text-xs text-slate-400">
                {o.partner?.user?.name || o.partner?.companyName} ·{' '}
                {PARTNER_OFFERING_STATUS_LABELS[o.status] || o.status}
              </p>
              <p className="text-xs text-slate-500">
                Партнёр: {partnerStatusLabel(o.partner?.status)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {tab === 'PENDING_MODERATION' && (
                <>
                  <button type="button" className="text-xs px-2 py-1 rounded-lg bg-emerald-600 text-white" onClick={() => setStatus(o.id, SERVICE_STATUS_SPEC.active)}>
                    Одобрить
                  </button>
                  <button type="button" className="text-xs px-2 py-1 rounded-lg bg-red-600/80 text-white" onClick={() => setStatus(o.id, SERVICE_STATUS_SPEC.rejected)}>
                    Отклонить
                  </button>
                </>
              )}
              {o.status === 'ACTIVE' && (
                <button type="button" className="text-xs px-2 py-1 rounded-lg bg-slate-600 text-white" onClick={() => setStatus(o.id, SERVICE_STATUS_SPEC.hidden)}>
                  Скрыть
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
