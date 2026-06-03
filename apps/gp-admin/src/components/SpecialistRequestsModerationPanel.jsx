import { useCallback, useEffect, useState } from 'react'
import { api } from '@gp/shared/api'
import { useLanguage } from '../i18n/LanguageContext'
import { useAccess } from '../context/AccessContext'
import { ACTIONS } from '../lib/permissions'

const STATUS_TABS = ['PENDING', 'APPROVED', 'REJECTED', '']

export default function SpecialistRequestsModerationPanel({ title, subtitle }) {
  const { t } = useLanguage()
  const { can } = useAccess()
  const [tab, setTab] = useState('PENDING')
  const [list, setList] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [rejectCode, setRejectCode] = useState('OTHER')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.moderatorListSpecialistRequests({
        status: tab || undefined,
        limit: 50,
      })
      setList(res.items || [])
    } catch (e) {
      setError(e?.message || t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [tab, t])

  useEffect(() => {
    load()
  }, [load])

  const openDetail = async (id) => {
    setLoading(true)
    try {
      const row = await api.moderatorGetSpecialistRequest(id)
      setSelected(row)
    } catch (e) {
      setError(e?.message || t('loadError'))
    } finally {
      setLoading(false)
    }
  }

  const approve = async () => {
    if (!selected) return
    setActing(true)
    try {
      const row = await api.moderatorApproveSpecialistRequest(selected.id)
      setSelected(row)
      await load()
    } catch (e) {
      setError(e?.message || t('actionError'))
    } finally {
      setActing(false)
    }
  }

  const reject = async () => {
    if (!selected || !rejectReason.trim()) return
    setActing(true)
    try {
      const row = await api.moderatorRejectSpecialistRequest(selected.id, {
        rejectionReason: rejectReason.trim(),
        rejectionReasonCode: rejectCode,
      })
      setSelected(row)
      setRejectReason('')
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

  const photoLinks = (row) => {
    const links = []
    if (row.profilePhotoUrl) links.push({ label: t('photoProfile'), url: row.profilePhotoUrl })
    if (row.idCardFrontUrl) links.push({ label: t('photoIdFront'), url: row.idCardFrontUrl })
    if (row.idCardBackUrl) links.push({ label: t('photoIdBack'), url: row.idCardBackUrl })
    const equip = row.equipmentPhotoUrls || []
    equip.forEach((url, i) => links.push({ label: `${t('photoEquipment')} ${i + 1}`, url }))
    const v = row.vehicleData
    if (v && typeof v === 'object') {
      if (v.vehiclePhotoUrl) links.push({ label: t('photoVehicle'), url: v.vehiclePhotoUrl })
      if (v.driverLicensePhotoUrl) links.push({ label: t('photoLicense'), url: v.driverLicensePhotoUrl })
      ;(v.registrationPhotoUrls || []).forEach((url, i) => links.push({ label: `${t('photoRegistration')} ${i + 1}`, url }))
    }
    return links
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {(loading || acting) && <p className="text-sm text-slate-500">{t('loading')}</p>}

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.filter(Boolean).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => { setTab(id); setSelected(null) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              tab === id ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {t(`moderationStatus_${id}`)}
          </button>
        ))}
        {STATUS_TABS.includes('') && (
          <button
            key="all"
            type="button"
            onClick={() => { setTab(''); setSelected(null) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              tab === '' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {t('all')}
          </button>
        )}
      </div>

      <div className="admin-table-wrap overflow-x-auto max-h-[50vh]">
        <table className="admin-table min-w-full">
          <thead>
            <tr>
              <th>{t('fullName')}</th>
              <th>{t('serviceType')}</th>
              <th>{t('region')}</th>
              <th>{t('phone')}</th>
              <th>{t('status')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className="cursor-pointer hover:bg-slate-800/40" onClick={() => openDetail(r.id)}>
                <td>{r.specialistName}</td>
                <td>{r.primaryCategory || r.categoryId}</td>
                <td>{r.region?.name || r.city}</td>
                <td>{r.phoneNumber}</td>
                <td>{t(`moderationStatus_${r.status}`) !== `moderationStatus_${r.status}` ? t(`moderationStatus_${r.status}`) : r.status}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="text-sky-400 text-sm" onClick={() => openDetail(r.id)}>
                    {t('open')}
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
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
          <h2 className="font-bold text-lg">{t('specialistOrder')}: {selected.specialistName}</h2>
          <p className="text-sm text-slate-400">
            {t(`moderationStatus_${selected.status}`) !== `moderationStatus_${selected.status}` ? t(`moderationStatus_${selected.status}`) : selected.status}
            {' · '}
            {selected.city}
          </p>
          <p className="text-sm">Subs: {(selected.subserviceIds || []).join(', ')}</p>
          {selected.workExperience && <p className="text-sm text-slate-300">{selected.workExperience}</p>}
          {selected.rejectionReason && (
            <p className="text-sm text-red-300">{t('rejectReason')}: {selected.rejectionReason}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {photoLinks(selected).map((p) => (
              <a key={p.url} href={p.url} target="_blank" rel="noopener noreferrer" className="block w-24">
                <img src={p.url} alt={p.label} className="w-24 h-24 object-cover rounded-lg border border-slate-700" />
                <span className="text-[10px] text-slate-500">{p.label}</span>
              </a>
            ))}
          </div>
          {selected.status === 'PENDING' && (
            <div className="flex flex-wrap gap-2 pt-2">
              <button type="button" disabled={acting} onClick={approve} className="px-4 py-2 rounded-lg bg-emerald-600 text-sm font-semibold disabled:opacity-50">
                {t('approve')}
              </button>
              <input
                className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-slate-800 text-sm"
                placeholder={t('rejectReason')}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <select
                className="px-3 py-2 rounded-lg bg-slate-800 text-sm"
                value={rejectCode}
                onChange={(e) => setRejectCode(e.target.value)}
              >
                {['DOCUMENTS_UNCLEAR', 'MISSING_PHOTOS', 'INCORRECT_INFORMATION', 'VEHICLE_NOT_SUITABLE', 'OTHER'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button type="button" disabled={acting || !rejectReason.trim()} onClick={reject} className="px-4 py-2 rounded-lg bg-red-600 text-sm font-semibold disabled:opacity-50">
                {t('reject')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
