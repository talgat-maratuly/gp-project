import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  loadGlobalStore,
  syncFromHub,
  qrOrdersForPartner,
  updateQrServiceOrder,
  subscribeGlobalStore,
} from '@gp/shared/demo'
import { QR_SERVICE_TYPE_LABELS, QR_ORDER_STATUS_LABELS } from '@gp/shared/constants'
import { usePartner } from '../context/PartnerContext'
import { formatPrice } from '@gp/shared/utils'

const FLOW = {
  new: 'accepted',
  assigned: 'accepted',
  accepted: 'on_the_way',
  on_the_way: 'in_progress',
  in_progress: 'completed',
}

const FILTER_MAP = {
  '/orders/filter-replacement': 'filter_replacement',
  '/orders/equipment-service': ['irrigation_service', 'equipment_repair'],
}

export default function QrOrdersPage() {
  const { pathname } = useLocation()
  const { user, isDemoMode, notify } = usePartner()
  const [list, setList] = useState([])

  const load = async () => {
    if (!isDemoMode || !user?.partnerId) return
    await syncFromHub()
    const store = loadGlobalStore()
    let orders = qrOrdersForPartner(user.partnerId, user.franchiseId)
    const filter = FILTER_MAP[pathname]
    if (filter) {
      if (Array.isArray(filter)) {
        orders = orders.filter((o) => filter.includes(o.serviceType))
      } else {
        orders = orders.filter((o) => o.serviceType === filter)
      }
    }
    const objects = store.qrCodeObjects || []
    setList(
      orders.map((o) => ({
        ...o,
        object: objects.find((x) => x.id === o.qrCodeObjectId),
      })),
    )
  }

  useEffect(() => {
    load()
    const unsub = subscribeGlobalStore(() => load())
    const iv = setInterval(load, 4000)
    return () => {
      unsub()
      clearInterval(iv)
    }
  }, [user?.partnerId, pathname, isDemoMode])

  const advance = (orderId, status) => {
    const next = FLOW[status]
    if (!next) return
    updateQrServiceOrder(orderId, { status: next })
    notify('Статус обновлён')
    load()
  }

  const cancel = (orderId) => {
    updateQrServiceOrder(orderId, { status: 'cancelled' })
    notify('Заявка отменена')
    load()
  }

  const title =
    pathname.includes('filter-replacement')
      ? 'QR: замена фильтра'
      : pathname.includes('equipment-service')
        ? 'QR: обслуживание оборудования'
        : 'QR-заявки'

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">{title}</h1>
      <ul className="space-y-3">
        {list.map((o) => (
          <li key={o.id} className="partner-card p-4 space-y-2">
            <p className="font-bold">{o.object?.title || o.qrCode}</p>
            <p className="text-sm partner-muted">{QR_SERVICE_TYPE_LABELS[o.serviceType]}</p>
            <p className="text-sm">{o.clientName} · <a href={`tel:${o.phone}`} className="text-emerald-600 font-semibold">{o.phone}</a></p>
            <p className="text-xs partner-muted">{o.address}</p>
            {o.comment && <p className="text-xs italic">{o.comment}</p>}
            <p className="text-xs">Статус: {QR_ORDER_STATUS_LABELS[o.status] || o.status} · {formatPrice(o.totalPrice)}</p>
            {o.object?.lastServiceDate && (
              <p className="text-[10px] partner-muted">Посл. обслуживание: {o.object.lastServiceDate}</p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              {FLOW[o.status] && (
                <button type="button" className="flex-1 py-2 rounded-xl partner-gradient text-white text-sm font-semibold" onClick={() => advance(o.id, o.status)}>
                  {o.status === 'accepted' ? 'Выехал' : o.status === 'on_the_way' ? 'В работе' : o.status === 'in_progress' ? 'Выполнено' : 'Принять'}
                </button>
              )}
              {o.status !== 'completed' && o.status !== 'cancelled' && (
                <button type="button" className="px-3 py-2 rounded-xl border border-red-500/30 text-red-500 text-xs font-semibold" onClick={() => cancel(o.id)}>
                  Отказаться
                </button>
              )}
            </div>
          </li>
        ))}
        {!list.length && <p className="partner-muted text-sm">Нет QR-заявок</p>}
      </ul>
    </div>
  )
}
