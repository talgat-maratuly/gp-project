import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { calculateHunterProject } from '@gp/shared/utils'
import { HUNTER_WATER_SOURCES } from '@gp/shared/constants'
import { useLanguage } from '../../i18n'
import { useService } from '../../context/ServiceContext'
import * as spApi from '../../lib/serviceProjectsApi'
import HunterDrawing2D from './HunterDrawing2D'
import { KaspiButton, KaspiCard } from '@gp/shared/ui/KaspiUI'

export default function HunterProjectWizard() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { isDemoMode, notify, isLoggedIn } = useService()
  const [step, setStep] = useState(1)
  const [linked, setLinked] = useState([])
  const [form, setForm] = useState({
    photo: null, length: 12, width: 8, waterSource: 'city', pressure: 2.5, waterFlow: 2,
  })

  useEffect(() => {
    if (isDemoMode) spApi.demoLinkedProducts('hunter_irrigation').then(setLinked)
  }, [isDemoMode])

  const preview = useMemo(() => calculateHunterProject(form, linked), [form, linked])

  const submit = async () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: '/services/hunter-irrigation/new' } })
      return
    }
    try {
      const res = isDemoMode
        ? await spApi.demoCreateHunter({ ...form, submit: true })
        : null
      if (!isDemoMode) throw new Error('API: включите demo или backend')
      notify(t('hunter_order_sent'))
      navigate(`/services/hunter-irrigation/${res.serviceProject.id}`)
    } catch (e) {
      notify(e.message, 'error')
    }
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <p className="text-xs text-emerald-700 font-medium">{t('hunter_disclaimer')}</p>

      {step === 1 && (
        <KaspiCard className="!p-4 space-y-3">
          <h2 className="font-bold">{t('hunter_step_photo')}</h2>
          <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, photo: e.target.files?.[0]?.name || 'photo.jpg' })} className="text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm">Длина, м<input type="number" className="w-full mt-1 rounded-xl border px-3 py-2" value={form.length} onChange={(e) => setForm({ ...form, length: +e.target.value })} /></label>
            <label className="text-sm">Ширина, м<input type="number" className="w-full mt-1 rounded-xl border px-3 py-2" value={form.width} onChange={(e) => setForm({ ...form, width: +e.target.value })} /></label>
          </div>
          <KaspiButton onClick={() => setStep(2)}>{t('next')}</KaspiButton>
        </KaspiCard>
      )}

      {step === 2 && (
        <KaspiCard className="!p-4 space-y-3">
          <h2 className="font-bold">{t('hunter_step_water')}</h2>
          <select className="w-full rounded-xl border px-3 py-3" value={form.waterSource} onChange={(e) => setForm({ ...form, waterSource: e.target.value })}>
            {HUNTER_WATER_SOURCES.map((w) => <option key={w.id} value={w.id}>{t(w.labelKey)}</option>)}
          </select>
          <label className="text-sm block">Давление, бар<input type="number" step="0.1" className="w-full mt-1 rounded-xl border px-3 py-2" value={form.pressure} onChange={(e) => setForm({ ...form, pressure: +e.target.value })} /></label>
          <label className="text-sm block">Расход, м³/ч<input type="number" step="0.1" className="w-full mt-1 rounded-xl border px-3 py-2" value={form.waterFlow} onChange={(e) => setForm({ ...form, waterFlow: +e.target.value })} /></label>
          <div className="flex gap-2">
            <button type="button" className="flex-1 py-2 rounded-xl border" onClick={() => setStep(1)}>{t('back')}</button>
            <KaspiButton className="flex-1" onClick={() => setStep(3)}>{t('next')}</KaspiButton>
          </div>
        </KaspiCard>
      )}

      {step >= 3 && (
        <>
          <HunterDrawing2D drawing={preview.drawing2D} length={form.length} width={form.width} />
          <KaspiCard className="!p-4">
            <h3 className="font-bold mb-2">{t('hunter_equipment')}</h3>
            <ul className="text-sm space-y-1">
              {preview.estimate.lines.slice(0, 6).map((l, i) => (
                <li key={i} className="flex justify-between"><span>{l.name} ×{l.qty}</span><span>{(l.qty * l.price).toLocaleString()} ₸</span></li>
              ))}
            </ul>
            <p className="font-extrabold text-emerald-700 mt-3 text-lg">{preview.estimate.total.toLocaleString()} ₸</p>
          </KaspiCard>
          <KaspiButton onClick={submit}>{t('hunter_submit')}</KaspiButton>
        </>
      )}
    </div>
  )
}
