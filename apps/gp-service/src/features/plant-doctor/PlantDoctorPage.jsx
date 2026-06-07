import { useEffect, useState } from 'react'
import { Camera, Loader2, Send, Sprout } from 'lucide-react'
import { api } from '@gp/shared/api'
import { KaspiCard } from '@gp/shared/ui/KaspiUI'
import { useLanguage } from '../../i18n'
import { useService } from '../../context/ServiceContext'

function diagnosisText(row) {
  return row?.specialistDiagnosis || row?.aiDiagnosis?.diagnosis || row?.aiDiagnosis?.summary || ''
}

export default function PlantDoctorPage() {
  const { t } = useLanguage()
  const { profile } = useService()
  const [file, setFile] = useState(null)
  const [city, setCity] = useState(profile.city || 'Уральск')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [cases, setCases] = useState([])

  const loadCases = async () => {
    try {
      const list = await api.getMyPlantCases()
      setCases(Array.isArray(list) ? list : [])
    } catch {
      setCases([])
    }
  }

  useEffect(() => {
    loadCases()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError(t('plant_doctor_need_photo'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const row = await api.createPlantCase(file, { city, description })
      setResult(row)
      setFile(null)
      setDescription('')
      await loadCases()
    } catch (err) {
      setError(err?.message || 'AI Plant Doctor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <section className="rounded-3xl gp-gradient-kaspi text-white p-5">
        <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-4">
          <Sprout className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold">{t('plant_doctor_title')}</h1>
        <p className="text-sm text-white/85 mt-2">{t('plant_doctor_desc')}</p>
      </section>

      <form onSubmit={submit} className="gp-card p-4 space-y-4">
        <label className="block">
          <span className="text-sm font-bold">{t('plant_doctor_photo')}</span>
          <label className="mt-2 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 text-emerald-800">
            <Camera className="w-8 h-8 mb-2" />
            <span className="text-sm font-semibold">{file?.name || t('plant_doctor_title')}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
        </label>

        <label className="block">
          <span className="text-sm font-bold">{t('plant_doctor_city')}</span>
          <input className="mt-1 w-full rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface)] px-3 py-3 text-sm" value={city} onChange={(e) => setCity(e.target.value)} />
        </label>

        <label className="block">
          <span className="text-sm font-bold">{t('plant_doctor_optional_desc')}</span>
          <textarea className="mt-1 w-full rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface)] px-3 py-3 text-sm" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="w-full rounded-2xl gp-gradient-kaspi py-3 font-bold text-white flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {t('plant_doctor_send')}
        </button>
      </form>

      {result && (
        <KaspiCard className="!p-4">
          <p className="text-xs font-bold text-emerald-600 uppercase">{t('plant_doctor_result')}</p>
          <p className="mt-2 font-bold">{diagnosisText(result)}</p>
          <p className="mt-1 text-sm text-[var(--gp-text-muted)]">{result.status}</p>
        </KaspiCard>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-extrabold">{t('plant_doctor_cases')}</h2>
        {cases.map((row) => (
          <KaspiCard key={row.id} className="!p-4">
            <div className="flex gap-3">
              <img src={row.photoUrl} alt="" className="h-20 w-20 rounded-xl object-cover bg-slate-100" />
              <div className="min-w-0 flex-1">
                <p className="font-bold truncate">{diagnosisText(row)}</p>
                <p className="text-xs text-[var(--gp-text-muted)]">{row.city} · {row.status}</p>
                {row.specialistRecommendation && <p className="mt-1 text-sm">{row.specialistRecommendation}</p>}
              </div>
            </div>
          </KaspiCard>
        ))}
        {!cases.length && <p className="text-sm text-[var(--gp-text-muted)]">{t('plant_doctor_empty')}</p>}
      </section>
    </div>
  )
}
