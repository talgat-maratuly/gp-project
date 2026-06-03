import { useState } from 'react'
import { Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useAccess } from '../context/AccessContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { EMPTY_NAMES, hasAllLocalizedNames, normalizeNames, resolveLocalizedName, withLocalizedName } from '@gp/shared/i18n'
import { ACTIONS } from '../lib/permissions'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import FormActions from '../components/FormActions'
import LocalizedNameFields from '../components/LocalizedNameFields'
import { formatMoney } from '../lib/format'

const emptyServiceForm = () => ({
  names: { ...EMPTY_NAMES },
  basePrice: 10000,
  gpCommission: 500,
  active: true,
})

const emptySubForm = (serviceId = '') => ({
  serviceId,
  names: { ...EMPTY_NAMES },
  price: 0,
  gpCommission: 0,
})

export default function ServicesPage() {
  const { scoped, effectiveFranchiseId, can } = useAccess()
  const { user } = useAuth()
  const { addService, updateService, removeService, addSubservice, updateSubservice, removeSubservice } = useStore()
  const { t, lang } = useLanguage()
  const [expanded, setExpanded] = useState({})
  const [svcModal, setSvcModal] = useState(null)
  const [subModal, setSubModal] = useState(null)
  const [form, setForm] = useState(emptyServiceForm())
  const [subForm, setSubForm] = useState(emptySubForm())
  const [formError, setFormError] = useState('')

  const franchiseId = effectiveFranchiseId || user.franchiseId
  const hasServices = scoped.services.length > 0
  const label = (entity) => resolveLocalizedName(entity, lang)

  const openAddService = () => {
    setFormError('')
    setSvcModal('new')
    setForm(emptyServiceForm())
  }

  const openEditService = (service) => {
    setFormError('')
    setSvcModal(service.id)
    setForm({
      names: normalizeNames(service),
      basePrice: service.basePrice,
      gpCommission: service.gpCommission,
      active: service.active,
    })
  }

  const openAddSubservice = (presetServiceId = '') => {
    const serviceId = presetServiceId || scoped.services[0]?.id || ''
    const svc = scoped.services.find((s) => s.id === serviceId)
    setFormError('')
    setSubModal({ serviceId, subId: 'new' })
    setSubForm({
      ...emptySubForm(serviceId),
      price: svc?.basePrice ?? 0,
      gpCommission: svc?.gpCommission ?? 0,
    })
  }

  const openEditSubservice = (serviceId, sub) => {
    setFormError('')
    setSubModal({ serviceId, subId: sub.id })
    setSubForm({
      serviceId,
      names: normalizeNames(sub),
      price: sub.price,
      gpCommission: sub.gpCommission,
    })
  }

  const onSubserviceParentChange = (serviceId) => {
    const svc = scoped.services.find((s) => s.id === serviceId)
    setSubForm((prev) => ({
      ...prev,
      serviceId,
      price: svc?.basePrice ?? prev.price,
      gpCommission: svc?.gpCommission ?? prev.gpCommission,
    }))
  }

  const saveService = () => {
    if (!hasAllLocalizedNames(form.names)) {
      setFormError(t('namesRequired'))
      return
    }
    const payload = withLocalizedName({
      names: form.names,
      basePrice: form.basePrice,
      gpCommission: form.gpCommission,
      active: form.active,
    })
    if (svcModal === 'new') {
      addService({ ...payload, franchiseId, subservices: [] })
    } else {
      updateService(svcModal, payload)
    }
    setSvcModal(null)
    setFormError('')
  }

  const saveSub = () => {
    if (!subModal || !hasAllLocalizedNames(subForm.names)) {
      setFormError(t('namesRequired'))
      return
    }
    const payload = withLocalizedName({
      names: subForm.names,
      price: subForm.price,
      gpCommission: subForm.gpCommission,
    })
    if (subModal.subId === 'new') {
      if (!subForm.serviceId) return
      addSubservice(subForm.serviceId, payload)
    } else {
      updateSubservice(subModal.serviceId, subModal.subId, payload)
    }
    setSubModal(null)
    setFormError('')
  }

  if (!can(ACTIONS.SERVICE_CRUD)) return <p className="text-slate-500">{t('noAccess')}</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={openAddService} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-sm font-semibold">
          <Plus className="w-4 h-4" /> {t('addService')}
        </button>
        <button
          type="button"
          disabled={!hasServices}
          onClick={() => openAddSubservice()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          title={!hasServices ? t('selectService') : undefined}
        >
          <Plus className="w-4 h-4" /> {t('addSubservice')}
        </button>
      </div>
      {scoped.services.map((s) => (
        <div key={s.id} className="admin-card">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-bold">{label(s)}</h3>
              <p className="text-xs text-slate-500">{formatMoney(s.basePrice)} · GP {formatMoney(s.gpCommission)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge color={s.active ? 'emerald' : 'slate'}>{s.active ? t('activeF') : t('inactiveF')}</Badge>
              <button type="button" className="admin-btn-icon" onClick={() => openEditService(s)}>{t('edit')}</button>
              <button type="button" className="admin-btn-icon text-red-400" onClick={() => removeService(s.id)}><Trash2 className="w-4 h-4" /></button>
              <button type="button" className="admin-btn-icon" onClick={() => setExpanded((e) => ({ ...e, [s.id]: !e[s.id] }))}>
                {expanded[s.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {expanded[s.id] && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold">{t('subservices')}</span>
                <button type="button" className="text-xs text-sky-400" onClick={() => openAddSubservice(s.id)}>
                  + {t('addSubservice')}
                </button>
              </div>
              <ul className="space-y-2">
                {(s.subservices || []).map((sub) => (
                  <li key={sub.id} className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/5 text-sm">
                    <span>{label(sub)} — {formatMoney(sub.price)}</span>
                    <div className="flex gap-1">
                      <button type="button" className="text-xs text-sky-400" onClick={() => openEditSubservice(s.id, sub)}>{t('edit')}</button>
                      <button type="button" className="text-xs text-red-400" onClick={() => removeSubservice(s.id, sub.id)}>{t('delete')}</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}

      <Modal open={!!svcModal} onClose={() => { setSvcModal(null); setFormError('') }} title={svcModal === 'new' ? t('addService') : t('edit')}>
        <div className="space-y-3 text-sm">
          <LocalizedNameFields names={form.names} onChange={(names) => setForm({ ...form, names })} />
          <label className="block"><span className="text-xs text-slate-300 font-medium">{t('basePrice')}</span><input type="number" className="admin-input mt-1" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: +e.target.value })} /></label>
          <label className="block"><span className="text-xs text-slate-300 font-medium">{t('gpCommission')}</span><input type="number" className="admin-input mt-1" value={form.gpCommission} onChange={(e) => setForm({ ...form, gpCommission: +e.target.value })} /></label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />{t('serviceActive')}</label>
          {formError && <p className="text-xs text-red-400">{formError}</p>}
          <FormActions onSave={saveService} onCancel={() => { setSvcModal(null); setFormError('') }} />
        </div>
      </Modal>

      <Modal open={!!subModal} onClose={() => { setSubModal(null); setFormError('') }} title={subModal?.subId === 'new' ? t('addSubservice') : t('subservice')}>
        <div className="space-y-3 text-sm">
          {subModal?.subId === 'new' ? (
            <label className="block">
              <span className="text-xs text-slate-300 font-medium">{t('service')}</span>
              <select
                className="admin-input mt-1"
                value={subForm.serviceId}
                onChange={(e) => onSubserviceParentChange(e.target.value)}
              >
                <option value="">{t('selectService')}</option>
                {scoped.services.map((s) => (
                  <option key={s.id} value={s.id}>{label(s)}</option>
                ))}
              </select>
            </label>
          ) : (
            <p className="text-xs text-slate-400">
              {t('service')}: {label(scoped.services.find((s) => s.id === subModal?.serviceId)) || '—'}
            </p>
          )}
          <LocalizedNameFields names={subForm.names} onChange={(names) => setSubForm({ ...subForm, names })} />
          <label className="block"><span className="text-xs text-slate-300 font-medium">{t('price')}</span><input type="number" className="admin-input mt-1" value={subForm.price} onChange={(e) => setSubForm({ ...subForm, price: +e.target.value })} /></label>
          <label className="block"><span className="text-xs text-slate-300 font-medium">{t('gpCommission')}</span><input type="number" className="admin-input mt-1" value={subForm.gpCommission} onChange={(e) => setSubForm({ ...subForm, gpCommission: +e.target.value })} /></label>
          {formError && <p className="text-xs text-red-400">{formError}</p>}
          <FormActions onSave={saveSub} onCancel={() => { setSubModal(null); setFormError('') }} />
        </div>
      </Modal>
    </div>
  )
}
