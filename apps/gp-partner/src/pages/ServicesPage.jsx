import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import {
  getPartnerOfferingStatusLabel,
  getPartnerSubserviceLabel,
  PARTNER_REGISTRATION_GROUPS,
  FURNITURE_EXECUTOR_GROUP,
  SHOP_MAIN_GROUP_IDS,
  getPartnerAccess,
} from '@gp/shared/constants'
import { PARTNER_STATUS_LABELS } from '@gp/shared/constants'
import { usePartner } from '../context/PartnerContext'

const ALL_GROUPS = [...PARTNER_REGISTRATION_GROUPS, FURNITURE_EXECUTOR_GROUP].filter(
  (g) => !SHOP_MAIN_GROUP_IDS.has(g.id),
)

export default function ServicesPage() {
  const { user, loading, addPartnerOfferings } = usePartner()
  const location = useLocation()
  const navigate = useNavigate()
  const [showAdd, setShowAdd] = useState(false)
  const [picked, setPicked] = useState(() => new Set())
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const access = getPartnerAccess(user || {})
  const offerings = user?.serviceOfferings || []

  useEffect(() => {
    if (location.pathname.endsWith('/add')) setShowAdd(true)
  }, [location.pathname])

  const blockedAddIds = useMemo(() => {
    const m = new Set()
    for (const o of offerings) {
      if (o.status === 'PENDING_MODERATION' || o.status === 'ACTIVE' || o.status === 'TEMPORARILY_BLOCKED') {
        m.add(o.subserviceId)
      }
    }
    return m
  }, [offerings])

  const togglePick = (id) => {
    if (blockedAddIds.has(id)) return
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const submitAdd = async () => {
    setMsg('')
    const subserviceIds = [...picked]
    if (!subserviceIds.length) {
      setMsg('Выберите хотя бы одну подуслугу')
      return
    }
    setSaving(true)
    try {
      await addPartnerOfferings(subserviceIds)
      setShowAdd(false)
      navigate('/services', { replace: true })
    } catch (e) {
      setMsg(e.message || 'Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  if (!access.service) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-[var(--gp-text-muted)]">Услуги недоступны для вашего типа партнёра.</p>
        <Link to="/profile" className="text-emerald-600 font-semibold text-sm mt-3 inline-block">Профиль</Link>
      </div>
    )
  }

  return (
    <div className="gp-animate-in space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--gp-text)]">Мои услуги</h1>
          <p className="text-xs text-[var(--gp-text-muted)] mt-1">
            Статус: {PARTNER_STATUS_LABELS[user?.partnerStatus] || user?.partnerStatus || '—'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          disabled={loading}
          className="flex items-center gap-1 text-xs font-semibold text-emerald-600 disabled:opacity-50 shrink-0"
        >
          <Plus className="w-4 h-4" /> Добавить услугу
        </button>
      </div>

      {user?.partnerStatus && user.partnerStatus !== 'APPROVED' && (
        <Link
          to="/apply"
          className="block rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
        >
          Статус модерации: {PARTNER_STATUS_LABELS[user.partnerStatus]}
        </Link>
      )}

      <div className="partner-card p-4">
        {offerings.length ? (
          <ul className="space-y-2">
            {offerings.map((o) => (
              <li
                key={o.id}
                className="rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface-2)] px-3 py-2.5"
              >
                <span className="text-sm text-[var(--gp-text)]">{getPartnerSubserviceLabel(o.subserviceId)}</span>
                <span className={`block text-xs font-medium mt-1 ${
                  o.status === 'ACTIVE' ? 'text-emerald-600' : 'text-[var(--gp-text-muted)]'
                }`}
                >
                  {getPartnerOfferingStatusLabel(o.status)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--gp-text-muted)]">Нет зарегистрированных услуг</p>
        )}
      </div>

      <Link to="/schedule" className="partner-card p-4 block text-sm font-semibold text-[var(--gp-text)]">
        Задачи и график →
      </Link>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-3" role="dialog">
          <div className="partner-card w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col border border-[var(--gp-border)] shadow-2xl">
            <div className="p-4 border-b border-[var(--gp-border)]">
              <h2 className="text-lg font-bold text-[var(--gp-text)]">Добавить услугу</h2>
            </div>
            <div className="p-3 overflow-y-auto flex-1 space-y-3">
              {ALL_GROUPS.map((g) => (
                <div key={g.id} className="rounded-xl border border-[var(--gp-border)] p-3">
                  <p className="text-xs font-semibold text-emerald-600 mb-2">{g.title}</p>
                  <div className="space-y-1.5">
                    {(g.subs || []).map((s) => {
                      const blocked = blockedAddIds.has(s.id)
                      const checked = picked.has(s.id)
                      return (
                        <label key={s.id} className={`flex items-center gap-2 text-sm ${blocked ? 'opacity-40' : ''}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={blocked}
                            onChange={() => togglePick(s.id)}
                            className="accent-emerald-500"
                          />
                          <span>{s.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            {msg && <p className="text-red-500 text-sm px-4">{msg}</p>}
            <div className="p-3 flex gap-2 border-t border-[var(--gp-border)]">
              <button
                type="button"
                onClick={() => { setShowAdd(false); navigate('/services', { replace: true }) }}
                className="flex-1 py-2.5 rounded-xl border border-[var(--gp-border)] text-sm font-semibold"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={submitAdd}
                className="flex-1 py-2.5 rounded-xl partner-gradient text-sm font-bold disabled:opacity-50"
              >
                {saving ? '…' : 'Отправить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
