import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, Package, RefreshCw, Wrench, Pencil, X } from 'lucide-react'
import { formatDate, formatPrice } from '@gp/shared/utils'
import { useLanguage, useOrderStatusLabel } from '../../i18n'
import { useService } from '../../context/ServiceContext'
import { AsyncState } from '@gp/shared/ui/AsyncState'
import { KaspiButton, KaspiCard, SkeletonBlock } from '@gp/shared/ui/KaspiUI'

export default function OrdersPage() {
  const { t } = useLanguage()
  const statusLabel = useOrderStatusLabel()
  const {
    allOrders, refreshOrders, isLoggedIn, ordersLoading, ordersError, notify,
    isDemoMode, cancelOrder, updateClientOrder,
  } = useService()
  const [params, setParams] = useSearchParams()
  const [success, setSuccess] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({ address: '', note: '' })

  useEffect(() => {
    const id = params.get('success')
    if (id) {
      setSuccess(id)
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  useEffect(() => {
    if (!isLoggedIn) return
    refreshOrders()
    const iv = setInterval(refreshOrders, isDemoMode ? 3000 : 6000)
    return () => clearInterval(iv)
  }, [isLoggedIn, refreshOrders, isDemoMode])

  const pullRefresh = async () => {
    setRefreshing(true)
    await refreshOrders()
    setRefreshing(false)
  }

  const openEdit = (o) => {
    setEditId(o.id)
    setEditForm({ address: o.address || '', note: o.note || '' })
  }

  const saveEdit = async () => {
    try {
      await updateClientOrder(editId, editForm)
      setEditId(null)
    } catch (e) {
      notify(e.message, 'error')
    }
  }

  return (
    <div className="px-4 py-4 gp-animate-in">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-extrabold">{t('orders_title')}</h1>
        <button
          type="button"
          onClick={pullRefresh}
          className="p-3 rounded-2xl bg-[var(--gp-surface)] border border-[var(--gp-border)] shadow-sm"
          aria-label={t('refresh')}
        >
          <RefreshCw className={`w-5 h-5 ${refreshing || ordersLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {success && (
        <KaspiCard className="!p-4 mb-4 flex gap-3 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20">
          <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium">{t('order_created')}: <strong>{success}</strong></p>
        </KaspiCard>
      )}

      {!isLoggedIn ? (
        <KaspiCard className="!p-6 text-center">
          <p className="text-[var(--gp-text-muted)] mb-4">{t('orders_login_prompt')}</p>
          <Link to="/login" className="inline-block w-full">
            <KaspiButton>{t('login')}</KaspiButton>
          </Link>
        </KaspiCard>
      ) : (
        <AsyncState
          loading={ordersLoading && !allOrders.length}
          error={ordersError}
          empty={!ordersLoading && !ordersError && !allOrders.length}
          emptyMessage={t('orders_empty')}
          onRetry={pullRefresh}
        >
        <ul className="space-y-3">
          {allOrders.map((o) => {
            const open = expanded === o.id
            const st = o.rawStatus || o.status
            return (
              <li key={o.id}>
                <KaspiCard className="!p-0 overflow-hidden">
                  <button type="button" className="w-full p-4 text-left" onClick={() => setExpanded(open ? null : o.id)}>
                    <div className="flex justify-between mb-2">
                      <span className="font-bold flex items-center gap-2 text-sm">
                        {o.kind === 'shop' ? <Package className="w-4 h-4" /> : <Wrench className="w-4 h-4 text-emerald-600" />}
                        {o.city}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--gp-surface-2)] font-bold">
                        {o.kind === 'market'
                          ? t(`market_status_${st}`)
                          : statusLabel(
                            st === 'done' ? 'completed'
                            : st === 'accepted' ? 'assigned'
                            : st === 'on_way' ? 'in_progress'
                            : st === 'in_work' ? 'in_work'
                            : st,
                          )}
                      </span>
                    </div>
                    <p className="font-extrabold">{o.serviceName || o.id}</p>
                    <p className="text-lg font-extrabold gp-text-gradient mt-2">{formatPrice(o.total)}</p>
                    <p className="text-xs text-[var(--gp-text-muted)] mt-1">{formatDate(o.createdAt)}</p>
                  </button>
                  {open && (
                    <div className="px-4 pb-4 border-t border-[var(--gp-border)] pt-4 space-y-2">
                      <p className="text-sm">{o.address}</p>
                      {o.partnerName && <p className="text-xs text-[var(--gp-text-muted)]">{t('partner')}: {o.partnerName}</p>}
                      {isDemoMode && o.canEdit && (
                        <button type="button" className="flex items-center gap-2 text-sm text-sky-600 font-semibold" onClick={() => openEdit(o)}>
                          <Pencil className="w-4 h-4" /> {t('editOrder')}
                        </button>
                      )}
                      {isDemoMode && o.canCancel && st === 'new' && (
                        <button
                          type="button"
                          className="flex items-center gap-2 text-sm text-red-600 font-semibold"
                          onClick={() => cancelOrder(o.id)}
                        >
                          <X className="w-4 h-4" /> {t('cancelOrder')}
                        </button>
                      )}
                    </div>
                  )}
                </KaspiCard>
              </li>
            )
          })}
        </ul>
        </AsyncState>
      )}

      {editId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--gp-surface)] p-5 space-y-3">
            <h3 className="font-bold">{t('editOrder')}</h3>
            <label className="block text-sm">
              <span className="text-xs text-[var(--gp-text-muted)]">{t('address')}</span>
              <input className="w-full mt-1 rounded-xl border px-3 py-2" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="text-xs text-[var(--gp-text-muted)]">{t('comment')}</span>
              <textarea className="w-full mt-1 rounded-xl border px-3 py-2" rows={2} value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} />
            </label>
            <div className="flex gap-2">
              <KaspiButton className="flex-1" onClick={saveEdit}>{t('save')}</KaspiButton>
              <button type="button" className="px-4 py-2 rounded-xl border" onClick={() => setEditId(null)}>{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
