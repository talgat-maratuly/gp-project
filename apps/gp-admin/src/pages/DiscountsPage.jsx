import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useAccess } from '../context/AccessContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { ACTIONS } from '../lib/permissions'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import FormActions from '../components/FormActions'

export default function DiscountsPage() {
  const { scoped, effectiveFranchiseId } = useAccess()
  const { user } = useAuth()
  const { store, addDiscount, updateDiscount, removeDiscount } = useStore()
  const { can } = useAccess()
  const { t } = useLanguage()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', type: 'PERCENT', value: 10, clientId: '', active: true, startsAt: '2026-01-01', endsAt: '2026-12-31' })

  const franchiseId = effectiveFranchiseId || user.franchiseId

  const save = () => {
    const payload = { ...form, franchiseId, clientId: form.clientId || null, value: Number(form.value) }
    if (modal === 'new') addDiscount(payload)
    else updateDiscount(modal, payload)
    setModal(null)
  }

  if (!can(ACTIONS.DISCOUNT_CRUD)) return <p className="text-slate-500">{t('noAccess')}</p>

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => { setModal('new'); setForm({ name: '', type: 'PERCENT', value: 10, clientId: '', active: true, startsAt: '2026-01-01', endsAt: '2026-12-31' }) }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-sm font-semibold">
        <Plus className="w-4 h-4" /> {t('addDiscount')}
      </button>
      {scoped.discounts.map((d) => (
        <div key={d.id} className="admin-card flex flex-wrap justify-between gap-2">
          <div>
            <p className="font-bold">{d.name}</p>
            <p className="text-xs text-slate-500">{t(`discount_${d.type}`)} · {d.value}{d.type === 'PERCENT' ? '%' : '₸'} · {d.startsAt} — {d.endsAt}</p>
            {d.clientId && <p className="text-xs text-sky-400">{t('personalDiscount')}: {store.clients.find((c) => c.id === d.clientId)?.name}</p>}
          </div>
          <div className="flex gap-2 items-center">
            <Badge color={d.active ? 'emerald' : 'slate'}>{d.active ? t('activeF') : t('inactiveF')}</Badge>
            <button type="button" className="text-sm text-sky-400" onClick={() => { setModal(d.id); setForm({ ...d, clientId: d.clientId || '' }) }}>{t('edit')}</button>
            <button type="button" className="text-sm text-red-400" onClick={() => removeDiscount(d.id)}>{t('delete')}</button>
          </div>
        </div>
      ))}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? t('addDiscount') : t('edit')}>
        <div className="space-y-3 text-sm">
          <label className="block"><span className="text-xs text-slate-500">{t('discountName')}</span><input className="admin-input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="block"><span className="text-xs text-slate-500">{t('discountType')}</span>
            <select className="admin-input mt-1" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {['PERCENT', 'FIXED', 'FREE_ORDER'].map((ty) => <option key={ty} value={ty}>{t(`discount_${ty}`)}</option>)}
            </select>
          </label>
          <label className="block"><span className="text-xs text-slate-500">{t('discountValue')}</span><input type="number" className="admin-input mt-1" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></label>
          <label className="block"><span className="text-xs text-slate-500">{t('selectClient')}</span>
            <select className="admin-input mt-1" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              <option value="">{t('all')}</option>
              {scoped.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block"><span className="text-xs text-slate-500">{t('startsAt')}</span><input type="date" className="admin-input mt-1" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></label>
          <label className="block"><span className="text-xs text-slate-500">{t('endsAt')}</span><input type="date" className="admin-input mt-1" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />{t('activeF')}</label>
          <FormActions onSave={save} onCancel={() => setModal(null)} />
        </div>
      </Modal>
    </div>
  )
}
