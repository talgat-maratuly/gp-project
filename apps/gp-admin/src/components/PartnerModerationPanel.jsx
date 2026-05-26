import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, getToken } from '@gp/shared/api'
import {
  PARTNER_TYPES,
  PARTNER_ROLE_LABELS,
  getPartnerOfferingStatusLabel,
  getPartnerSubserviceLabel,
} from '@gp/shared/constants'
import { partnerStatusLabel, SERVICE_STATUS_SPEC } from '@gp/shared-core/statuses'
import { isDemoMode } from '@gp/shared/demo'
import { useAccess } from '../context/AccessContext'
import { ACTIONS } from '../lib/permissions'
import { useLanguage } from '../i18n/LanguageContext'

const TAB_IDS = ['PENDING_REVIEW', 'NEEDS_REVISION', 'APPROVED', 'REJECTED', 'SUSPENDED']

const typeLabel = (id) => PARTNER_TYPES.find((t) => t.id === id)?.labelKey || id

/**
 * @param {{ scope?: 'specialist' | 'shop', title: string, subtitle: string }} props
 */
export default function PartnerModerationPanel({ scope, title, subtitle }) {
  const { t } = useLanguage()
  const { can } = useAccess()
  const [tab, setTab] = useState('PENDING_REVIEW')
  const [list, setList] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [revisionComment, setRevisionComment] = useState('')

  const listOpts = useMemo(() => (scope ? { scope } : {}), [scope])

  const selectedId = selected?.id

  const load = useCallback(async () => {
    if (isDemoMode() && !getToken()) {
      setList([])
      setError(t('moderationApiOnly'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const rows = await api.adminModerationPartners(tab, listOpts)
      setList(rows)
      if (selectedId) {
        const fresh = rows.find((r) => r.id === selectedId)
        if (fresh) setSelected(fresh)
      }
    } catch (e) {
      setError(e?.message || t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [tab, listOpts, selectedId, t])

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
      setError(e?.message || t('loadError'))
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
      setError(e?.message || t('actionError'))
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

  const pendingOfferings = useMemo(() => {
    const rows = selected?.serviceOfferings
    if (!Array.isArray(rows)) return []
    return rows.filter((o) => o.status === 'PENDING_MODERATION')
  }, [selected])

  const actOffering = async (offeringId, status, moderationNote) => {
    setLoading(true)
    setError('')
    try {
      await api.adminUpdateOfferingStatus(offeringId, {
        status,
        ...(moderationNote ? { moderationNote } : {}),
      })
      if (selected?.id) await openDetail(selected.id)
      await load()
    } catch (e) {
      setError(e?.message || t('actionError'))
    } finally {
      setLoading(false)
    }
  }

  if (!can(ACTIONS.PARTNER_MODERATE)) {
    return <p className="text-slate-500">{t('noAccess')}</p>
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {TAB_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => { setTab(id); setSelected(null) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              tab === id ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {t(`moderationTab_${id}`)}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="admin-table-wrap overflow-x-auto max-h-[70vh]">
          <table className="admin-table min-w-full">
            <thead>
              <tr>
                <th>{t('company')}</th>
                <th>{t('role')}</th>
                <th>{t('serviceType')}</th>
                <th>{t('region')}</th>
                <th>{t('phone')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && !list.length ? (
                <tr><td colSpan={6} className="text-slate-400">{t('loading')}</td></tr>
              ) : list.map((p) => (
                <tr key={p.id} className={selected?.id === p.id ? 'bg-slate-800/60' : ''}>
                  <td className="font-medium">{p.companyName || p.company}</td>
                  <td>{PARTNER_ROLE_LABELS[p.partnerRole] || p.partnerRole || '—'}</td>
                  <td>{typeLabel(p.partnerType)}</td>
                  <td>{p.region?.name || p.city}</td>
                  <td>{p.user?.phone}</td>
                  <td>
                    <button type="button" className="text-sky-400 text-sm" onClick={() => openDetail(p.id)}>
                      {t('card')}
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && !list.length && (
                <tr><td colSpan={6} className="text-slate-500">{t('noApplications')}</td></tr>
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
              <dt className="text-slate-500">{t('fullName')}</dt><dd>{selected.fullName || selected.user?.name}</dd>
              <dt className="text-slate-500">Email</dt><dd>{selected.user?.email}</dd>
              <dt className="text-slate-500">{t('phone')}</dt><dd>{selected.user?.phone}</dd>
              <dt className="text-slate-500">{t('address')}</dt><dd>{selected.address || '—'}</dd>
              <dt className="text-slate-500">{t('registeredAt')}</dt>
              <dd>{new Date(selected.createdAt).toLocaleString('ru-RU')}</dd>
            </dl>
            {selected.description && (
              <p className="text-sm text-slate-300"><span className="text-slate-500">{t('description')}: </span>{selected.description}</p>
            )}
            {selected.rejectionReason && (
              <p className="text-sm text-red-300">{t('rejectReason')}: {selected.rejectionReason}</p>
            )}
            {selected.revisionComment && (
              <p className="text-sm text-amber-300">{t('revisionComment')}: {selected.revisionComment}</p>
            )}
            {photos.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1">{t('equipmentPhotos')}</p>
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
                <p className="text-xs font-semibold text-slate-500 mb-1">Audit</p>
                <ul className="text-xs space-y-1 text-slate-400">
                  {selected.moderationAudit.map((a) => (
                    <li key={a.id}>
                      {a.action} — {a.admin?.name || '—'} — {new Date(a.createdAt).toLocaleString('ru-RU')}
                      {a.reason && ` (${a.reason})`}
                      {a.comment && ` (${a.comment})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {pendingOfferings.length > 0 && (
              <div className="pt-2 border-t border-amber-500/30 space-y-2">
                <p className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                  {t('specialist_offerings_moderation')} ({pendingOfferings.length})
                </p>
                <p className="text-[11px] text-slate-500">{t('specialist_offerings_moderation_desc')}</p>
                <ul className="space-y-2">
                  {pendingOfferings.map((o) => (
                    <li key={o.id} className="rounded-lg bg-slate-950/80 border border-amber-500/20 p-2 space-y-2">
                      <div>
                        <p className="text-sm font-medium text-white">{getPartnerSubserviceLabel(o.subserviceId)}</p>
                        <p className="text-[10px] text-slate-500">{getPartnerOfferingStatusLabel(o.status)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={loading}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                          onClick={() => actOffering(o.id, SERVICE_STATUS_SPEC.active)}
                        >
                          {t('approve')}
                        </button>
                        <button
                          type="button"
                          disabled={loading}
                          className="flex-1 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold"
                          onClick={() => actOffering(o.id, SERVICE_STATUS_SPEC.rejected, 'Бас тартылды')}
                        >
                          {t('reject')}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === 'PENDING_REVIEW' && (
              <div className="space-y-2 pt-2 border-t border-slate-700">
                <button type="button" disabled={loading} onClick={() => act(api.adminApprovePartner)} className="w-full py-2 rounded-lg bg-emerald-600 font-semibold text-sm">
                  {t('approve')}
                </button>
                <textarea
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-sm"
                  placeholder={t('revisionPlaceholder')}
                  value={revisionComment}
                  onChange={(e) => setRevisionComment(e.target.value)}
                />
                <button
                  type="button"
                  disabled={loading || revisionComment.trim().length < 3}
                  onClick={() => act((id) => api.adminRevisionPartner(id, revisionComment.trim()))}
                  className="w-full py-2 rounded-lg bg-amber-600 font-semibold text-sm"
                >
                  {t('sendForRevision')}
                </button>
                <textarea
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-sm"
                  placeholder={t('rejectPlaceholder')}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <button
                  type="button"
                  disabled={loading || rejectReason.trim().length < 3}
                  onClick={() => act((id) => api.adminRejectPartner(id, rejectReason.trim()))}
                  className="w-full py-2 rounded-lg bg-red-600 font-semibold text-sm"
                >
                  {t('reject')}
                </button>
              </div>
            )}
            {tab === 'APPROVED' && (
              <button type="button" disabled={loading} onClick={() => act(api.adminSuspendPartner)} className="w-full py-2 rounded-lg bg-red-700 font-semibold text-sm mt-2">
                {t('block')}
              </button>
            )}
            {(tab === 'SUSPENDED' || tab === 'REJECTED') && (
              <button type="button" disabled={loading} onClick={() => act(api.adminRestorePartner)} className="w-full py-2 rounded-lg bg-sky-600 font-semibold text-sm mt-2">
                {t('restore')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
