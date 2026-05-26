import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, getToken } from '@gp/shared/api'
import {
  getPartnerOfferingStatusLabel,
  getPartnerSubserviceLabel,
  PARTNER_OFFERING_STATUS_LABELS,
} from '@gp/shared/constants'
import { SERVICE_STATUS_SPEC, partnerStatusLabel } from '@gp/shared-core/statuses'
import { isDemoMode } from '@gp/shared/demo'
import { useAccess } from '../context/AccessContext'
import { ACTIONS } from '../lib/permissions'
import { useLanguage } from '../i18n/LanguageContext'

const TAB_IDS = ['PENDING_MODERATION', 'ACTIVE', 'REJECTED', 'TEMPORARILY_BLOCKED']

/**
 * @param {{ scope?: 'specialist', title: string, subtitle: string, backTo?: string }} props
 */
export default function OfferingModerationPanel({ scope, title, subtitle, backTo }) {
  const { t } = useLanguage()
  const { can } = useAccess()
  const [tab, setTab] = useState('PENDING_MODERATION')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rejectNote, setRejectNote] = useState('')
  const [rejectId, setRejectId] = useState(null)

  const listOpts = scope ? { scope } : {}

  const load = useCallback(async () => {
    if (isDemoMode() && !getToken()) {
      setList([])
      setError(t('moderationApiOnly'))
      return
    }
    setLoading(true)
    setError('')
    try {
      setList(await api.adminOfferings(tab, listOpts))
    } catch (e) {
      setError(e?.message || t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [tab, listOpts, t])

  useEffect(() => {
    load()
  }, [load])

  const setStatus = async (id, status, moderationNote) => {
    setLoading(true)
    setError('')
    try {
      await api.adminUpdateOfferingStatus(id, {
        status,
        ...(moderationNote ? { moderationNote } : {}),
      })
      setRejectId(null)
      setRejectNote('')
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
      {backTo && (
        <Link to={backTo} className="text-sm text-sky-400 hover:underline">
          ← {t('specialist_moderation')}
        </Link>
      )}
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
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              tab === id ? 'bg-sky-600 text-white' : 'bg-white/10 text-slate-300'
            }`}
          >
            {PARTNER_OFFERING_STATUS_LABELS[id] || id}
          </button>
        ))}
      </div>

      {loading && !list.length && <p className="text-slate-400 text-sm">{t('loading')}</p>}

      <ul className="space-y-2">
        {list.map((o) => (
          <li key={o.id} className="rounded-xl border border-white/10 p-4 space-y-2">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-semibold text-white">{getPartnerSubserviceLabel(o.subserviceId)}</p>
                <p className="text-xs text-slate-500 font-mono">{o.subserviceId}</p>
                <p className="text-sm text-slate-300 mt-1">
                  {o.partner?.companyName || o.partner?.user?.name}
                  {o.partner?.user?.phone ? ` · ${o.partner.user.phone}` : ''}
                </p>
                <p className="text-xs text-slate-500">
                  {o.partner?.region?.name || '—'} · {partnerStatusLabel(o.partner?.status)}
                  {' · '}
                  {getPartnerOfferingStatusLabel(o.status)}
                </p>
                {o.moderationNote && (
                  <p className="text-xs text-amber-300 mt-1">{t('revisionComment')}: {o.moderationNote}</p>
                )}
              </div>
              <p className="text-[10px] text-slate-600">
                {new Date(o.createdAt).toLocaleString('ru-RU')}
              </p>
            </div>

            {tab === 'PENDING_MODERATION' && (
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold"
                  onClick={() => setStatus(o.id, SERVICE_STATUS_SPEC.active)}
                >
                  {t('approve')}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg bg-red-600/90 text-white text-sm font-semibold"
                  onClick={() => setRejectId(rejectId === o.id ? null : o.id)}
                >
                  {t('reject')}
                </button>
              </div>
            )}

            {rejectId === o.id && (
              <div className="space-y-2 pt-1 border-t border-white/10">
                <textarea
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-sm"
                  placeholder={t('rejectPlaceholder')}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                />
                <button
                  type="button"
                  disabled={loading || rejectNote.trim().length < 3}
                  className="px-3 py-1.5 rounded-lg bg-red-700 text-white text-sm font-semibold disabled:opacity-50"
                  onClick={() => setStatus(o.id, SERVICE_STATUS_SPEC.rejected, rejectNote.trim())}
                >
                  {t('reject')}
                </button>
              </div>
            )}

            {o.status === 'ACTIVE' && tab === 'ACTIVE' && (
              <button
                type="button"
                disabled={loading}
                className="text-xs px-2 py-1 rounded-lg bg-slate-600 text-white"
                onClick={() => setStatus(o.id, SERVICE_STATUS_SPEC.hidden)}
              >
                {t('block')}
              </button>
            )}
          </li>
        ))}
        {!loading && !list.length && (
          <li className="text-slate-500 text-sm py-6 text-center">{t('noApplications')}</li>
        )}
      </ul>
    </div>
  )
}
