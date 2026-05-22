import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { calculateFurnitureProject } from '@gp/shared/utils'
import { FURNITURE_MATERIALS, FURNITURE_FACADES, FURNITURE_COLORS } from '@gp/shared/constants'
import { useLanguage } from '../../i18n'
import { useService } from '../../context/ServiceContext'
import * as spApi from '../../lib/serviceProjectsApi'
import FurnitureDrawing2D from './FurnitureDrawing2D'
import { KaspiButton, KaspiCard } from '@gp/shared/ui/KaspiUI'

export default function FurnitureProjectWizard() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { isDemoMode, notify, isLoggedIn } = useService()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    photo: null, roomWidth: 3.2, roomHeight: 2.7, furnitureLength: 2.4, furnitureDepth: 0.6,
    material: 'ldsp', facadeMaterial: 'ldsp_facade', color: 'white',
  })

  const preview = useMemo(() => calculateFurnitureProject(form), [form])

  const submit = async () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: '/services/furniture/new' } })
      return
    }
    try {
      const res = await spApi.demoCreateFurniture({ ...form, submit: true })
      notify(t('furniture_order_sent'))
      navigate(`/services/furniture/${res.serviceProject.id}`)
    } catch (e) {
      notify(e.message, 'error')
    }
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {step === 1 && (
        <KaspiCard className="!p-4 space-y-3">
          <h2 className="font-bold">{t('furniture_step_room')}</h2>
          <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, photo: e.target.files?.[0]?.name || 'room.jpg' })} />
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label>Ширина комнаты, м<input type="number" step="0.1" className="w-full mt-1 rounded-xl border px-2 py-2" value={form.roomWidth} onChange={(e) => setForm({ ...form, roomWidth: +e.target.value })} /></label>
            <label>Высота, м<input type="number" step="0.1" className="w-full mt-1 rounded-xl border px-2 py-2" value={form.roomHeight} onChange={(e) => setForm({ ...form, roomHeight: +e.target.value })} /></label>
            <label>Длина мебели, м<input type="number" step="0.1" className="w-full mt-1 rounded-xl border px-2 py-2" value={form.furnitureLength} onChange={(e) => setForm({ ...form, furnitureLength: +e.target.value })} /></label>
            <label>Глубина, м<input type="number" step="0.1" className="w-full mt-1 rounded-xl border px-2 py-2" value={form.furnitureDepth} onChange={(e) => setForm({ ...form, furnitureDepth: +e.target.value })} /></label>
          </div>
          <KaspiButton onClick={() => setStep(2)}>{t('next')}</KaspiButton>
        </KaspiCard>
      )}
      {step === 2 && (
        <KaspiCard className="!p-4 space-y-3">
          <h2 className="font-bold">{t('furniture_step_material')}</h2>
          <select className="w-full rounded-xl border px-3 py-3" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })}>
            {FURNITURE_MATERIALS.map((m) => <option key={m.id} value={m.id}>{t(m.labelKey)}</option>)}
          </select>
          <select className="w-full rounded-xl border px-3 py-3" value={form.facadeMaterial} onChange={(e) => setForm({ ...form, facadeMaterial: e.target.value })}>
            {FURNITURE_FACADES.map((m) => <option key={m.id} value={m.id}>{t(m.labelKey)}</option>)}
          </select>
          <select className="w-full rounded-xl border px-3 py-3" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}>
            {FURNITURE_COLORS.map((c) => <option key={c.id} value={c.id}>{t(c.labelKey)}</option>)}
          </select>
          <div className="flex gap-2">
            <button type="button" className="flex-1 py-2 border rounded-xl" onClick={() => setStep(1)}>{t('back')}</button>
            <KaspiButton className="flex-1" onClick={() => setStep(3)}>{t('next')}</KaspiButton>
          </div>
        </KaspiCard>
      )}
      {step >= 3 && (
        <>
          <FurnitureDrawing2D drawing={preview.drawing2D} />
          <KaspiCard className="!p-4">
            <p className="font-bold text-lg">{preview.estimate.total.toLocaleString()} ₸</p>
            <ul className="text-sm mt-2 space-y-1">
              {preview.estimate.lines.map((l, i) => (
                <li key={i}>{l.name}: {(l.qty * l.price).toLocaleString()} ₸</li>
              ))}
            </ul>
          </KaspiCard>
          <KaspiButton onClick={submit}>{t('furniture_submit')}</KaspiButton>
        </>
      )}
    </div>
  )
}
