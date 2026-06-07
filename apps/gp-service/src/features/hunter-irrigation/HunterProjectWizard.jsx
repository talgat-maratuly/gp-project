import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { calculateHunterProject, IRRIGATION_OBJECT_TYPES, IRRIGATION_SHAPES } from '@gp/shared/utils'
import { HUNTER_WATER_SOURCES } from '@gp/shared/constants'
import { useLanguage } from '../../i18n'
import { useService } from '../../context/ServiceContext'
import * as spApi from '../../lib/serviceProjectsApi'
import HunterDrawing2D from './HunterDrawing2D'
import { KaspiButton, KaspiCard } from '@gp/shared/ui/KaspiUI'

const DEFAULT_OBJECTS = [
  { id: 'house-1', type: 'house', x: 24, y: 28, width: 42, height: 28, areaSqm: 70 },
  { id: 'water-1', type: 'water_point', x: 8, y: 82 },
]

export default function HunterProjectWizard() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { isDemoMode, notify, isLoggedIn, profile } = useService()
  const [step, setStep] = useState(1)
  const [linked, setLinked] = useState([])
  const [activeObjectType, setActiveObjectType] = useState('tree')
  const [form, setForm] = useState({
    photo: null,
    shape: 'rectangle',
    length: 20,
    width: 12,
    sotki: 0,
    waterSource: 'city',
    pressure: 2,
    waterFlow: 5,
    objects: DEFAULT_OBJECTS,
  })

  useEffect(() => {
    const load = isDemoMode ? spApi.demoLinkedProducts : spApi.apiLinkedProducts
    load('hunter_irrigation').then(setLinked).catch(() => setLinked([]))
  }, [isDemoMode])

  const preview = useMemo(() => calculateHunterProject(form, linked), [form, linked])

  const addObject = (obj) => {
    setForm((prev) => ({
      ...prev,
      objects: [
        ...(prev.objects || []),
        {
          id: `${obj.type}-${Date.now()}`,
          type: obj.type,
          x: obj.x,
          y: obj.y,
          width: obj.type === 'house' ? 40 : obj.type === 'path' ? 70 : 12,
          height: obj.type === 'house' ? 28 : obj.type === 'path' ? 8 : 12,
          areaSqm: obj.type === 'house' ? 70 : obj.type === 'no_water' ? 12 : undefined,
        },
      ],
    }))
  }

  const removeObject = (id) => {
    setForm((prev) => ({ ...prev, objects: (prev.objects || []).filter((o) => o.id !== id) }))
  }

  const submit = async () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: '/services/hunter-irrigation/new' } })
      return
    }
    try {
      const res = isDemoMode
        ? await spApi.demoCreateHunter({ ...form, drawing: preview.drawing2D, submit: true })
        : await spApi.apiCreateHunter({ ...form, drawing: preview.drawing2D, submit: true })
      notify(t('hunter_order_sent'))
      navigate(`/services/hunter-irrigation/${res.serviceProject.id}`)
    } catch (e) {
      notify(e.message, 'error')
    }
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div>
        <p className="text-xs text-emerald-700 font-medium">{t('hunter_disclaimer')}</p>
        {profile.city && <p className="text-[11px] text-[var(--gp-text-muted)] mt-1">{profile.city}</p>}
      </div>

      {step === 1 && (
        <KaspiCard className="!p-4 space-y-4">
          <div>
            <h2 className="font-bold">AI Irrigation Calculator</h2>
            <p className="text-xs text-[var(--gp-text-muted)] mt-1">Нарисуйте участок: форма, дом, деревья, дорожки, газон и точка воды.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {IRRIGATION_SHAPES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setForm({ ...form, shape: s.id })}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border ${form.shape === s.id ? 'gp-gradient-kaspi text-white border-transparent' : 'border-[var(--gp-border)] bg-[var(--gp-surface-2)]'}`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <label className="text-xs font-semibold">Длина, м<input type="number" className="w-full mt-1 rounded-xl border px-3 py-2" value={form.length} onChange={(e) => setForm({ ...form, length: +e.target.value })} /></label>
            <label className="text-xs font-semibold">Ширина, м<input type="number" className="w-full mt-1 rounded-xl border px-3 py-2" value={form.width} onChange={(e) => setForm({ ...form, width: +e.target.value })} /></label>
            <label className="text-xs font-semibold">Сотки<input type="number" step="0.1" className="w-full mt-1 rounded-xl border px-3 py-2" value={form.sotki} onChange={(e) => setForm({ ...form, sotki: +e.target.value })} /></label>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {IRRIGATION_OBJECT_TYPES.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setActiveObjectType(o.id)}
                className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold border ${activeObjectType === o.id ? 'bg-emerald-600 text-white border-emerald-600' : 'border-[var(--gp-border)] bg-white'}`}
              >
                {o.label}
              </button>
            ))}
          </div>

          <HunterDrawing2D drawing={preview.drawing2D} editable activeObjectType={activeObjectType} onAddObject={addObject} />

          <div className="space-y-1">
            {(form.objects || []).map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-2 rounded-xl bg-[var(--gp-surface-2)] px-3 py-2 text-xs">
                <span>{IRRIGATION_OBJECT_TYPES.find((x) => x.id === o.type)?.label || o.type} · {o.x}%/{o.y}%</span>
                <button type="button" onClick={() => removeObject(o.id)} className="font-bold text-red-500">Удалить</button>
              </div>
            ))}
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
          <HunterDrawing2D drawing={preview.drawing2D} />
          <KaspiCard className="!p-4 space-y-3">
            <h3 className="font-bold">AI-проверка</h3>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl bg-emerald-50 p-2"><b>{preview.lawnArea}</b><br />м² газон</div>
              <div className="rounded-xl bg-sky-50 p-2"><b>{preview.zones}</b><br />зон</div>
              <div className="rounded-xl bg-amber-50 p-2"><b>{preview.sprinklers.length}</b><br />форсунок</div>
            </div>
            <ul className="space-y-1 text-sm">
              {(preview.aiChecks || []).map((c) => (
                <li key={c.code} className={c.level === 'error' ? 'text-red-600' : c.level === 'warning' ? 'text-amber-700' : 'text-emerald-700'}>
                  {c.message}
                </li>
              ))}
            </ul>
          </KaspiCard>

          <KaspiCard className="!p-4">
            <h3 className="font-bold mb-2">{t('hunter_equipment')}</h3>
            <ul className="text-sm space-y-2">
              {preview.estimate.lines.map((l, i) => (
                <li key={i} className="border-b border-[var(--gp-border)] pb-2 last:border-0">
                  <div className="flex justify-between gap-2">
                    <span>{l.name} ×{l.qty}</span>
                    <span>{(l.qty * (l.market?.price || l.price)).toLocaleString()} ₸</span>
                  </div>
                  {l.market && (
                    <p className={`text-[11px] mt-0.5 ${l.market.status === 'available' ? 'text-emerald-600' : 'text-amber-700'}`}>
                      {l.market.message || l.market.status}
                      {l.market.storeName ? ` · ${l.market.storeName}` : ''}
                      {l.market.requestToShop ? ' · отправим заявку магазину' : ''}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            <p className="font-extrabold text-emerald-700 mt-3 text-lg">{preview.estimate.total.toLocaleString()} ₸</p>
            <p className="text-[11px] text-[var(--gp-text-muted)] mt-1">Точный инженерный расчёт подтверждает специалист.</p>
          </KaspiCard>
          <div className="flex gap-2">
            <button type="button" className="flex-1 py-3 rounded-xl border font-bold" onClick={() => setStep(2)}>{t('back')}</button>
            <KaspiButton className="flex-1" onClick={submit}>{t('hunter_submit')}</KaspiButton>
          </div>
        </>
      )}
    </div>
  )
}
