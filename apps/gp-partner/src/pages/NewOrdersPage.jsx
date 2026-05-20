import { useState } from 'react'
import { usePartner } from '../context/PartnerContext'
import { formatPrice } from '@gp/shared/utils'
import { ORDER_CATEGORIES, getOrderCategoryLabel, getOrderStatusLabel } from '@gp/shared/constants'

export default function NewOrdersPage() {
  const { newOrders, acceptOrder, ordersLoading } = usePartner()
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? newOrders : newOrders.filter((o) => o.category === filter)

  return (
    <div>
      <h1 className="text-xl font-bold mb-2">Новые заявки</h1>
      <p className="text-xs text-slate-500 mb-3">От клиентов GP Service</p>

      <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-hide">
        <button type="button" onClick={() => setFilter('all')} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${filter === 'all' ? 'partner-gradient text-white' : 'bg-white/5 text-slate-400'}`}>
          Все
        </button>
        {ORDER_CATEGORIES.map((c) => (
          <button key={c.id} type="button" onClick={() => setFilter(c.id)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${filter === c.id ? 'partner-gradient text-white' : 'bg-white/5 text-slate-400'}`}>
            {c.label}
          </button>
        ))}
      </div>

      {ordersLoading && !newOrders.length ? (
        <p className="text-slate-500 text-sm">Загрузка…</p>
      ) : !filtered.length ? (
        <p className="text-slate-500">Нет новых заявок</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => (
            <li key={o.id} className="partner-card p-4">
              <div className="flex justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-500/80">
                  {getOrderCategoryLabel(o.category)}
                </span>
                <span className="text-[10px] text-slate-500">{getOrderStatusLabel(o.status)}</span>
              </div>
              <p className="font-bold">{o.serviceName || (o.items?.length ? `Заказ · ${o.items.length} поз.` : o.id)}</p>
              <p className="text-sm text-slate-400">{o.clientName} · {o.clientPhone}</p>
              <p className="text-sm text-slate-500">{o.address || '—'}</p>
              {o.type === 'shop' && o.items?.length > 0 && (
                <ul className="text-xs text-slate-500 mt-2 space-y-0.5">
                  {o.items.map((i) => (
                    <li key={i.productId}>{i.name} ×{i.qty}</li>
                  ))}
                </ul>
              )}
              <p className="text-emerald-400 font-bold mt-2">{formatPrice(o.total)}</p>
              <button type="button" onClick={() => acceptOrder(o.id)} className="mt-3 w-full py-2.5 rounded-xl partner-gradient font-semibold text-sm">
                Принять заявку
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
