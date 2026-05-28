import { useMemo, useRef, useState } from 'react'
import { api } from '@gp/shared/api'
import {
  PARTNER_TYPES,
  PARTNER_ROLE_LABELS,
  getPartnerOfferingStatusLabel,
  getPartnerSubserviceLabel,
} from '@gp/shared/constants'
import { partnerStatusLabel, SERVICE_STATUS_SPEC } from '@gp/shared-core/statuses'
import { useAccess } from '../context/AccessContext'
import { ACTIONS } from '../lib/permissions'
import { useLanguage } from '../i18n/LanguageContext'
import { useAdminModerationLoad } from '../hooks/useAdminModerationLoad'
import AdminListFilters from './AdminListFilters'

const TAB_IDS = ['PENDING_REVIEW', 'NEEDS_REVISION', 'APPROVED', 'REJECTED', 'SUSPENDED']

function resolveTypeLabel(id, t) {
  const key = PARTNER_TYPES.find((x) => x.id === id)?.labelKey
  return key ? t(key) : id || '—'
}

/**
 * @param {{ scope?: 'specialist' | 'shop', title: string, subtitle: string }} props
 */
export default function PartnerModerationPanel({ scope, title, subtitle }) {
  const { t } = useLanguage()
  const { can } = useAccess()
  const [tab, setTab] = useState('PENDING_REVIEW')
  const [selected, setSelected] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [revisionComment, setRevisionComment] = useState('')
  const [filters, setFilters] = useState({})
  const [acting, setActing] = useState(false)

  const selectedIdRef = useRef(null)
  selectedIdRef.current = selected?.id

  const listOpts = useMemo(() => ({ ...(scope ? { scope } : {}), ...filters }), [scope, filters])

  const { list, loading, error, setError, load } = useAdminModerationLoad({
    tab,
    scope,
    listOpts,
    fetchList: api.adminModerationPartners,
    demoBlockedMessage: t('moderationApiOnly'),
    onLoaded: (rows) => {
      const id = selectedIdRef.current
      if (!id) return
      const fresh = rows.find((r) => r.id === id)
      if (!fresh) return
      setSelected((prev) => (
        prev?.id === fresh.id && prev?.updatedAt === fresh.updatedAt ? prev : fresh
      ))
    },
  })

  const openDetail = async (id) => {
    try {
      const row = await api.adminModerationPartner(id)
      setSelected(row)
      setIsDetailOpen(true)
      setRejectReason('')
      setRevisionComment(row.revisionComment || '')
    } catch (e) {
      setError(e?.message || t('loadError'))
    }
  }

  const act = async (fn) => {
    if (!selected) return
    setActing(true)
    try {
      const row = await fn(selected.id)
      setSelected(row)
      await load()
    } catch (e) {
      setError(e?.message || t('actionError'))
    } finally {
      setActing(false)
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
    setActing(true)
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
      setActing(false)
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

      <AdminListFilters value={filters} onChange={setFilters} />

      {error && <p className="text-sm text-red-400">{error}</p>}
      {(loading || acting) && <p className="text-sm text-slate-500">{t('loading')}</p>}

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
                  <td>{resolveTypeLabel(p.partnerType, t)}</td>
                  <td>{p.region?.name || p.city}</td>
                  <td>{p.user?.phone}</td>
                  <td>
                    <div className="flex flex-wrap justify-end gap-2">
                      <button type="button" className="text-sky-400 text-sm" onClick={() => openDetail(p.id)}>
                        {t('card')}
                      </button>
                      {tab === 'PENDING_REVIEW' && (
                        <>
                          <button
                            type="button"
                            disabled={loading || acting}
                            className="text-emerald-400 text-sm disabled:opacity-50"
                            onClick={async () => {
                              await openDetail(p.id)
                              await act(api.adminApprovePartner)
                            }}
                          >
                            {t('approve')}
                          </button>
                          <button
                            type="button"
                            disabled={loading || acting}
                            className="text-red-400 text-sm disabled:opacity-50"
                            onClick={async () => {
                              await openDetail(p.id)
                              setRejectModalOpen(true)
                            }}
                          >
                            {t('reject')}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !list.length && (
                <tr><td colSpan={6} className="text-slate-500">{t('noApplications')}</td></tr>
              )}
            </tbody>
          </table>
      </div>

      {selected && isDetailOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-2">
              <div>
                <h2 className="font-bold text-lg">{selected.companyName || selected.company}</h2>
                <p className="text-sm text-slate-400">
                  {partnerStatusLabel(selected.status)} · {selected.region?.name || selected.city}
                </p>
              </div>
              <button type="button" onClick={() => setIsDetailOpen(false)} className="text-slate-300">✕</button>
            </div>
            <span className="text-xs bg-slate-800 px-2 py-1 rounded inline-block">
              {PARTNER_ROLE_LABELS[selected.partnerRole] || selected.partnerRole}
              {' · '}
              {resolveTypeLabel(selected.partnerType, t)}
            </span>
            <dl className="text-sm grid grid-cols-2 gap-2">
              <dt className="text-slate-500">{t('fullName')}</dt><dd>{selected.fullName || selected.user?.name}</dd>
              <dt className="text-slate-500">{t('emailLabel')}</dt><dd>{selected.user?.email}</dd>
              <dt className="text-slate-500">{t('phone')}</dt><dd>{selected.user?.phone}</dd>
              <dt className="text-slate-500">{t('address')}</dt><dd>{selected.address || '—'}</dd>
              <dt className="text-slate-500">{t('registeredAt')}</dt>
              <dd className="text-slate-400" title={t('systemFieldReadonly')}>
                {new Date(selected.createdAt).toLocaleString('ru-RU')}
              </dd>
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
                <p className="text-xs font-semibold text-slate-500 mb-1">{t('auditLog')}</p>
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
                          disabled={loading || acting}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50"
                          onClick={() => actOffering(o.id, SERVICE_STATUS_SPEC.active)}
                        >
                          {t('approve')}
                        </button>
                        <button
                          type="button"
                          disabled={loading || acting}
                          className="flex-1 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold disabled:opacity-50"
                          onClick={() => actOffering(o.id, SERVICE_STATUS_SPEC.rejected, t('rejectDefaultNote'))}
                        >
                          {t('reject')}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selected.status === 'PENDING_REVIEW' && (
              <div className="space-y-2 pt-2 border-t border-slate-700">
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={loading || acting} onClick={() => act(api.adminApprovePartner)} className="px-4 py-2 rounded-lg bg-emerald-600 font-semibold text-sm disabled:opacity-50">
                    {t('approve')}
                  </button>
                  <button
                    type="button"
                    disabled={loading || acting}
                    onClick={() => setRejectModalOpen(true)}
                    className="px-4 py-2 rounded-lg bg-red-600 font-semibold text-sm disabled:opacity-50"
                  >
                    {t('reject')}
                  </button>
                </div>
                <textarea
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-sm"
                  placeholder={t('revisionPlaceholder')}
                  value={revisionComment}
                  onChange={(e) => setRevisionComment(e.target.value)}
                />
                <button
                  type="button"
                  disabled={loading || acting || revisionComment.trim().length < 3}
                  onClick={() => act((id) => api.adminRevisionPartner(id, revisionComment.trim()))}
                  className="w-full py-2 rounded-lg bg-amber-600 font-semibold text-sm"
                >
                  {t('sendForRevision')}
                </button>
              </div>
            )}
            {selected.status === 'APPROVED' && (
              <button type="button" disabled={loading || acting} onClick={() => act(api.adminSuspendPartner)} className="w-full py-2 rounded-lg bg-red-700 font-semibold text-sm mt-2 disabled:opacity-50">
                {t('block')}
              </button>
            )}
            {(selected.status === 'SUSPENDED' || selected.status === 'REJECTED') && (
              <button type="button" disabled={loading || acting} onClick={() => act(api.adminRestorePartner)} className="w-full py-2 rounded-lg bg-sky-600 font-semibold text-sm mt-2 disabled:opacity-50">
                {t('restore')}
              </button>
            )}
          </div>
        </div>
      )}

      {selected && rejectModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
            <h3 className="text-lg font-semibold text-white">{t('reject')}</h3>
            <p className="text-sm text-slate-400">{selected.companyName || selected.company}</p>
            <textarea
              className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-sm"
              placeholder={t('rejectPlaceholder')}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-700 text-sm"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={loading || acting || rejectReason.trim().length < 3}
                onClick={async () => {
                  await act((id) => api.adminRejectPartner(id, rejectReason.trim()))
                  setRejectModalOpen(false)
                  setIsDetailOpen(false)
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-sm disabled:opacity-50"
              >
                {t('reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
