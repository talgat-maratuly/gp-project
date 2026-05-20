import { Navigation } from 'lucide-react'
import { usePartner } from '../context/PartnerContext'
import { formatPrice } from '@gp/shared/utils'
import { getOrderCategoryLabel, getOrderStatusLabel } from '@gp/shared/constants'

const STATUS_FLOW = {
  accepted: { next: 'on_way', label: 'В пути' },
  on_way: { next: 'done', label: 'Выполнено' },
}

export default function MyOrdersPage() {
  const { myOrders, updateOrderStatus } = usePartner()

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Мои заказы</h1>
      <ul className="space-y-3">
        {myOrders.map((o) => {
          const flow = STATUS_FLOW[o.status]
          return (
            <li key={o.id} className="partner-card p-4">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-emerald-500/80 font-bold uppercase">{getOrderCategoryLabel(o.category)}</span>
                <span className="text-slate-500">{getOrderStatusLabel(o.status)}</span>
              </div>
              <p className="font-bold">{o.id}</p>
              <p className="text-sm">{o.serviceName || `Магазин · ${o.items?.length || 0} поз.`}</p>
              <p className="text-sm text-slate-400">{o.clientName} · {o.address}</p>
              <p className="text-emerald-400 font-bold mt-1">{formatPrice(o.total)}</p>
              {flow && (
                <button
                  type="button"
                  onClick={() => updateOrderStatus(o.id, flow.next)}
                  className="mt-3 flex items-center justify-center gap-1 w-full py-2.5 rounded-xl partner-gradient font-semibold text-sm"
                >
                  {o.status === 'accepted' && <Navigation className="w-4 h-4" />}
                  {flow.label}
                </button>
              )}
            </li>
          )
        })}
        {!myOrders.length && <p className="text-slate-500">Пока нет активных заказов</p>}
      </ul>
    </div>
  )
}
