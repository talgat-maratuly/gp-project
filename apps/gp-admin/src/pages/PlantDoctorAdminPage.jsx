import { useEffect, useState } from 'react'
import { api } from '@gp/shared/api'
import { useLanguage } from '../i18n/LanguageContext'

function diagnosisText(row) {
  return row?.specialistDiagnosis || row?.aiDiagnosis?.diagnosis || ''
}

export default function PlantDoctorAdminPage() {
  const { t } = useLanguage()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const rows = await api.adminPlantCases()
      setList(Array.isArray(rows) ? rows : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const approve = async (id) => {
    await api.adminApprovePlantCase(id, true)
    load()
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold admin-heading">{t('plant_doctor_admin_cases')}</h1>
        <p className="admin-muted text-sm">{t('plant_doctor_desc')}</p>
      </div>

      {loading ? (
        <p className="admin-muted text-sm">{t('loading')}</p>
      ) : (
        <div className="admin-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left admin-muted border-b" style={{ borderColor: 'var(--gp-border)' }}>
                <th className="p-3">{t('plant_doctor_photo')}</th>
                <th className="p-3">{t('client')}</th>
                <th className="p-3">{t('city')}</th>
                <th className="p-3">{t('plant_doctor_diagnosis')}</th>
                <th className="p-3">{t('status')}</th>
                <th className="p-3">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id} className="border-b align-top" style={{ borderColor: 'var(--gp-border)' }}>
                  <td className="p-3">
                    <img src={row.photoUrl} alt="" className="h-16 w-16 rounded-lg object-cover bg-slate-100" />
                  </td>
                  <td className="p-3">{row.client?.user?.name || t('client')}</td>
                  <td className="p-3">{row.city}</td>
                  <td className="p-3 max-w-sm">
                    <p className="font-semibold admin-heading">{diagnosisText(row)}</p>
                    {row.specialistRecommendation && <p className="mt-1 admin-muted">{row.specialistRecommendation}</p>}
                  </td>
                  <td className="p-3">{row.status}</td>
                  <td className="p-3">
                    <button type="button" className="admin-btn-primary text-xs" onClick={() => approve(row.id)}>
                      {t('plant_doctor_add_knowledge')}
                    </button>
                  </td>
                </tr>
              ))}
              {!list.length && (
                <tr>
                  <td className="p-6 text-center admin-muted" colSpan={6}>{t('plant_doctor_empty')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
