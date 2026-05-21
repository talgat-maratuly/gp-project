import { useState } from 'react'
import { Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useAccess } from '../context/AccessContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { ACTIONS } from '../lib/permissions'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import FormActions from '../components/FormActions'
import { formatMoney } from '../lib/format'

export default function ServicesPage() {
  const { scoped, effectiveFranchiseId, can } = useAccess()
  const { user } = useAuth()
  const { addService, updateService, removeService, addSubservice, updateSubservice, removeSubservice } = useStore()
  const { t } = useLanguage()
  const [expanded, setExpanded] = useState({})
  const [svcModal, setSvcModal] = useState(null)
  const [subModal, setSubModal] = useState(null)
  const [form, setForm] = useState({ name: '', basePrice: 0, gpCommission: 0, active: true })
  const [subForm, setSubForm] = useState({ name: '', price: 0, gpCommission: 0 })

  const franchiseId = effectiveFranchiseId || user.franchiseId

  const openAddService = () => {
    setSvcModal('new')
    setForm({ name: '', basePrice: 10000, gpCommission: 500, active: true })
  }

  const saveService = () => {
    if (svcModal === 'new') {
      addService({ ...form, franchiseId, subservices: [] })
    } else {
      updateService(svcModal, form)
    }
    setSvcModal(null)
  }

  const saveSub = () => {
    if (!subModal) return
    if (subModal.subId === 'new') {
      addSubservice(subModal.serviceId, subForm)
    } else {
      updateSubservice(subModal.serviceId, subModal.subId, subForm)
    }
    setSubModal(null)
  }

  if (!can(ACTIONS.SERVICE_CRUD)) return <p className="text-slate-500">{t('noAccess')}</p>

  return (
    <div className="space-y-4">
      <button type="button" onClick={openAddService} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-sm font-semibold">
        <Plus className="w-4 h-4" /> {t('addService')}
      </button>
      {scoped.services.map((s) => (
        <div key={s.id} className="admin-card">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-bold">{s.name}</h3>
              <p className="text-xs text-slate-500">{formatMoney(s.basePrice)} · GP {formatMoney(s.gpCommission)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge color={s.active ? 'emerald' : 'slate'}>{s.active ? t('activeF') : t('inactiveF')}</Badge>
              <button type="button" className="admin-btn-icon" onClick={() => { setSvcModal(s.id); setForm({ name: s.name, basePrice: s.basePrice, gpCommission: s.gpCommission, active: s.active }) }}>{t('edit')}</button>
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
                <button type="button" className="text-xs text-sky-400" onClick={() => { setSubModal({ serviceId: s.id, subId: 'new' }); setSubForm({ name: '', price: s.basePrice, gpCommission: s.gpCommission }) }}>
                  + {t('addSubservice')}
                </button>
              </div>
              <ul className="space-y-2">
                {(s.subservices || []).map((sub) => (
                  <li key={sub.id} className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/5 text-sm">
                    <span>{sub.name} — {formatMoney(sub.price)}</span>
                    <div className="flex gap-1">
                      <button type="button" className="text-xs text-sky-400" onClick={() => { setSubModal({ serviceId: s.id, subId: sub.id }); setSubForm({ name: sub.name, price: sub.price, gpCommission: sub.gpCommission }) }}>{t('edit')}</button>
                      <button type="button" className="text-xs text-red-400" onClick={() => removeSubservice(s.id, sub.id)}>{t('delete')}</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}

      <Modal open={!!svcModal} onClose={() => setSvcModal(null)} title={svcModal === 'new' ? t('addService') : t('edit')}>
        <div className="space-y-3 text-sm">
          <label className="block"><span className="text-xs text-slate-500">{t('name')}</span><input className="admin-input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="block"><span className="text-xs text-slate-500">{t('basePrice')}</span><input type="number" className="admin-input mt-1" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: +e.target.value })} /></label>
          <label className="block"><span className="text-xs text-slate-500">{t('gpCommission')}</span><input type="number" className="admin-input mt-1" value={form.gpCommission} onChange={(e) => setForm({ ...form, gpCommission: +e.target.value })} /></label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />{t('serviceActive')}</label>
          <FormActions onSave={saveService} onCancel={() => setSvcModal(null)} />
        </div>
      </Modal>

      <Modal open={!!subModal} onClose={() => setSubModal(null)} title={t('subservice')}>
        <div className="space-y-3 text-sm">
          <label className="block"><span className="text-xs text-slate-500">{t('subserviceName')}</span><input className="admin-input mt-1" value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} /></label>
          <label className="block"><span className="text-xs text-slate-500">{t('price')}</span><input type="number" className="admin-input mt-1" value={subForm.price} onChange={(e) => setSubForm({ ...subForm, price: +e.target.value })} /></label>
          <label className="block"><span className="text-xs text-slate-500">{t('gpCommission')}</span><input type="number" className="admin-input mt-1" value={subForm.gpCommission} onChange={(e) => setSubForm({ ...subForm, gpCommission: +e.target.value })} /></label>
          <FormActions onSave={saveSub} onCancel={() => setSubModal(null)} />
        </div>
      </Modal>
    </div>
  )
}
