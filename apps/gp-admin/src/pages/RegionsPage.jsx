import { useState } from 'react'
import { Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useAccess } from '../context/AccessContext'
import { useLanguage } from '../i18n/LanguageContext'
import {
  EMPTY_NAMES,
  hasAllLocalizedNames,
  normalizeNames,
  resolveLocalizedName,
  withLocalizedName,
} from '@gp/shared/i18n'
import { ACTIONS } from '../lib/permissions'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import FormActions from '../components/FormActions'
import LocalizedNameFields from '../components/LocalizedNameFields'

const emptyNamesForm = () => ({ names: { ...EMPTY_NAMES }, active: true })

export default function RegionsPage() {
  const { store, addOblast, updateOblast, removeOblast, addCity, updateCity, removeCity } = useStore()
  const { can } = useAccess()
  const { t, lang } = useLanguage()
  const [expanded, setExpanded] = useState({})
  const [oblastModal, setOblastModal] = useState(null)
  const [cityModal, setCityModal] = useState(null)
  const [oblastForm, setOblastForm] = useState(emptyNamesForm())
  const [cityForm, setCityForm] = useState({ oblastId: '', franchiseId: '', ...emptyNamesForm() })
  const [formError, setFormError] = useState('')

  const label = (entity) => resolveLocalizedName(entity, lang)
  const oblasts = store.oblasts || []
  const cities = store.cities || []

  const openAddOblast = () => {
    setFormError('')
    setOblastModal('new')
    setOblastForm(emptyNamesForm())
  }

  const openEditOblast = (o) => {
    setFormError('')
    setOblastModal(o.id)
    setOblastForm({ names: normalizeNames(o), active: o.active !== false })
  }

  const openAddCity = (oblastId = '') => {
    setFormError('')
    setCityModal({ oblastId, cityId: 'new' })
    setCityForm({ oblastId: oblastId || oblasts[0]?.id || '', franchiseId: '', ...emptyNamesForm() })
  }

  const openEditCity = (city) => {
    setFormError('')
    setCityModal({ oblastId: city.oblastId, cityId: city.id })
    setCityForm({
      oblastId: city.oblastId,
      franchiseId: city.franchiseId || '',
      names: normalizeNames(city),
      active: city.active !== false,
    })
  }

  const saveOblast = () => {
    if (!hasAllLocalizedNames(oblastForm.names)) {
      setFormError(t('namesRequired'))
      return
    }
    const payload = withLocalizedName({ names: oblastForm.names, active: oblastForm.active })
    if (oblastModal === 'new') addOblast(payload)
    else updateOblast(oblastModal, payload)
    setOblastModal(null)
    setFormError('')
  }

  const saveCity = () => {
    if (!cityModal || !hasAllLocalizedNames(cityForm.names) || !cityForm.oblastId) {
      setFormError(t('namesRequired'))
      return
    }
    const payload = withLocalizedName({
      names: cityForm.names,
      oblastId: cityForm.oblastId,
      franchiseId: cityForm.franchiseId || null,
      active: cityForm.active,
    })
    if (cityModal.cityId === 'new') addCity(payload)
    else updateCity(cityModal.cityId, payload)
    setCityModal(null)
    setFormError('')
  }

  if (!can(ACTIONS.GEOGRAPHY_CRUD)) return <p className="text-slate-500">{t('noAccess')}</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={openAddOblast} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-sm font-semibold">
          <Plus className="w-4 h-4" /> {t('addOblast')}
        </button>
        <button
          type="button"
          disabled={!oblasts.length}
          onClick={() => openAddCity()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 text-sm font-semibold disabled:opacity-40"
        >
          <Plus className="w-4 h-4" /> {t('addCity')}
        </button>
      </div>

      {oblasts.map((o) => (
        <div key={o.id} className="admin-card">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-bold">{label(o)}</h3>
              <p className="text-xs text-slate-500">
                {(cities.filter((c) => c.oblastId === o.id)).length} {t('cities').toLowerCase()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge color={o.active !== false ? 'emerald' : 'slate'}>{o.active !== false ? t('activeF') : t('inactiveF')}</Badge>
              <button type="button" className="admin-btn-icon" onClick={() => openEditOblast(o)}>{t('edit')}</button>
              <button type="button" className="admin-btn-icon text-red-400" onClick={() => removeOblast(o.id)}><Trash2 className="w-4 h-4" /></button>
              <button type="button" className="admin-btn-icon" onClick={() => setExpanded((e) => ({ ...e, [o.id]: !e[o.id] }))}>
                {expanded[o.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {expanded[o.id] && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold">{t('cities')}</span>
                <button type="button" className="text-xs text-sky-400" onClick={() => openAddCity(o.id)}>+ {t('addCity')}</button>
              </div>
              <ul className="space-y-2">
                {cities.filter((c) => c.oblastId === o.id).map((c) => (
                  <li key={c.id} className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/5 text-sm">
                    <span>
                      {label(c)}
                      {c.franchiseId && (
                        <span className="text-xs text-slate-500 ml-2">
                          → {store.franchises.find((f) => f.id === c.franchiseId)?.name || c.franchiseId}
                        </span>
                      )}
                    </span>
                    <div className="flex gap-1">
                      <button type="button" className="text-xs text-sky-400" onClick={() => openEditCity(c)}>{t('edit')}</button>
                      <button type="button" className="text-xs text-red-400" onClick={() => removeCity(c.id)}>{t('delete')}</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}

      <Modal open={!!oblastModal} onClose={() => { setOblastModal(null); setFormError('') }} title={oblastModal === 'new' ? t('addOblast') : t('edit')}>
        <div className="space-y-3 text-sm">
          <LocalizedNameFields names={oblastForm.names} onChange={(names) => setOblastForm({ ...oblastForm, names })} />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={oblastForm.active} onChange={(e) => setOblastForm({ ...oblastForm, active: e.target.checked })} />
            {t('activeF')}
          </label>
          {formError && <p className="text-xs text-red-400">{formError}</p>}
          <FormActions onSave={saveOblast} onCancel={() => { setOblastModal(null); setFormError('') }} />
        </div>
      </Modal>

      <Modal open={!!cityModal} onClose={() => { setCityModal(null); setFormError('') }} title={cityModal?.cityId === 'new' ? t('addCity') : t('city')}>
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="text-xs text-slate-300 font-medium">{t('oblast')}</span>
            <select className="admin-input mt-1" value={cityForm.oblastId} onChange={(e) => setCityForm({ ...cityForm, oblastId: e.target.value })}>
              <option value="">{t('selectOblast')}</option>
              {oblasts.map((o) => <option key={o.id} value={o.id}>{label(o)}</option>)}
            </select>
          </label>
          <LocalizedNameFields names={cityForm.names} onChange={(names) => setCityForm({ ...cityForm, names })} />
          <label className="block">
            <span className="text-xs text-slate-300 font-medium">{t('franchise')}</span>
            <select className="admin-input mt-1" value={cityForm.franchiseId} onChange={(e) => setCityForm({ ...cityForm, franchiseId: e.target.value })}>
              <option value="">{t('dash')}</option>
              {store.franchises.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={cityForm.active} onChange={(e) => setCityForm({ ...cityForm, active: e.target.checked })} />
            {t('activeF')}
          </label>
          {formError && <p className="text-xs text-red-400">{formError}</p>}
          <FormActions onSave={saveCity} onCancel={() => { setCityModal(null); setFormError('') }} />
        </div>
      </Modal>
    </div>
  )
}
