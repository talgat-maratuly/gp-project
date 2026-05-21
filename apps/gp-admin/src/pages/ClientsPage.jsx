import { useState } from 'react'
import { Plus, Pencil, Trash2, History } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useAccess } from '../context/AccessContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { ACTIONS } from '../lib/permissions'
import Modal from '../components/ui/Modal'
import FormActions from '../components/FormActions'
import { formatMoney } from '../lib/format'
import { CLIENT_TYPES } from '../data/seedData'

export default function ClientsPage() {
  const { scoped, effectiveFranchiseId } = useAccess()
  const { user } = useAuth()
  const { store, addClient, updateClient, removeClient } = useStore()
  const { can } = useAccess()
  const { t } = useLanguage()
  const [modal, setModal] = useState(null)
  const [historyId, setHistoryId] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', type: 'house', gpIdBonus: 0, freeFifthOrder: false, discountPercent: 0 })

  const franchiseId = effectiveFranchiseId || user.franchiseId

  const openNew = () => {
    const fr = store.franchises.find((f) => f.id === franchiseId)
    setModal('new')
    setForm({ name: '', phone: '', address: '', city: fr?.city || '', type: 'house', gpIdBonus: 0, freeFifthOrder: false, discountPercent: 0 })
  }

  const save = () => {
    if (modal === 'new') addClient({ ...form, franchiseId, gpIdBonus: Number(form.gpIdBonus), discountPercent: Number(form.discountPercent) })
    else updateClient(modal, { ...form, gpIdBonus: Number(form.gpIdBonus), discountPercent: Number(form.discountPercent) })
    setModal(null)
  }

  const clientHistory = historyId ? scoped.orders.filter((o) => o.clientId === historyId) : []

  return (
    <div className="space-y-4">
      {can(ACTIONS.CLIENT_CRUD) && (
        <button type="button" onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-sm font-semibold">
          <Plus className="w-4 h-4" /> {t('addClient')}
        </button>
      )}
      <div className="admin-table-wrap overflow-x-auto">
        <table className="admin-table min-w-[900px]">
          <thead>
            <tr>
              <th>{t('name')}</th>
              <th>{t('phone')}</th>
              <th>{t('city')}</th>
              <th>{t('clientType')}</th>
              <th>{t('ordersCount')}</th>
              <th>{t('ordersTotal')}</th>
              <th>{t('bonuses')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {scoped.clients.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.name}{c.freeFifthOrder ? ' 🎁' : ''}</td>
                <td>{c.phone}</td>
                <td>{c.city}</td>
                <td>{t(`clientType_${c.type}`)}</td>
                <td>{c.orderIds?.length ?? 0}</td>
                <td>{formatMoney(c.totalSpent)}</td>
                <td>{c.gpIdBonus} ({c.discountPercent}%)</td>
                <td>
                  <div className="flex gap-1">
                    <button type="button" className="admin-btn-icon" onClick={() => setHistoryId(c.id)}><History className="w-4 h-4" /></button>
                    {can(ACTIONS.CLIENT_CRUD) && (
                      <>
                        <button type="button" className="admin-btn-icon" onClick={() => { setModal(c.id); setForm({ ...c }) }}><Pencil className="w-4 h-4" /></button>
                        <button type="button" className="admin-btn-icon text-red-400" onClick={() => removeClient(c.id)}><Trash2 className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? t('addClient') : t('edit')}>
        <div className="space-y-3 text-sm">
          {['name', 'phone', 'address', 'city'].map((k) => (
            <label key={k} className="block"><span className="text-xs text-slate-500">{t(k)}</span><input className="admin-input mt-1" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></label>
          ))}
          <label className="block"><span className="text-xs text-slate-500">{t('clientType')}</span>
            <select className="admin-input mt-1" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {CLIENT_TYPES.map((ty) => <option key={ty} value={ty}>{t(`clientType_${ty}`)}</option>)}
            </select>
          </label>
          <label className="block"><span className="text-xs text-slate-500">{t('bonuses')}</span><input type="number" className="admin-input mt-1" value={form.gpIdBonus} onChange={(e) => setForm({ ...form, gpIdBonus: e.target.value })} /></label>
          <label className="block"><span className="text-xs text-slate-500">{t('personalDiscount')} %</span><input type="number" className="admin-input mt-1" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} /></label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.freeFifthOrder} onChange={(e) => setForm({ ...form, freeFifthOrder: e.target.checked })} />{t('freeFifthOrder')}</label>
          <FormActions onSave={save} onCancel={() => setModal(null)} />
        </div>
      </Modal>

      <Modal open={!!historyId} onClose={() => setHistoryId(null)} title={t('orderHistory')} wide>
        <ul className="text-sm space-y-2">
          {clientHistory.map((o) => (
            <li key={o.id} className="px-3 py-2 rounded-lg bg-white/5">{o.id} · {o.serviceName} · {formatMoney(o.amount)} · {o.status}</li>
          ))}
          {!clientHistory.length && <li className="text-slate-500">{t('dash')}</li>}
        </ul>
      </Modal>
    </div>
  )
}
