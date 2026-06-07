import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { partnerStatusLabel } from '@gp/shared-core/statuses'
import { LogOut, Package, Plus, Store } from 'lucide-react'
import {
  PARTNER_DOCUMENT_KIND_OPTIONS,
  PARTNER_REGISTRATION_GROUPS,
  FURNITURE_EXECUTOR_GROUP,
  SHOP_REGISTRATION_GROUP,
} from '@gp/shared/constants'
import { getPartnerAccess } from '@gp/shared/constants'
import { useLanguage } from '@gp/shared/i18n'
import { usePartner } from '../context/PartnerContext'

const ALL_GROUPS = [...PARTNER_REGISTRATION_GROUPS, FURNITURE_EXECUTOR_GROUP, SHOP_REGISTRATION_GROUP]

export default function ProfilePage() {
  const location = useLocation()
  const { t } = useLanguage()
  const { user, logout, loading, addPartnerOfferings } = usePartner()
  const { shop, shopProducts, service } = getPartnerAccess(user || {}, {
    storeUiState: user?.storeUiState,
  })
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
      setMsg(t('partner_profile_select_service_error'))
      return
    }
    setSaving(true)
    try {
      await addPartnerOfferings(subserviceIds)
      setShowAdd(false)
      setMsg('')
    } catch (e) {
      setMsg(e.message || t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  const status = user?.partnerStatus || 'DRAFT'

  return (
    <div>
      {location.state?.noAccess && (
        <div className="mb-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          {t('partner_profile_no_access')}
        </div>
      )}
      <div className="mb-4 rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface-2)] px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--gp-text-muted)]">{t('partner_profile_status')}</p>
        <p className="text-lg font-extrabold text-[var(--gp-text)] mt-1">{t(`partnerStatus_${status}`) !== `partnerStatus_${status}` ? t(`partnerStatus_${status}`) : partnerStatusLabel(status)}</p>
        <p className="text-xs text-[var(--gp-text-muted)] mt-1">{t(`partner_profile_status_hint_${status}`)}</p>
        {(status === 'DRAFT' || status === 'NEEDS_REVISION') && (
          <Link
            to={
              user?.partnerType === 'NURSERY'
                ? '/apply/nursery'
                : user?.partnerType === 'DELIVERY'
                  ? '/apply/delivery'
                  : user?.partnerRole === 'SHOP'
                    ? '/apply'
                    : '/apply/specialist'
            }
            className="inline-block mt-3 text-sm font-bold text-emerald-600 underline"
          >
            {status === 'NEEDS_REVISION' ? t('partner_profile_fix_application') : t('partner_profile_fill_application')}
          </Link>
        )}
      </div>
      <h1 className="text-xl font-bold text-[var(--gp-text)] mb-1">{user?.company || user?.name}</h1>
      <p className="text-xs font-bold text-emerald-600 mb-1">{t(`accountType_${user?.accountType || 'INDIVIDUAL'}`)}</p>
      {user?.accountType === 'LEGAL_ENTITY' && (
        <div className="text-xs text-[var(--gp-text-muted)] mb-2 space-y-0.5">
          {user.bin && <p>{t('bin')}: {user.bin}</p>}
          {user.legalAddress && <p>{user.legalAddress}</p>}
        </div>
      )}
      <p className="text-[var(--gp-text-muted)] text-sm mb-4">{user?.email} · {user?.phone}</p>

      {service && (
      <div className="partner-card p-4 mb-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-xs text-[var(--gp-text-muted)] uppercase tracking-wide">{t('partner_profile_subservices_moderation')}</p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            disabled={loading}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> {t('partner_profile_add_service')}
          </button>
        </div>
        <p className="text-[11px] text-[var(--gp-text-muted)] mb-3 leading-snug">
          {t('partner_profile_add_service_hint')}
        </p>
        {offerings.length ? (
          <ul className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
            {offerings.map((o) => (
              <li
                key={o.id}
                className="flex flex-col gap-0.5 rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface-2)] px-3 py-2.5"
              >
                <span className="text-sm text-[var(--gp-text)]">
                  {o.custom && o.name ? o.name : t(`partner_subservice_${o.subserviceId}`) !== `partner_subservice_${o.subserviceId}` ? t(`partner_subservice_${o.subserviceId}`) : o.subserviceId}
                </span>
                {o.custom && o.price != null && (
                  <span className="text-[11px] text-[var(--gp-text-muted)]">{Number(o.price).toLocaleString('ru-RU')} ₸</span>
                )}
                <span className="text-[11px] text-[var(--gp-text-muted)] font-mono">{o.subserviceId}</span>
                <span className={`text-xs font-medium mt-1 ${
                  o.status === 'ACTIVE' ? 'text-emerald-600'
                    : o.status === 'TEMPORARILY_BLOCKED' ? 'text-red-500'
                      : o.status === 'PENDING_MODERATION' ? 'text-amber-500'
                        : 'text-[var(--gp-text-muted)]'
                }`}
                >
                  {t(`partnerOfferingStatus_${o.status}`)}
                </span>
                {o.moderationNote && (
                  <span className="text-[11px] text-[var(--gp-text-muted)] mt-1">{t('moderatorComment')}: {o.moderationNote}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-[var(--gp-text-muted)]">{t('partner_profile_no_subservices')}</p>
        )}
        <Link to="/services" className="inline-block mt-3 text-xs font-bold text-emerald-600">
          {t('partner_profile_manage_services')} →
        </Link>
      </div>
      )}

      {(user?.documents?.length > 0 || user?.bin) && (
        <div className="partner-card p-4 mb-4 text-sm">
          <p className="text-xs text-[var(--gp-text-muted)] mb-2 uppercase tracking-wide">{t('documents')}</p>
          {user.bin && <p className="text-[var(--gp-text-muted)] text-xs">{t('bin')}: {user.bin}</p>}
          {user.legalAddress && <p className="text-[var(--gp-text-muted)] text-xs mt-1">{user.legalAddress}</p>}
          <ul className="mt-2 space-y-1">
            {(Array.isArray(user.documents) ? user.documents : []).map((d, i) => (
              <li key={i} className="text-xs text-[var(--gp-text)]">
                {t(`partnerDocument_${d.kind}`) !== `partnerDocument_${d.kind}` ? t(`partnerDocument_${d.kind}`) : PARTNER_DOCUMENT_KIND_OPTIONS.find((o) => o.id === d.kind)?.label || d.kind}
                {d.number ? `: ${d.number}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="partner-card p-4 mb-4">
        <p className="text-xs text-[var(--gp-text-muted)] mb-2 uppercase tracking-wide">{t('partner_profile_directions')}</p>
        <div className="flex flex-wrap gap-1.5">
          {(user?.directions || []).length ? (
            (user?.directions || []).map((d) => (
              <span
                key={d}
                className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
              >
                {t(`partnerDirection_${d}`) !== `partnerDirection_${d}` ? t(`partnerDirection_${d}`) : d}
              </span>
            ))
          ) : (
            <span className="text-xs text-[var(--gp-text-muted)]">{t('notSpecified')}</span>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-3" role="dialog">
          <div className="partner-card w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col border border-[var(--gp-border)] shadow-2xl">
            <div className="p-4 border-b border-[var(--gp-border)]">
              <h2 className="text-lg font-bold text-[var(--gp-text)]">{t('partner_profile_add_subservices')}</h2>
              <p className="text-xs text-[var(--gp-text-muted)] mt-1">{t('partner_profile_new_items_moderation')}</p>
            </div>
            <div className="p-3 overflow-y-auto flex-1 space-y-3">
              {ALL_GROUPS.map((g) => (
                <div key={g.id} className="rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface-2)] p-3">
                  <p className="text-xs font-semibold text-emerald-600 mb-2">{t(`partnerGroup_${g.id}`)}</p>
                  <div className="space-y-1.5">
                    {(g.subs || []).map((s) => {
                      const blocked = blockedAddIds.has(s.id)
                      const checked = picked.has(s.id)
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center gap-2 py-2 px-2 rounded-lg text-sm ${
                            blocked ? 'opacity-40 cursor-not-allowed text-[var(--gp-text-muted)]'
                              : checked ? 'bg-emerald-500/10 text-[var(--gp-text)] cursor-pointer'
                                : 'text-[var(--gp-text)] cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={blocked}
                            onChange={() => togglePick(s.id)}
                            className="accent-emerald-500 w-3.5 h-3.5 shrink-0"
                          />
                          <span>{t(`partner_subservice_${s.id}`) !== `partner_subservice_${s.id}` ? t(`partner_subservice_${s.id}`) : s.id}{blocked ? ` · ${t('partner_profile_already_in_profile')}` : ''}</span>
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
                onClick={() => { setShowAdd(false); setMsg('') }}
                className="flex-1 py-2.5 rounded-xl border border-[var(--gp-border)] text-[var(--gp-text)] text-sm font-semibold"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={submitAdd}
                className="flex-1 py-2.5 rounded-xl partner-gradient text-white text-sm font-bold disabled:opacity-50"
              >
                {saving ? '…' : t('send')}
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
              {t('market_my_shop')}
            </Link>
          </li>
          {shopProducts ? (
            <li>
              <Link to="/catalog/add" className="partner-card p-4 flex items-center gap-3">
                <Package className="w-5 h-5 text-emerald-400" />
                {t('nav_add_product')}
              </Link>
            </li>
          ) : (
            <li className="partner-card p-4 text-sm partner-muted">
              {user?.storeUiState === 'UNDER_REVIEW'
                ? t('partner_profile_shop_under_review')
                : user?.storeUiState === 'REJECTED'
                  ? t('partner_profile_shop_rejected')
                  : t('partner_profile_shop_register_hint')}
            </li>
          )}
        </ul>
      )}
      {service && !shop && (
        <ul className="space-y-2 mb-6">
          <li>
            <Link to="/services" className="partner-card p-4 flex items-center gap-3">
              <Package className="w-5 h-5 text-emerald-400" />
              {t('partner_profile_my_services')}
            </Link>
          </li>
        </ul>
      )}
      <button
        type="button"
        onClick={logout}
        className="w-full py-3 rounded-xl border border-red-500/30 text-red-500 flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" /> {t('logout')}
      </button>
    </div>
  )
}
