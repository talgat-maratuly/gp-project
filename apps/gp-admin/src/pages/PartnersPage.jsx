import { useState } from 'react'
import { Plus, Pencil, Trash2, Ban } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useAccess } from '../context/AccessContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { ACTIONS } from '../lib/permissions'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import AdminEmptyState from '../components/ui/AdminEmptyState'
import FormActions from '../components/FormActions'
import { formatMoney } from '../lib/format'

export default function PartnersPage() {
  const { scoped, effectiveFranchiseId } = useAccess()
  const { user } = useAuth()
  const { addPartner, updatePartner, removePartner } = useStore()
  const { can } = useAccess()
  const { t } = useLanguage()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', company: '', phone: '', city: '', serviceIds: [], active: true, rating: 5 })

  const franchiseId = effectiveFranchiseId || user.franchiseId
  const franchiseServices = scoped.services

  const save = () => {
    const payload = { ...form, franchiseId, serviceIds: form.serviceIds }
    if (modal === 'new') addPartner(payload)
    else updatePartner(modal, payload)
    setModal(null)
  }

  const toggleService = (sid) => {
    setForm((f) => ({
      ...f,
      serviceIds: f.serviceIds.includes(sid) ? f.serviceIds.filter((x) => x !== sid) : [...f.serviceIds, sid],
    }))
  }

  return (
    <div className="space-y-4">
      {can(ACTIONS.PARTNER_CRUD) && (
        <button type="button" onClick={() => { setModal('new'); setForm({ name: '', company: '', phone: '', city: scoped.orders[0]?.city || '', serviceIds: [], active: true, rating: 5 }) }} className="admin-btn-primary">
          <Plus className="w-4 h-4" /> {t('addPartner')}
        </button>
      )}
      <div className="admin-table-wrap overflow-x-auto">
        <table className="admin-table min-w-[900px]">
          <thead>
            <tr>
              <th>{t('companyOrName')}</th>
              <th>{t('phone')}</th>
              <th>{t('city')}</th>
              <th>{t('status')}</th>
              <th>{t('rating')}</th>
              <th>{t('completedCount')}</th>
              <th>{t('earnings')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {!scoped.partners.length ? (
              <tr><td colSpan={8}><AdminEmptyState /></td></tr>
            ) : scoped.partners.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">{p.company || p.name}</td>
                <td>{p.phone}</td>
                <td>{p.city}</td>
                <td><Badge color={p.blocked ? 'red' : p.active ? 'emerald' : 'slate'}>{p.blocked ? t('blocked') : p.active ? t('active') : t('inactive')}</Badge></td>
                <td>★ {p.rating}</td>
                <td>{p.completedOrders}</td>
                <td>{formatMoney(p.earnings)}</td>
                <td>
                  {can(ACTIONS.PARTNER_CRUD) && (
                    <div className="flex gap-1">
                      <button type="button" className="admin-btn-icon" onClick={() => { setModal(p.id); setForm({ ...p, serviceIds: p.serviceIds || [] }) }}><Pencil className="w-4 h-4" /></button>
                      <button type="button" className="admin-btn-icon" onClick={() => updatePartner(p.id, { blocked: !p.blocked })}><Ban className="w-4 h-4" /></button>
                      <button type="button" className="admin-btn-icon text-red-400" onClick={() => removePartner(p.id)}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? t('addPartner') : t('edit')} wide>
        <div className="space-y-3 text-sm">
          {['name', 'company', 'phone', 'city'].map((k) => (
            <label key={k} className="block"><span className="text-xs text-slate-500">{t(k === 'company' ? 'companyOrName' : k)}</span><input className="admin-input mt-1" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></label>
          ))}
          <div>
            <span className="text-xs text-slate-500">{t('assignServices')}</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {franchiseServices.map((s) => (
                <button key={s.id} type="button" onClick={() => toggleService(s.id)} className={`px-2 py-1 rounded-lg text-xs border ${form.serviceIds?.includes(s.id) ? 'border-sky-500 bg-sky-500/20' : 'border-white/10'}`}>{s.name}</button>
              ))}
            </div>
          </div>
          <FormActions onSave={save} onCancel={() => setModal(null)} />
        </div>
      </Modal>
    </div>
  )
}
