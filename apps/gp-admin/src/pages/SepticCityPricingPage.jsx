import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '@gp/shared/api'
import { OBLASTS_SEED, CITIES_SEED } from '@gp/shared/demo'
import { useAccess } from '../context/AccessContext'
import { useLanguage } from '../i18n/LanguageContext'
import { resolveLocalizedName } from '@gp/shared/i18n'
import { ACTIONS } from '../lib/permissions'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import FormActions from '../components/FormActions'
import { formatMoney } from '../lib/format'

const SERVICE_CODE = 'septic'

const emptyPriceForm = () => ({
  oblastId: OBLASTS_SEED[0]?.id || '',
  cityId: CITIES_SEED[0]?.id || '',
  subserviceTypeId: '',
  price: 8000,
  gpCommission: 300,
  active: true,
  volumeStart: 3,
  volumeEnd: 4,
  priority: 0,
})

export default function SepticCityPricingPage() {
  const { can } = useAccess()
  const { t, lang } = useLanguage()
  const [prices, setPrices] = useState([])
  const [subTypes, setSubTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyPriceForm())
  const [formError, setFormError] = useState('')

  const citiesByOblast = useMemo(() => {
    const map = {}
    for (const c of CITIES_SEED) {
      if (!map[c.oblastId]) map[c.oblastId] = []
      map[c.oblastId].push(c)
    }
    return map
  }, [])

  const cityLabel = (cityId) => {
    const c = CITIES_SEED.find((x) => x.id === cityId)
    return c ? resolveLocalizedName(c, lang) : cityId
  }

  const oblastLabel = (oblastId) => {
    const o = OBLASTS_SEED.find((x) => x.id === oblastId)
    return o ? resolveLocalizedName(o, lang) : oblastId
  }

  const subLabel = (subId) => {
    const s = subTypes.find((x) => x.id === subId)
    return s ? `${resolveLocalizedName(s, lang)} (${s.code})` : '—'
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [priceList, typeList] = await Promise.all([
        api.adminCityPrices({ serviceCode: SERVICE_CODE }),
        api.adminServiceTypes(SERVICE_CODE),
      ])
      setPrices(Array.isArray(priceList) ? priceList : [])
      const septic = Array.isArray(typeList) ? typeList[0] : null
      setSubTypes(septic?.subservices || [])
    } catch (e) {
      console.warn('[SepticPricing]', e?.message)
      setPrices([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openAdd = () => {
    setFormError('')
    setModal('new')
    setForm(emptyPriceForm())
  }

  const openEdit = (row) => {
    setFormError('')
    setModal(row.id)
    setForm({
      oblastId: row.oblastId || CITIES_SEED.find((c) => c.id === row.cityId)?.oblastId || '',
      cityId: row.cityId,
      subserviceTypeId: row.subserviceTypeId || '',
      price: row.price,
      gpCommission: row.gpCommission,
      active: row.active !== false,
      volumeStart: row.volumeStart ?? '',
      volumeEnd: row.volumeEnd ?? '',
      priority: row.priority ?? 0,
    })
  }

  const onOblastChange = (oblastId) => {
    const firstCity = citiesByOblast[oblastId]?.[0]?.id || ''
    setForm((f) => ({ ...f, oblastId, cityId: firstCity }))
  }

  const save = async () => {
    if (!form.cityId || !form.subserviceTypeId) {
      setFormError(t('fillRequired'))
      return
    }
    const sub = subTypes.find((s) => s.id === form.subserviceTypeId)
    const payload = {
      serviceCode: SERVICE_CODE,
      oblastId: form.oblastId,
      cityId: form.cityId,
      subserviceTypeId: form.subserviceTypeId,
      price: Number(form.price),
      gpCommission: Number(form.gpCommission),
      active: form.active,
      volumeStart: form.volumeStart === '' ? null : Number(form.volumeStart),
      volumeEnd: form.volumeEnd === '' ? null : Number(form.volumeEnd),
      priority: Number(form.priority) || 0,
    }
    try {
      if (modal === 'new') {
        await api.adminCreateCityPrice(payload)
      } else {
        await api.adminUpdateCityPrice(modal, payload)
      }
      setModal(null)
      setFormError('')
      await load()
    } catch (e) {
      setFormError(e?.message || t('saveError'))
    }
  }

  const remove = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return
    await api.adminRemoveCityPrice(id)
    await load()
  }

  if (!can(ACTIONS.SERVICE_CRUD)) return <p className="text-slate-500">{t('noAccess')}</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm admin-muted">{t('septicPricingHint')}</p>
        <Link to="/services" className="text-sm text-sky-400 font-semibold hover:underline">
          ← {t('nav_service_types')}
        </Link>
      </div>
      <button type="button" onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-sm font-semibold">
        <Plus className="w-4 h-4" /> {t('addCityPrice')}
      </button>

      {loading && <p className="text-sm admin-muted">{t('loading')}</p>}

      <div className="overflow-x-auto admin-card !p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs admin-muted">
              <th className="p-3">{t('oblast')}</th>
              <th className="p-3">{t('city')}</th>
              <th className="p-3">{t('subservice')}</th>
              <th className="p-3">{t('price')}</th>
              <th className="p-3">{t('volumeStart')}</th>
              <th className="p-3">{t('volumeEnd')}</th>
              <th className="p-3">{t('priority')}</th>
              <th className="p-3">{t('status')}</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {prices.map((row) => (
              <tr key={row.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-3">{oblastLabel(row.oblastId)}</td>
                <td className="p-3 font-medium">{cityLabel(row.cityId)}</td>
                <td className="p-3 text-xs">{row.subserviceCode || subLabel(row.subserviceTypeId)}</td>
                <td className="p-3">{formatMoney(row.price)}</td>
                <td className="p-3">{row.volumeStart ?? '—'}</td>
                <td className="p-3">{row.volumeEnd ?? '—'}</td>
                <td className="p-3">{row.priority}</td>
                <td className="p-3">
                  <Badge color={row.active ? 'emerald' : 'slate'}>{row.active ? t('activeF') : t('inactiveF')}</Badge>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <button type="button" className="text-xs text-sky-400 mr-2" onClick={() => openEdit(row)}>{t('edit')}</button>
                  <button type="button" className="text-xs text-red-400" onClick={() => remove(row.id)}><Trash2 className="w-3 h-3 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !prices.length && (
          <p className="p-4 text-sm admin-muted text-center">{t('noData')}</p>
        )}
      </div>

      <Modal open={!!modal} onClose={() => { setModal(null); setFormError('') }} title={modal === 'new' ? t('addCityPrice') : t('edit')}>
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="text-xs text-slate-300 font-medium">{t('oblast')}</span>
            <select className="admin-input mt-1" value={form.oblastId} onChange={(e) => onOblastChange(e.target.value)}>
              {OBLASTS_SEED.map((o) => (
                <option key={o.id} value={o.id}>{resolveLocalizedName(o, lang)}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-slate-300 font-medium">{t('city')}</span>
            <select className="admin-input mt-1" value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })}>
              {(citiesByOblast[form.oblastId] || []).map((c) => (
                <option key={c.id} value={c.id}>{resolveLocalizedName(c, lang)}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-slate-300 font-medium">{t('subservice')}</span>
            <select className="admin-input mt-1" value={form.subserviceTypeId} onChange={(e) => setForm({ ...form, subserviceTypeId: e.target.value })}>
              <option value="">{t('selectSubservice')}</option>
              {subTypes.map((s) => (
                <option key={s.id} value={s.id}>{resolveLocalizedName(s, lang)} ({s.code})</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-xs text-slate-300 font-medium">{t('price')}</span><input type="number" className="admin-input mt-1" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} /></label>
            <label className="block"><span className="text-xs text-slate-300 font-medium">{t('gpCommission')}</span><input type="number" className="admin-input mt-1" value={form.gpCommission} onChange={(e) => setForm({ ...form, gpCommission: +e.target.value })} /></label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="block"><span className="text-xs text-slate-300 font-medium">{t('volumeStart')}</span><input type="number" className="admin-input mt-1" value={form.volumeStart} onChange={(e) => setForm({ ...form, volumeStart: e.target.value })} /></label>
            <label className="block"><span className="text-xs text-slate-300 font-medium">{t('volumeEnd')}</span><input type="number" className="admin-input mt-1" value={form.volumeEnd} onChange={(e) => setForm({ ...form, volumeEnd: e.target.value })} /></label>
            <label className="block"><span className="text-xs text-slate-300 font-medium">{t('priority')}</span><input type="number" className="admin-input mt-1" value={form.priority} onChange={(e) => setForm({ ...form, priority: +e.target.value })} /></label>
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />{t('activeF')}</label>
          {formError && <p className="text-xs text-red-400">{formError}</p>}
          <FormActions onSave={save} onCancel={() => { setModal(null); setFormError('') }} />
        </div>
      </Modal>
    </div>
  )
}
