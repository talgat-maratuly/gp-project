import { useEffect, useState } from 'react'
import { api } from '@gp/shared/api'
import { useLanguage } from '../i18n'
import { usePartner } from '../context/PartnerContext'

function diagnosisText(row) {
  return row?.specialistDiagnosis || row?.aiDiagnosis?.diagnosis || ''
}

export default function PlantDoctorCasesPage() {
  const { t } = useLanguage()
  const { notify } = usePartner()
  const [list, setList] = useState([])
  const [draft, setDraft] = useState({})

  const load = async () => {
    const rows = await api.getPartnerPlantCases()
    setList(Array.isArray(rows) ? rows : [])
  }

  useEffect(() => {
    load()
    const iv = setInterval(load, 8000)
    return () => clearInterval(iv)
  }, [])

  const accept = async (id) => {
    try {
      await api.acceptPartnerPlantCase(id)
      notify(t('notify_status_updated'))
      load()
    } catch (e) {
      notify(e.message || 'Ошибка', 'error')
    }
  }

  const confirm = async (id) => {
    try {
      await api.confirmPartnerPlantCase(id, draft[id] || {})
      notify(t('notify_status_updated'))
      load()
    } catch (e) {
      notify(e.message || 'Ошибка', 'error')
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">{t('plant_doctor_cases')}</h1>
      <ul className="space-y-3">
        {list.map((row) => (
          <li key={row.id} className="partner-card p-4">
            <div className="flex gap-3">
              <img src={row.photoUrl} alt="" className="h-24 w-24 rounded-xl object-cover bg-white/10" />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{row.client?.user?.name || t('client')}</p>
                <p className="text-xs partner-muted">{row.city} · {row.status}</p>
                <p className="mt-2 text-sm">{diagnosisText(row)}</p>
                {(row.aiIssues || []).slice(0, 2).map((issue) => (
                  <p key={issue.code} className="mt-1 text-xs partner-muted">{issue.message}</p>
                ))}
              </div>
            </div>
            {!row.assignedPartnerId && (
              <button type="button" className="mt-3 w-full py-2 rounded-xl partner-gradient text-white text-sm font-semibold" onClick={() => accept(row.id)}>
                {t('plant_doctor_accept')}
              </button>
            )}
            {row.assignedPartnerId && row.status !== 'SPECIALIST_CONFIRMED' && (
              <div className="mt-3 space-y-2">
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  placeholder={t('plant_doctor_specialist_diagnosis')}
                  value={draft[row.id]?.diagnosis || ''}
                  onChange={(e) => setDraft((d) => ({ ...d, [row.id]: { ...(d[row.id] || {}), diagnosis: e.target.value } }))}
                />
                <textarea
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  placeholder={t('plant_doctor_specialist_recommendation')}
                  rows={3}
                  value={draft[row.id]?.recommendation || ''}
                  onChange={(e) => setDraft((d) => ({ ...d, [row.id]: { ...(d[row.id] || {}), recommendation: e.target.value } }))}
                />
                <button type="button" className="w-full py-2 rounded-xl partner-gradient text-white text-sm font-semibold" onClick={() => confirm(row.id)}>
                  {t('plant_doctor_confirm')}
                </button>
              </div>
            )}
          </li>
        ))}
        {!list.length && <p className="partner-muted text-sm">{t('plant_doctor_empty')}</p>}
      </ul>
    </div>
  )
}
