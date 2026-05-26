import { useState } from 'react'
import { Eye, UserPlus, RefreshCw, Pencil } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useAccess } from '../context/AccessContext'
import { useLanguage, useOrderStatusLabel } from '../i18n/LanguageContext'
import { ACTIONS } from '../lib/permissions'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import AdminEmptyState from '../components/ui/AdminEmptyState'
import FormActions from '../components/FormActions'
import { formatMoney, formatDate } from '../lib/format'

const STATUS_COLORS = { new: 'sky', assigned: 'violet', in_progress: 'amber', in_work: 'orange', completed: 'emerald', cancelled: 'slate', problem: 'red' }

export default function OrdersPage() {
  const { scoped } = useAccess()
  const { orderStatuses, updateOrder, assignPartner } = useStore()
  const { can } = useAccess()
  const { t } = useLanguage()
  const statusLabel = useOrderStatusLabel()
  const [viewId, setViewId] = useState(null)
  const [assignId, setAssignId] = useState(null)
  const [statusId, setStatusId] = useState(null)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({})
  const [actionError, setActionError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const order = viewId ? scoped.orders.find((o) => o.id === viewId) : null
  const assignOrder = assignId ? scoped.orders.find((o) => o.id === assignId) : null
  const statusOrder = statusId ? scoped.orders.find((o) => o.id === statusId) : null
  const editOrder = editId ? scoped.orders.find((o) => o.id === editId) : null

  const openEdit = (o) => {
    setEditId(o.id)
    setForm({
      address: o.address,
      city: o.city,
      scheduledAt: o.scheduledAt?.slice(0, 10),
      serviceId: o.serviceId,
      subserviceId: o.subserviceId || '',
      amount: o.amount,
      note: o.note || '',
      clientId: o.clientId,
    })
  }

  const saveEdit = () => {
    const svc = scoped.services.find((s) => s.id === form.serviceId)
    const sub = svc?.subservices?.find((x) => x.id === form.subserviceId)
    updateOrder(editId, {
      ...form,
      amount: Number(form.amount),
      subserviceId: form.subserviceId || null,
      subserviceName: sub?.name || null,
      serviceName: svc?.name,
    })
    setEditId(null)
  }

  const franchisePartners = (franchiseId) => scoped.partners.filter((p) => p.franchiseId === franchiseId && p.active && !p.blocked)

  return (
    <div className="space-y-4">
      <div className="admin-table-wrap overflow-x-auto">
        <table className="admin-table min-w-[1000px]">
          <thead>
            <tr>
              <th>ID</th>
              <th>{t('client')}</th>
              <th>{t('city')}</th>
              <th>{t('service')}</th>
              <th>{t('date')}</th>
              <th>{t('status')}</th>
              <th>{t('partner')}</th>
              <th>{t('amount')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {!scoped.orders.length ? (
              <tr><td colSpan={9}><AdminEmptyState /></td></tr>
            ) : scoped.orders.map((o) => (
              <tr key={o.id}>
                <td className="font-mono text-xs">{o.id}</td>
                <td>{o.clientName}</td>
                <td>{o.city}</td>
                <td>{o.serviceName}{o.subserviceName ? ` / ${o.subserviceName}` : ''}</td>
                <td>{formatDate(o.scheduledAt)}</td>
                <td><Badge color={STATUS_COLORS[o.status]}>{statusLabel(o.status)}</Badge></td>
                <td>{o.partnerName || t('dash')}</td>
                <td>{formatMoney(o.amount)}</td>
                <td>
                  <div className="flex gap-1">
                    <button type="button" className="admin-btn-icon" onClick={() => setViewId(o.id)}><Eye className="w-4 h-4" /></button>
                    {can(ACTIONS.ORDER_EDIT) && (
                      <>
                        <button type="button" className="admin-btn-icon" onClick={() => openEdit(o)}><Pencil className="w-4 h-4" /></button>
                        <button type="button" className="admin-btn-icon" onClick={() => setAssignId(o.id)}><UserPlus className="w-4 h-4" /></button>
                        <button type="button" className="admin-btn-icon" onClick={() => setStatusId(o.id)}><RefreshCw className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!order} onClose={() => setViewId(null)} title={`${t('order')} ${order?.id}`} wide>
        {order && (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-slate-500">{t('client')}</dt><dd>{order.clientName}</dd></div>
            <div><dt className="text-slate-500">{t('phone')}</dt><dd>{order.clientPhone}</dd></div>
            <div className="col-span-2"><dt className="text-slate-500">{t('address')}</dt><dd>{order.address}</dd></div>
            <div><dt className="text-slate-500">{t('service')}</dt><dd>{order.serviceName}</dd></div>
            <div><dt className="text-slate-500">{t('amount')}</dt><dd>{formatMoney(order.amount)}</dd></div>
            <div><dt className="text-slate-500">{t('preferredServiceDate')}</dt><dd>{formatDate(order.scheduledAt)}</dd></div>
            {order.createdAt && (
              <div><dt className="text-slate-500">{t('submittedAt')}</dt><dd className="text-slate-400">{formatDate(order.createdAt)}</dd></div>
            )}
            {order.note && <div className="col-span-2"><dt className="text-slate-500">{t('comment')}</dt><dd>{order.note}</dd></div>}
          </dl>
        )}
      </Modal>

      <Modal open={!!editOrder} onClose={() => setEditId(null)} title={t('edit')} wide>
        {editOrder && (
          <div className="space-y-3 text-sm grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block sm:col-span-2"><span className="text-xs text-slate-500">{t('address')}</span><input className="admin-input mt-1" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
            <label className="block"><span className="text-xs text-slate-500">{t('city')}</span><input className="admin-input mt-1" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
            <label className="block"><span className="text-xs text-slate-500">{t('preferredServiceDate')}</span><input type="date" className="admin-input mt-1" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} /></label>
            <label className="block"><span className="text-xs text-slate-500">{t('service')}</span>
              <select className="admin-input mt-1" value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value, subserviceId: '' })}>
                {scoped.services.filter((s) => s.franchiseId === editOrder.franchiseId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-xs text-slate-500">{t('subservice')}</span>
              <select className="admin-input mt-1" value={form.subserviceId} onChange={(e) => setForm({ ...form, subserviceId: e.target.value })}>
                <option value="">{t('dash')}</option>
                {(scoped.services.find((s) => s.id === form.serviceId)?.subservices || []).map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </label>
            <label className="block"><span className="text-xs text-slate-500">{t('amount')}</span><input type="number" className="admin-input mt-1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
            <label className="block sm:col-span-2"><span className="text-xs text-slate-500">{t('comment')}</span><textarea className="admin-input mt-1" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
            <div className="sm:col-span-2"><FormActions onSave={saveEdit} onCancel={() => setEditId(null)} /></div>
          </div>
        )}
      </Modal>

      <Modal open={!!assignOrder} onClose={() => { setAssignId(null); setActionError('') }} title={t('assignPartner')}>
        {actionError && <p className="text-sm text-red-400 mb-2">{actionError}</p>}
        {assignOrder && !franchisePartners(assignOrder.franchiseId).length && (
          <AdminEmptyState messageKey="noData" />
        )}
        {assignOrder && franchisePartners(assignOrder.franchiseId).map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={actionLoading}
            className="w-full text-left px-4 py-3 min-h-[44px] rounded-xl border border-white/10 hover:bg-sky-500/10 mb-2 disabled:opacity-50"
            onClick={async () => {
              setActionLoading(true)
              setActionError('')
              try {
                await assignPartner(assignOrder.id, p.id)
                setAssignId(null)
              } catch (e) {
                setActionError(e?.message || t('assignError'))
              } finally {
                setActionLoading(false)
              }
            }}
          >
            <span className="font-semibold">{p.company || p.name}</span>
          </button>
        ))}
      </Modal>

      <Modal open={!!statusOrder} onClose={() => { setStatusId(null); setActionError('') }} title={t('changeStatus')}>
        {actionError && <p className="text-sm text-red-400 mb-2">{actionError}</p>}
        {statusOrder && (
          <div className="grid grid-cols-2 gap-2">
            {orderStatuses.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={actionLoading}
                className={`px-3 py-2 min-h-[44px] rounded-xl border text-sm disabled:opacity-50 ${statusOrder.status === s.id ? 'border-sky-500 bg-sky-500/20' : 'border-white/10'}`}
                onClick={async () => {
                  setActionLoading(true)
                  setActionError('')
                  try {
                    await updateOrder(statusOrder.id, { status: s.id })
                    setStatusId(null)
                  } catch (e) {
                    setActionError(e?.message || t('statusChangeError'))
                  } finally {
                    setActionLoading(false)
                  }
                }}
              >
                {statusLabel(s.id)}
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
