import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Pencil, Plus } from 'lucide-react'
import {
  getPartnerOfferingStatusLabel,
  getPartnerSubserviceLabel,
  PARTNER_REGISTRATION_GROUPS,
  PARTNER_DIRECTIONS,
  FURNITURE_EXECUTOR_GROUP,
  SHOP_MAIN_GROUP_IDS,
  getPartnerAccess,
} from '@gp/shared/constants'
import { PARTNER_STATUS_LABELS } from '@gp/shared/constants'
import { formatPrice } from '@gp/shared/utils'
import { usePartner } from '../context/PartnerContext'

const ALL_GROUPS = [...PARTNER_REGISTRATION_GROUPS, FURNITURE_EXECUTOR_GROUP].filter(
  (g) => !SHOP_MAIN_GROUP_IDS.has(g.id),
)

const emptyCustom = () => ({ id: '', category: 'lawn', name: '', price: '', description: '' })

function offeringLabel(o) {
  if (o.custom && o.name) return o.name
  return getPartnerSubserviceLabel(o.subserviceId)
}

export default function ServicesPage() {
  const { user, loading, addPartnerOfferings, saveCustomOffering } = usePartner()
  const location = useLocation()
  const navigate = useNavigate()
  const [showAdd, setShowAdd] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [customForm, setCustomForm] = useState(emptyCustom())
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

  const openEditCustom = (o) => {
    setCustomForm({
      id: o.id,
      category: o.category || 'lawn',
      name: o.name || '',
      price: String(o.price ?? ''),
      description: o.description || '',
    })
    setShowCustom(true)
  }

  const submitCustom = async () => {
    setMsg('')
    if (!customForm.name.trim() || !customForm.price) {
      setMsg('Заполните название и цену')
      return
    }
    setSaving(true)
    try {
      await saveCustomOffering(customForm)
      setShowCustom(false)
      setCustomForm(emptyCustom())
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
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => { setCustomForm(emptyCustom()); setShowCustom(true) }}
            disabled={loading}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Своя услуга
          </button>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            disabled={loading}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Из каталога
          </button>
        </div>
      </div>

      {user?.partnerStatus && user.partnerStatus !== 'APPROVED' && (
        <Link
          to={user?.partnerRole === 'SHOP' ? '/apply' : '/apply/specialist'}
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
                className="rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface-2)] px-3 py-2.5 flex justify-between gap-2 items-start"
              >
                <div>
                  <span className="text-sm text-[var(--gp-text)] font-semibold">{offeringLabel(o)}</span>
                  {o.custom && o.price != null && (
                    <span className="block text-xs text-[var(--gp-text-muted)] mt-0.5">{formatPrice(o.price)}</span>
                  )}
                  {o.custom && o.description && (
                    <span className="block text-xs text-[var(--gp-text-muted)] mt-1">{o.description}</span>
                  )}
                  <span className={`block text-xs font-medium mt-1 ${
                    o.status === 'ACTIVE' ? 'text-emerald-600' : 'text-[var(--gp-text-muted)]'
                  }`}
                  >
                    {getPartnerOfferingStatusLabel(o.status)}
                  </span>
                </div>
                {o.custom && (
                  <button type="button" onClick={() => openEditCustom(o)} className="text-xs text-emerald-600 font-semibold flex items-center gap-1 shrink-0">
                    <Pencil className="w-3.5 h-3.5" /> Редакт.
                  </button>
                )}
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
              <h2 className="text-lg font-bold text-[var(--gp-text)]">Добавить из каталога</h2>
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
              <button type="button" onClick={() => { setShowAdd(false); navigate('/services', { replace: true }) }} className="flex-1 py-2.5 rounded-xl border border-[var(--gp-border)] text-sm font-semibold">
                Отмена
              </button>
              <button type="button" disabled={saving} onClick={submitAdd} className="flex-1 py-2.5 rounded-xl partner-gradient text-sm font-bold disabled:opacity-50">
                {saving ? '…' : 'Отправить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCustom && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-3" role="dialog">
          <div className="partner-card w-full max-w-md border border-[var(--gp-border)] shadow-2xl p-4 space-y-3">
            <h2 className="text-lg font-bold">{customForm.id ? 'Редактировать услугу' : 'Добавить услугу'}</h2>
            <label className="block text-sm">
              <span className="text-xs font-semibold text-[var(--gp-text-muted)]">Категория</span>
              <select className="w-full mt-1 p-3 rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface)]" value={customForm.category} onChange={(e) => setCustomForm({ ...customForm, category: e.target.value })}>
                {PARTNER_DIRECTIONS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-xs font-semibold text-[var(--gp-text-muted)]">Название</span>
              <input className="w-full mt-1 p-3 rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface)]" value={customForm.name} onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="text-xs font-semibold text-[var(--gp-text-muted)]">Цена, ₸</span>
              <input type="number" className="w-full mt-1 p-3 rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface)]" value={customForm.price} onChange={(e) => setCustomForm({ ...customForm, price: e.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="text-xs font-semibold text-[var(--gp-text-muted)]">Описание</span>
              <textarea rows={3} className="w-full mt-1 p-3 rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface)] resize-none" value={customForm.description} onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })} />
            </label>
            {msg && <p className="text-red-500 text-sm">{msg}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowCustom(false); setMsg('') }} className="flex-1 py-2.5 rounded-xl border border-[var(--gp-border)] text-sm font-semibold">Отмена</button>
              <button type="button" disabled={saving} onClick={submitCustom} className="flex-1 py-2.5 rounded-xl partner-gradient text-sm font-bold disabled:opacity-50">{saving ? '…' : 'Сохранить'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
