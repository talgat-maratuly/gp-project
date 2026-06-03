import { useMemo, useState } from 'react'
import { Eye, UserPlus, RefreshCw, Pencil } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useAccess } from '../context/AccessContext'
import { useLanguage, useOrderStatusLabel } from '../i18n/LanguageContext'
import { resolveLocalizedName } from '@gp/shared/i18n'
import { inferCitySelection } from '@gp/shared/geography'
import CitySelector from '@gp/shared/components/CitySelector'
import { ACTIONS } from '../lib/permissions'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import AdminEmptyState from '../components/ui/AdminEmptyState'
import FormActions from '../components/FormActions'
import PageHeader from '../components/PageHeader'
import { formatMoney, formatDate } from '../lib/format'

const STATUS_COLORS = { new: 'sky', assigned: 'violet', in_progress: 'amber', in_work: 'orange', completed: 'emerald', cancelled: 'slate', problem: 'red' }

const ORDER_TABS = [
  { id: 'new', labelKey: 'orders_tab_new', statuses: ['new'], emptyKey: 'orders_empty_new' },
  { id: 'accepted', labelKey: 'orders_tab_accepted', statuses: ['assigned'], emptyKey: 'orders_empty_accepted' },
  { id: 'in_work', labelKey: 'orders_tab_in_work', statuses: ['in_progress', 'in_work'], emptyKey: 'orders_empty_in_work' },
  { id: 'completed', labelKey: 'orders_tab_completed', statuses: ['completed'], emptyKey: 'orders_empty_completed' },
  { id: 'rejected', labelKey: 'orders_tab_rejected', statuses: ['cancelled'], emptyKey: 'orders_empty_rejected' },
]

export default function OrdersPage() {
  const { scoped } = useAccess()
  const { orderStatuses, updateOrder, assignPartner, store } = useStore()
  const { can } = useAccess()
  const { t, lang } = useLanguage()
  const statusLabel = useOrderStatusLabel()
  const [tab, setTab] = useState('new')
  const [viewId, setViewId] = useState(null)
  const [assignId, setAssignId] = useState(null)
  const [statusId, setStatusId] = useState(null)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({})
  const [actionError, setActionError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const currentTab = ORDER_TABS.find((x) => x.id === tab) || ORDER_TABS[0]
  const filteredOrders = useMemo(
    () => scoped.orders.filter((o) => currentTab.statuses.includes(o.status)),
    [scoped.orders, currentTab.statuses],
  )

  const order = viewId ? scoped.orders.find((o) => o.id === viewId) : null
  const assignOrder = assignId ? scoped.orders.find((o) => o.id === assignId) : null
  const statusOrder = statusId ? scoped.orders.find((o) => o.id === statusId) : null
  const editOrder = editId ? scoped.orders.find((o) => o.id === editId) : null

  const openEdit = (o) => {
    const geo = inferCitySelection(store, {
      city: o.city,
      cityId: o.cityId,
      oblastId: o.oblastId,
      franchiseId: o.franchiseId,
    }, lang)
    setEditId(o.id)
    setForm({
      address: o.address,
      city: geo.city || o.city,
      cityId: geo.cityId || '',
      oblastId: geo.oblastId || '',
      franchiseId: geo.franchiseId || o.franchiseId || null,
      scheduledAt: o.scheduledAt?.slice(0, 10) || '',
      rescheduleReason: '',
      amount: o.amount,
      amountChangeReason: '',
      note: o.note || '',
    })
  }

  const saveEdit = async () => {
    if (!editOrder) return
    if (!form.cityId) {
      setActionError(t('selectCity'))
      return
    }
    const patch = {
      address: form.address,
      city: form.city,
      cityId: form.cityId,
      oblastId: form.oblastId,
      franchiseId: form.franchiseId || editOrder.franchiseId,
      note: form.note,
    }
    if (form.scheduledAt && form.scheduledAt !== editOrder.scheduledAt?.slice(0, 10)) {
      if (!form.rescheduleReason?.trim() || form.rescheduleReason.trim().length < 3) {
        setActionError(t('rescheduleReasonRequired'))
        return
      }
      patch.scheduledAt = form.scheduledAt
      patch.rescheduleReason = form.rescheduleReason.trim()
      patch.rescheduleLog = [
        ...(editOrder.rescheduleLog || []),
        { at: Date.now(), from: editOrder.scheduledAt, to: form.scheduledAt, reason: form.rescheduleReason.trim() },
      ]
    }
    const amountNum = Number(form.amount)
    if (amountNum !== editOrder.amount) {
      if (editOrder.status !== 'new') {
        if (!form.amountChangeReason?.trim() || form.amountChangeReason.trim().length < 3) {
          setActionError(t('amountChangeReasonRequired'))
          return
        }
        patch.amountChangeReason = form.amountChangeReason.trim()
      }
      patch.amount = amountNum
    }
    setActionLoading(true)
    setActionError('')
    try {
      await updateOrder(editId, patch)
      setEditId(null)
    } catch (e) {
      setActionError(e?.message || t('actionError'))
    } finally {
      setActionLoading(false)
    }
  }

  const franchisePartners = (franchiseId) => scoped.partners.filter((p) => p.franchiseId === franchiseId && p.active && !p.blocked)

  return (
    <div className="space-y-4">
      <PageHeader title={t('nav_orders')} description={t('orders_page_desc')} />

      <div className="flex flex-wrap gap-2">
        {ORDER_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              tab === item.id ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {t(item.labelKey)}
            <span className="ml-1.5 text-xs opacity-70">
              ({scoped.orders.filter((o) => item.statuses.includes(o.status)).length})
            </span>
          </button>
        ))}
      </div>

      <div className="admin-table-wrap overflow-x-auto">
        <table className="admin-table min-w-[1000px]">
          <thead>
            <tr>
              <th>{t('orderId')}</th>
              <th>{t('client')}</th>
              <th>{t('city')}</th>
              <th>{t('service')}</th>
              <th>{t('preferredServiceDate')}</th>
              <th>{t('status')}</th>
              <th>{t('partner')}</th>
              <th>{t('amount')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {!filteredOrders.length ? (
              <tr><td colSpan={9}><AdminEmptyState messageKey={currentTab.emptyKey} /></td></tr>
            ) : filteredOrders.map((o) => (
              <tr
                key={o.id}
                className="cursor-pointer hover:bg-slate-800/40"
                onClick={() => setViewId(o.id)}
              >
                <td className="font-mono text-xs">{o.id}</td>
                <td>{o.clientName}</td>
                <td>{o.city}</td>
                <td>{o.serviceName}{o.subserviceName ? ` / ${o.subserviceName}` : ''}</td>
                <td>{formatDate(o.scheduledAt)}</td>
                <td><Badge color={STATUS_COLORS[o.status]}>{statusLabel(o.status)}</Badge></td>
                <td>{o.partnerName || t('dash')}</td>
                <td>{formatMoney(o.amount)}</td>
                <td>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="admin-btn-icon" title={t('open')} onClick={() => setViewId(o.id)}><Eye className="w-4 h-4" /></button>
                    {can(ACTIONS.ORDER_EDIT) && (
                      <>
                        <button type="button" className="admin-btn-icon" title={t('edit')} onClick={() => openEdit(o)}><Pencil className="w-4 h-4" /></button>
                        <button type="button" className="admin-btn-icon" title={t('assignPartner')} onClick={() => setAssignId(o.id)}><UserPlus className="w-4 h-4" /></button>
                        <button type="button" className="admin-btn-icon" title={t('changeStatus')} onClick={() => setStatusId(o.id)}><RefreshCw className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!order} onClose={() => setViewId(null)} title={`${t('clientOrder')} ${order?.id}`} wide>
        {order && (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-slate-500">{t('orderId')}</dt><dd className="font-mono text-xs">{order.id}</dd></div>
            <div><dt className="text-slate-500">{t('client')}</dt><dd>{order.clientName}</dd></div>
            <div><dt className="text-slate-500">{t('phone')}</dt><dd>{order.clientPhone}</dd></div>
            <div><dt className="text-slate-500">{t('status')}</dt><dd><Badge color={STATUS_COLORS[order.status]}>{statusLabel(order.status)}</Badge></dd></div>
            <div className="col-span-2"><dt className="text-slate-500">{t('address')}</dt><dd>{order.address}</dd></div>
            <div><dt className="text-slate-500">{t('service')}</dt><dd>{order.serviceName}</dd></div>
            <div><dt className="text-slate-500">{t('amount')}</dt><dd>{formatMoney(order.amount)}</dd></div>
            <div><dt className="text-slate-500">{t('preferredServiceDate')}</dt><dd>{formatDate(order.scheduledAt)}</dd></div>
            {order.createdAt && (
              <div><dt className="text-slate-500">{t('submittedAt')}</dt><dd className="text-slate-400" title={t('systemFieldReadonly')}>{formatDate(order.createdAt)}</dd></div>
            )}
            {order.note && <div className="col-span-2"><dt className="text-slate-500">{t('comment')}</dt><dd>{order.note}</dd></div>}
            {order.rescheduleLog?.length > 0 && (
              <div className="col-span-2">
                <dt className="text-slate-500 mb-1">{t('rescheduleHistory')}</dt>
                <ul className="text-xs text-slate-400 space-y-1">
                  {order.rescheduleLog.map((r, i) => (
                    <li key={i}>{formatDate(r.from)} → {formatDate(r.to)}: {r.reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </dl>
        )}
      </Modal>

      <Modal open={!!editOrder} onClose={() => { setEditId(null); setActionError('') }} title={t('edit')} wide>
        {editOrder && (
          <div className="space-y-3 text-sm">
            {actionError && <p className="text-sm text-red-400">{actionError}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-slate-950/50 border border-white/5">
              <div><span className="text-xs text-slate-500">{t('orderId')}</span><p className="font-mono text-xs mt-1">{editOrder.id}</p></div>
              <div><span className="text-xs text-slate-500">{t('client')}</span><p className="mt-1">{editOrder.clientName}</p></div>
              <div><span className="text-xs text-slate-500">{t('submittedAt')}</span><p className="mt-1 text-slate-400">{formatDate(editOrder.createdAt)}</p></div>
              <div><span className="text-xs text-slate-500">{t('service')}</span><p className="mt-1">{editOrder.serviceName}</p></div>
            </div>
            <p className="text-xs text-slate-500">{t('systemFieldReadonly')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block sm:col-span-2"><span className="text-xs text-slate-500">{t('address')}</span><input className="admin-input mt-1" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
              <div className="sm:col-span-2">
                <CitySelector
                  store={store}
                  value={{ oblastId: form.oblastId, cityId: form.cityId }}
                  inputClassName="admin-input mt-1 w-full"
                  onChange={(sel) => setForm((f) => ({
                    ...f,
                    oblastId: sel.oblastId,
                    cityId: sel.cityId,
                    city: sel.city || f.city,
                    franchiseId: sel.franchiseId || f.franchiseId,
                  }))}
                />
              </div>
              <label className="block"><span className="text-xs text-slate-500">{t('rescheduleDate')}</span><input type="date" className="admin-input mt-1" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} /></label>
              <label className="block sm:col-span-2"><span className="text-xs text-slate-500">{t('rescheduleReason')}</span><input className="admin-input mt-1" placeholder={t('rescheduleReasonHint')} value={form.rescheduleReason} onChange={(e) => setForm({ ...form, rescheduleReason: e.target.value })} /></label>
              <label className="block"><span className="text-xs text-slate-500">{t('amount')}</span><input type="number" className="admin-input mt-1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} disabled={!can(ACTIONS.ORDER_EDIT)} /></label>
              {editOrder.status !== 'new' && Number(form.amount) !== editOrder.amount && (
                <label className="block sm:col-span-2"><span className="text-xs text-slate-500">{t('amountChangeReason')}</span><input className="admin-input mt-1" value={form.amountChangeReason} onChange={(e) => setForm({ ...form, amountChangeReason: e.target.value })} /></label>
              )}
              <label className="block sm:col-span-2"><span className="text-xs text-slate-500">{t('comment')}</span><textarea className="admin-input mt-1" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
            </div>
            <FormActions onSave={saveEdit} onCancel={() => setEditId(null)} disabled={actionLoading} />
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
