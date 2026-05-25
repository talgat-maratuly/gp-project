import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LogOut, Package, Plus, Store } from 'lucide-react'
import {
  getAccountTypeLabel,
  getPartnerDirectionLabel,
  getPartnerOfferingStatusLabel,
  getPartnerSubserviceLabel,
  PARTNER_DOCUMENT_KIND_OPTIONS,
  PARTNER_REGISTRATION_GROUPS,
  FURNITURE_EXECUTOR_GROUP,
  SHOP_REGISTRATION_GROUP,
} from '@gp/shared/constants'
import { getPartnerAccess } from '@gp/shared/constants'
import { usePartner } from '../context/PartnerContext'

const ALL_GROUPS = [...PARTNER_REGISTRATION_GROUPS, FURNITURE_EXECUTOR_GROUP, SHOP_REGISTRATION_GROUP]

export default function ProfilePage() {
  const { user, logout, loading, addPartnerOfferings } = usePartner()
  const { shop, service } = getPartnerAccess(user || {})
  const [showAdd, setShowAdd] = useState(false)
  const [picked, setPicked] = useState(() => new Set())
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const offerings = user?.serviceOfferings || []

  const blockedAddIds = useMemo(() => {
    const m = new Set()
    for (const o of offerings) {
      if (o.status === 'PENDING_MODERATION' || o.status === 'ACTIVE' || o.status === 'TEMPORARILY_BLOCKED') {
        m.add(o.subserviceId)
      }
    }
    return m
  }, [offerings])

  useEffect(() => {
    if (!showAdd) setPicked(new Set())
  }, [showAdd])

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
      setMsg('')
    } catch (e) {
      setMsg(e.message || 'Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-1">{user?.company || user?.name}</h1>
      <p className="text-xs font-bold text-emerald-600 mb-1">{getAccountTypeLabel(user?.accountType || 'INDIVIDUAL')}</p>
      {user?.accountType === 'LEGAL_ENTITY' && (
        <div className="text-xs text-[var(--gp-text-muted)] mb-2 space-y-0.5">
          {user.bin && <p>БИН {user.bin}</p>}
          {user.legalAddress && <p>{user.legalAddress}</p>}
        </div>
      )}
      <p className="text-[var(--gp-text-muted)] text-sm mb-4">{user?.email} · {user?.phone}</p>

      {service && (
      <div className="partner-card p-4 mb-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Подуслуги и модерация</p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            disabled={loading}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> Добавить
          </button>
        </div>
        <p className="text-[11px] text-slate-500 mb-3 leading-snug">
          Заказы приходят только по позициям со статусом «Активна». Блокировка действует отдельно по каждой подуслуге, не на весь аккаунт.
        </p>
        {offerings.length ? (
          <ul className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
            {offerings.map((o) => (
              <li
                key={o.id}
                className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-[#0a0f1a]/60 px-3 py-2.5"
              >
                <span className="text-sm text-slate-200">{getPartnerSubserviceLabel(o.subserviceId)}</span>
                <span className="text-[11px] text-slate-500 font-mono">{o.subserviceId}</span>
                <span className={`text-xs font-medium mt-1 ${
                  o.status === 'ACTIVE' ? 'text-emerald-400'
                    : o.status === 'TEMPORARILY_BLOCKED' ? 'text-red-400'
                      : o.status === 'PENDING_MODERATION' ? 'text-amber-400'
                        : 'text-slate-500'
                }`}
                >
                  {getPartnerOfferingStatusLabel(o.status)}
                </span>
                {o.moderationNote && (
                  <span className="text-[11px] text-slate-500 mt-1">Комментарий модератора: {o.moderationNote}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500">Нет зарегистрированных подуслуг</p>
        )}
      </div>
      )}

      {(user?.documents?.length > 0 || user?.bin) && (
        <div className="partner-card p-4 mb-4 text-sm">
          <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Документы</p>
          {user.bin && <p className="text-slate-400 text-xs">БИН: {user.bin}</p>}
          {user.legalAddress && <p className="text-slate-400 text-xs mt-1">{user.legalAddress}</p>}
          <ul className="mt-2 space-y-1">
            {(Array.isArray(user.documents) ? user.documents : []).map((d, i) => (
              <li key={i} className="text-xs text-slate-300">
                {PARTNER_DOCUMENT_KIND_OPTIONS.find((o) => o.id === d.kind)?.label || d.kind}
                {d.number ? `: ${d.number}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="partner-card p-4 mb-4">
        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Направления профиля</p>
        <div className="flex flex-wrap gap-1.5">
          {(user?.directions || []).length ? (
            (user?.directions || []).map((d) => (
              <span
                key={d}
                className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              >
                {getPartnerDirectionLabel(d)}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500">Не указаны</span>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-3" role="dialog">
          <div className="partner-card w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col border border-white/10 shadow-2xl">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">Добавить подуслуги</h2>
              <p className="text-xs text-slate-500 mt-1">Новые позиции уходят на модерацию.</p>
            </div>
            <div className="p-3 overflow-y-auto flex-1 space-y-3">
              {ALL_GROUPS.map((g) => (
                <div key={g.id} className="rounded-xl border border-white/5 bg-[#0a0f1a]/50 p-3">
                  <p className="text-xs font-semibold text-emerald-400/90 mb-2">{g.title}</p>
                  <div className="space-y-1.5">
                    {g.subs.map((s) => {
                      const blocked = blockedAddIds.has(s.id)
                      const checked = picked.has(s.id)
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center gap-2 py-2 px-2 rounded-lg text-sm ${
                            blocked ? 'opacity-40 cursor-not-allowed text-slate-500'
                              : checked ? 'bg-emerald-500/10 text-slate-100 cursor-pointer'
                                : 'text-slate-300 cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={blocked}
                            onChange={() => togglePick(s.id)}
                            className="accent-emerald-500 w-3.5 h-3.5 shrink-0"
                          />
                          <span>{s.label}{blocked ? ' · уже в профиле' : ''}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            {msg && <p className="text-red-400 text-sm px-4">{msg}</p>}
            <div className="p-3 flex gap-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => { setShowAdd(false); setMsg('') }}
                className="flex-1 py-2.5 rounded-xl border border-white/15 text-slate-300 text-sm font-semibold"
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

      {shop && (
        <ul className="space-y-2 mb-6">
          <li>
            <Link to="/shop" className="partner-card p-4 flex items-center gap-3">
              <Store className="w-5 h-5 text-emerald-400" />
              Мой магазин
            </Link>
          </li>
          <li>
            <Link to="/catalog/add" className="partner-card p-4 flex items-center gap-3">
              <Package className="w-5 h-5 text-emerald-400" />
              Добавить товар
            </Link>
          </li>
        </ul>
      )}
      {service && !shop && (
        <ul className="space-y-2 mb-6">
          <li>
            <Link to="/services" className="partner-card p-4 flex items-center gap-3">
              <Package className="w-5 h-5 text-emerald-400" />
              Мои услуги
            </Link>
          </li>
        </ul>
      )}
      <button
        type="button"
        onClick={logout}
        className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" /> Выйти
      </button>
    </div>
  )
}
