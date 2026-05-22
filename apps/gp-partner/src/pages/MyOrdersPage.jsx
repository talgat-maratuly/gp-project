import { useState } from 'react'
import { AsyncState } from '@gp/shared/ui/AsyncState'
import { usePartner } from '../context/PartnerContext'
import { useLanguage, useOrderStatusLabel } from '../i18n'
import * as demoApi from '../lib/demoApi'
import { formatPrice } from '@gp/shared/utils'

const FLOW = [
  { from: 'accepted', to: 'en_route', key: 'partner_en_route' },
  { from: 'en_route', to: 'in_work', key: 'partner_in_work' },
  { from: 'in_work', to: 'completed', key: 'partner_completed' },
]

export default function MyOrdersPage() {
  const { myOrders, ordersLoading, ordersError, updateOrderStatus, isDemoMode, refreshAll } = usePartner()
  const { t } = useLanguage()
  const statusLabel = useOrderStatusLabel()
  const [filter, setFilter] = useState('all')
  const [comment, setComment] = useState({})

  const filtered = myOrders.filter((o) => filter === 'all' || o.status === filter)

  const saveComment = async (orderId) => {
    if (!isDemoMode) return
    await demoApi.demoPatchOrder(orderId, { partnerComment: comment[orderId] || '' })
    await refreshAll()
  }

  const addPhoto = async (orderId, type) => {
    if (!isDemoMode) return
    const o = myOrders.find((x) => x.id === orderId)
    const url = `demo-${type}-${Date.now()}.jpg`
    const patch =
      type === 'before'
        ? { photosBefore: [...(o?.photosBefore || []), url], partnerComment: comment[orderId] || '' }
        : { photosAfter: [...(o?.photosAfter || []), url], partnerComment: comment[orderId] || '' }
    await demoApi.demoPatchOrder(orderId, patch)
    await refreshAll()
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">{t('myOrders')}</h1>
      <AsyncState
        loading={ordersLoading && !myOrders.length}
        error={ordersError}
        empty={!ordersLoading && !ordersError && !filtered.length}
        emptyMessage={t('orders_empty')}
        onRetry={refreshAll}
      >
      <div className="flex flex-wrap gap-2 mb-4">
        {['all', 'accepted', 'en_route', 'in_work', 'completed'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs border ${filter === st ? 'border-emerald-500 bg-emerald-500/20' : 'border-white/10'}`}
          >
            {st === 'all' ? t('all') : t(`status_${st}`) || statusLabel(st)}
          </button>
        ))}
      </div>
      <ul className="space-y-3">
        {filtered.map((o) => {
          const step = FLOW.find((f) => f.from === o.status)
          return (
            <li key={o.id} className="partner-card p-4">
              <p className="font-bold">{o.serviceName}</p>
              <p className="text-sm text-slate-400">{o.clientName} · {o.city}</p>
              <p className="text-emerald-400 font-bold mt-1">{formatPrice(o.total)}</p>
              <p className="text-xs text-slate-500 mt-1">{t('status')}: {statusLabel(o.status === 'completed' ? 'completed' : o.status === 'en_route' ? 'in_progress' : o.status === 'accepted' ? 'assigned' : o.status)}</p>
              {step && (
                <button type="button" onClick={() => updateOrderStatus(o.id, step.to)} className="mt-3 w-full py-2.5 rounded-xl partner-gradient font-semibold text-sm">
                  {t(step.key)}
                </button>
              )}
              <textarea
                className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"
                placeholder={t('comment')}
                value={comment[o.id] || o.partnerComment || ''}
                onChange={(e) => setComment((c) => ({ ...c, [o.id]: e.target.value }))}
                onBlur={() => saveComment(o.id)}
              />
              <div className="flex gap-2 mt-2">
                <button type="button" className="text-xs text-sky-400" onClick={() => addPhoto(o.id, 'before')}>{t('photoBefore')}</button>
                <button type="button" className="text-xs text-sky-400" onClick={() => addPhoto(o.id, 'after')}>{t('photoAfter')}</button>
              </div>
            </li>
          )
        })}
      </ul>
      </AsyncState>
    </div>
  )
}
