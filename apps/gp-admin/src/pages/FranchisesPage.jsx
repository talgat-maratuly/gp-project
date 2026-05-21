import { useState } from 'react'
import { Plus, Eye, Pencil, Ban } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useAccess } from '../context/AccessContext'
import { useLanguage } from '../i18n/LanguageContext'
import { ACTIONS } from '../lib/permissions'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import FormActions from '../components/FormActions'
import { formatMoney } from '../lib/format'
import { franchiseStats } from '../lib/permissions'

const STATUS_COLORS = { ACTIVE: 'emerald', INACTIVE: 'slate', BLOCKED: 'red' }

export default function FranchisesPage() {
  const { store, addFranchise, updateFranchise, removeFranchise } = useStore()
  const { can } = useAccess()
  const { t } = useLanguage()
  const [viewId, setViewId] = useState(null)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', city: '', ownerName: '', phone: '', status: 'ACTIVE' })

  const openCreate = () => {
    setEditId('new')
    setForm({ name: '', city: '', ownerName: '', phone: '', status: 'ACTIVE' })
  }

  const openEdit = (f) => {
    setEditId(f.id)
    setForm({ name: f.name, city: f.city, ownerName: f.ownerName, phone: f.phone, status: f.status })
  }

  const save = () => {
    if (editId === 'new') addFranchise(form)
    else updateFranchise(editId, form)
    setEditId(null)
  }

  const viewed = viewId ? store.franchises.find((f) => f.id === viewId) : null
  const stats = viewed ? franchiseStats(store, viewed.id) : null

  if (!can(ACTIONS.FRANCHISE_CREATE)) {
    return <p className="text-slate-500">{t('noAccess')}</p>
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-sm font-semibold">
        <Plus className="w-4 h-4" /> {t('addFranchise')}
      </button>
      <div className="admin-table-wrap overflow-x-auto">
        <table className="admin-table min-w-[900px]">
          <thead>
            <tr>
              <th>{t('franchiseName')}</th>
              <th>{t('city')}</th>
              <th>{t('owner')}</th>
              <th>{t('phone')}</th>
              <th>{t('status')}</th>
              <th>{t('clients')}</th>
              <th>{t('partners')}</th>
              <th>{t('orders')}</th>
              <th>{t('turnover')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {store.franchises.map((f) => {
              const st = franchiseStats(store, f.id)
              return (
                <tr key={f.id}>
                  <td className="font-medium">{f.name}</td>
                  <td>{f.city}</td>
                  <td>{f.ownerName}</td>
                  <td>{f.phone}</td>
                  <td><Badge color={STATUS_COLORS[f.status]}>{t(`franchise_${f.status}`)}</Badge></td>
                  <td>{st.clients}</td>
                  <td>{st.partners}</td>
                  <td>{st.orders}</td>
                  <td>{formatMoney(st.turnover)}</td>
                  <td>
                    <div className="flex gap-1">
                      <button type="button" className="admin-btn-icon" onClick={() => setViewId(f.id)}><Eye className="w-4 h-4" /></button>
                      <button type="button" className="admin-btn-icon" onClick={() => openEdit(f)}><Pencil className="w-4 h-4" /></button>
                      <button type="button" className="admin-btn-icon" onClick={() => updateFranchise(f.id, { status: f.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED' })}><Ban className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal open={!!viewed} onClose={() => setViewId(null)} title={viewed?.name} wide>
        {viewed && stats && (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-slate-500">{t('city')}</dt><dd>{viewed.city}</dd></div>
            <div><dt className="text-slate-500">{t('owner')}</dt><dd>{viewed.ownerName}</dd></div>
            <div><dt className="text-slate-500">{t('clients')}</dt><dd>{stats.clients}</dd></div>
            <div><dt className="text-slate-500">{t('partners')}</dt><dd>{stats.partners}</dd></div>
            <div><dt className="text-slate-500">{t('orders')}</dt><dd>{stats.orders}</dd></div>
            <div><dt className="text-slate-500">{t('turnover')}</dt><dd>{formatMoney(stats.turnover)}</dd></div>
          </dl>
        )}
      </Modal>

      <Modal open={!!editId} onClose={() => setEditId(null)} title={editId === 'new' ? t('addFranchise') : t('edit')}>
        <div className="space-y-3 text-sm">
          {['name', 'city', 'ownerName', 'phone'].map((key) => (
            <label key={key} className="block">
              <span className="text-xs text-slate-500">{t(key === 'ownerName' ? 'owner' : key === 'name' ? 'franchiseName' : key)}</span>
              <input className="admin-input mt-1" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </label>
          ))}
          <label className="block">
            <span className="text-xs text-slate-500">{t('status')}</span>
            <select className="admin-input mt-1" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {['ACTIVE', 'INACTIVE', 'BLOCKED'].map((s) => (
                <option key={s} value={s}>{t(`franchise_${s}`)}</option>
              ))}
            </select>
          </label>
          <FormActions onSave={save} onCancel={() => setEditId(null)} />
          {editId !== 'new' && (
            <button type="button" className="w-full text-red-400 text-sm border border-red-500/30 rounded-xl py-2" onClick={() => { if (confirm(t('delete') + '?')) { removeFranchise(editId); setEditId(null) } }}>
              {t('delete')}
            </button>
          )}
        </div>
      </Modal>
    </div>
  )
}
