import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '@gp/shared/api'
import { PARTNER_TYPES, PARTNER_ROLE_LABELS } from '@gp/shared/constants'
import { partnerStatusLabel } from '@gp/shared/constants/ecosystemStatuses'
import { isDemoMode } from '@gp/shared/demo'
import { useLanguage } from '../i18n/LanguageContext'

const TABS = [
  { id: 'PENDING_REVIEW', label: 'На модерации (pending_moderation)' },
  { id: 'NEEDS_REVISION', label: 'На доработке (needs_revision)' },
  { id: 'APPROVED', label: 'Активные (active)' },
  { id: 'REJECTED', label: 'Отклонённые (rejected)' },
  { id: 'SUSPENDED', label: 'Заблокированные (blocked)' },
]

const typeLabel = (id) => PARTNER_TYPES.find((t) => t.id === id)?.labelKey || id

export default function PartnerModerationPage() {
  const { t } = useLanguage()
  const [tab, setTab] = useState('PENDING_REVIEW')
  const [list, setList] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [revisionComment, setRevisionComment] = useState('')

  const load = useCallback(async () => {
    if (isDemoMode()) {
      setList([])
      setError('Модерация партнёров доступна в API-режиме')
      return
    }
    setLoading(true)
    setError('')
    try {
      const rows = await api.adminModerationPartners(tab)
      setList(rows)
      if (selected) {
        const fresh = rows.find((r) => r.id === selected.id)
        if (fresh) setSelected(fresh)
      }
    } catch (e) {
      setError(e?.message || 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [tab, selected])

  useEffect(() => {
    load()
  }, [load])

  const openDetail = async (id) => {
    try {
      const row = await api.adminModerationPartner(id)
      setSelected(row)
      setRejectReason('')
      setRevisionComment(row.revisionComment || '')
    } catch (e) {
      setError(e?.message || 'Ошибка')
    }
  }

  const act = async (fn) => {
    if (!selected) return
    setLoading(true)
    try {
      const row = await fn(selected.id)
      setSelected(row)
      await load()
    } catch (e) {
      setError(e?.message || 'Ошибка действия')
    } finally {
      setLoading(false)
    }
  }

  const photos = useMemo(() => {
    if (!selected) return []
    const v = Array.isArray(selected.vehiclePhotos) ? selected.vehiclePhotos : []
    const e = Array.isArray(selected.equipmentPhotos) ? selected.equipmentPhotos : []
    return [...v, ...e]
  }, [selected])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Модерация партнёров</h1>
        <p className="text-sm text-slate-400">Септик, покос, магазин, специалисты — единая очередь GP</p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {TABS.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => { setTab(x.id); setSelected(null) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              tab === x.id ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="admin-table-wrap overflow-x-auto max-h-[70vh]">
          <table className="admin-table min-w-full">
            <thead>
              <tr>
                <th>Компания</th>
                <th>Роль</th>
                <th>Тип услуги</th>
                <th>Регион</th>
                <th>Телефон</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && !list.length ? (
                <tr><td colSpan={6} className="text-slate-400">Загрузка…</td></tr>
              ) : list.map((p) => (
                <tr key={p.id} className={selected?.id === p.id ? 'bg-slate-800/60' : ''}>
                  <td className="font-medium">{p.companyName || p.company}</td>
                  <td>{PARTNER_ROLE_LABELS[p.partnerRole] || p.partnerRole || '—'}</td>
                  <td>{typeLabel(p.partnerType)}</td>
                  <td>{p.region?.name || p.city}</td>
                  <td>{p.user?.phone}</td>
                  <td>
                    <button type="button" className="text-sky-400 text-sm" onClick={() => openDetail(p.id)}>
                      Карточка
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && !list.length && (
                <tr><td colSpan={6} className="text-slate-500">Нет заявок</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 space-y-3 max-h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-2">
              <div>
                <h2 className="font-bold text-lg">{selected.companyName || selected.company}</h2>
                <p className="text-sm text-slate-400">
                  {partnerStatusLabel(selected.status)} · {selected.region?.name || selected.city}
                </p>
              </div>
              <span className="text-xs bg-slate-800 px-2 py-1 rounded">
                {PARTNER_ROLE_LABELS[selected.partnerRole] || selected.partnerRole}
                {' · '}
                {typeLabel(selected.partnerType)}
              </span>
            </div>
            <dl className="text-sm grid grid-cols-2 gap-2">
              <dt className="text-slate-500">ФИО</dt><dd>{selected.fullName || selected.user?.name}</dd>
              <dt className="text-slate-500">Email</dt><dd>{selected.user?.email}</dd>
              <dt className="text-slate-500">Телефон</dt><dd>{selected.user?.phone}</dd>
              <dt className="text-slate-500">Адрес</dt><dd>{selected.address || '—'}</dd>
              <dt className="text-slate-500">Регистрация</dt>
              <dd>{new Date(selected.createdAt).toLocaleString('ru-RU')}</dd>
            </dl>
            {selected.description && (
              <p className="text-sm text-slate-300"><span className="text-slate-500">Описание: </span>{selected.description}</p>
            )}
            {selected.rejectionReason && (
              <p className="text-sm text-red-300">Причина отказа: {selected.rejectionReason}</p>
            )}
            {selected.revisionComment && (
              <p className="text-sm text-amber-300">Комментарий: {selected.revisionComment}</p>
            )}
            {photos.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Фото техники / оборудования</p>
                <ul className="text-xs text-slate-300 space-y-1">
                  {photos.map((url, i) => (
                    <li key={i} className="truncate">{url}</li>
                  ))}
                </ul>
              </div>
            )}
            {selected.documents && (
              <pre className="text-xs bg-slate-950 p-2 rounded overflow-auto max-h-24">{JSON.stringify(selected.documents, null, 2)}</pre>
            )}
            {selected.moderationAudit?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Audit log</p>
                <ul className="text-xs space-y-1 text-slate-400">
                  {selected.moderationAudit.map((a) => (
                    <li key={a.id}>
                      {a.action} — {a.admin?.name || 'система'} — {new Date(a.createdAt).toLocaleString('ru-RU')}
                      {a.reason && ` (${a.reason})`}
                      {a.comment && ` (${a.comment})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === 'PENDING_REVIEW' && (
              <div className="space-y-2 pt-2 border-t border-slate-700">
                <button type="button" disabled={loading} onClick={() => act(api.adminApprovePartner)} className="w-full py-2 rounded-lg bg-emerald-600 font-semibold text-sm">
                  Подтвердить
                </button>
                <textarea
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-sm"
                  placeholder="Комментарий для доработки (обязательно)"
                  value={revisionComment}
                  onChange={(e) => setRevisionComment(e.target.value)}
                />
                <button
                  type="button"
                  disabled={loading || revisionComment.trim().length < 3}
                  onClick={() => act((id) => api.adminRevisionPartner(id, revisionComment.trim()))}
                  className="w-full py-2 rounded-lg bg-amber-600 font-semibold text-sm"
                >
                  На доработку
                </button>
                <textarea
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-sm"
                  placeholder="Причина отказа (обязательно)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <button
                  type="button"
                  disabled={loading || rejectReason.trim().length < 3}
                  onClick={() => act((id) => api.adminRejectPartner(id, rejectReason.trim()))}
                  className="w-full py-2 rounded-lg bg-red-600 font-semibold text-sm"
                >
                  Отклонить
                </button>
              </div>
            )}
            {tab === 'APPROVED' && (
              <button type="button" disabled={loading} onClick={() => act(api.adminSuspendPartner)} className="w-full py-2 rounded-lg bg-red-700 font-semibold text-sm mt-2">
                Заблокировать
              </button>
            )}
            {(tab === 'SUSPENDED' || tab === 'REJECTED') && (
              <button type="button" disabled={loading} onClick={() => act(api.adminRestorePartner)} className="w-full py-2 rounded-lg bg-sky-600 font-semibold text-sm mt-2">
                Восстановить
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
