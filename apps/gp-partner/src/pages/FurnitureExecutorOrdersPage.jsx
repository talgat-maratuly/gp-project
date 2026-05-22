import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  FURNITURE_EXECUTOR_LABELS,
  FURNITURE_EXECUTOR_TYPES,
  GP_INTERNAL_EXECUTOR_NAME,
  QR_ORDER_STATUS_LABELS,
} from '@gp/shared/constants'
import {
  acceptFurnitureExecutorOrder,
  advanceFurnitureExecutorOrder,
  cancelFurnitureExecutorOrder,
  furnitureExecutorOrdersForPartner,
  subscribeGlobalStore,
  syncFromHub,
} from '@gp/shared/demo'
import { api } from '@gp/shared/api'
import { usePartner } from '../context/PartnerContext'
import { formatPrice } from '@gp/shared/utils'

const ROUTE_TYPE = {
  '/orders/furniture-manufacturing': 'furniture_manufacturing',
  '/orders/furniture-assembly': 'furniture_assembly',
  '/orders/furniture-repair': 'furniture_repair',
}

const FLOW = {
  new: 'accepted',
  assigned: 'accepted',
  accepted: 'on_the_way',
  on_the_way: 'in_progress',
  in_progress: 'completed',
}

const ACTION_LABEL = {
  new: 'Принять',
  assigned: 'Принять',
  accepted: 'Выехал',
  on_the_way: 'В работе',
  in_progress: 'Выполнено',
}

export default function FurnitureExecutorOrdersPage() {
  const { pathname } = useLocation()
  const { user, isDemoMode, notify } = usePartner()
  const serviceType = ROUTE_TYPE[pathname]
  const [list, setList] = useState([])

  const load = async () => {
    if (!user?.partnerId) return
    if (isDemoMode) {
      await syncFromHub()
      const access = user.serviceAccess || []
      setList(furnitureExecutorOrdersForPartner(user.partnerId, user.franchiseId, access).filter((o) => o.serviceType === serviceType))
      return
    }
    try {
      const rows = await api.getFurnitureExecutorOrders(serviceType)
      setList(rows)
    } catch (e) {
      notify(e.message || 'Не удалось загрузить заявки')
    }
  }

  useEffect(() => {
    load()
    if (isDemoMode) {
      const unsub = subscribeGlobalStore(() => load())
      const iv = setInterval(load, 4000)
      return () => {
        unsub()
        clearInterval(iv)
      }
    }
    const iv = setInterval(load, 8000)
    return () => clearInterval(iv)
  }, [user?.partnerId, pathname, isDemoMode])

  const accept = async (orderId) => {
    if (isDemoMode) {
      acceptFurnitureExecutorOrder(orderId, user.partnerId)
      notify('Заявка принята')
      load()
      return
    }
    await api.acceptFurnitureExecutorOrder(orderId)
    notify('Заявка принята')
    load()
  }

  const advance = async (orderId, status) => {
    const next = FLOW[status]
    if (!next) return
    if (isDemoMode) {
      advanceFurnitureExecutorOrder(orderId, status)
      notify('Статус обновлён')
      load()
      return
    }
    await api.updateFurnitureExecutorOrderStatus(orderId, next)
    notify('Статус обновлён')
    load()
  }

  const decline = async (orderId) => {
    if (isDemoMode) {
      cancelFurnitureExecutorOrder(orderId)
      notify('Отказ от заявки')
      load()
      return
    }
    await api.declineFurnitureExecutorOrder(orderId)
    notify('Отказ от заявки')
    load()
  }

  const title = FURNITURE_EXECUTOR_LABELS[serviceType] || 'Мебельные исполнители'
  const hasAccess = (user?.serviceAccess || []).includes(serviceType) || isDemoMode

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">{title}</h1>
      <p className="text-xs partner-muted mb-4">Мебельные исполнители · {FURNITURE_EXECUTOR_TYPES.includes(serviceType) ? serviceType : ''}</p>
      {!hasAccess && (
        <p className="text-sm text-amber-600 mb-3">
          Добавьте направление «{title}» в профиле (serviceAccess).
        </p>
      )}
      <ul className="space-y-3">
        {list.map((o) => {
          const isMine = o.assignedPartnerId === user?.partnerId
          const canAccept = !o.assignedPartnerId && ['new', 'assigned'].includes(o.status)
          const nextLabel = ACTION_LABEL[o.status]
          return (
            <li key={o.id} className="partner-card p-4 space-y-2">
              <p className="font-bold">{o.clientName}</p>
              <p className="text-sm partner-muted">{FURNITURE_EXECUTOR_LABELS[o.serviceType]}</p>
              <p className="text-sm">
                <a href={`tel:${o.phone}`} className="text-emerald-600 font-semibold">{o.phone}</a>
              </p>
              <p className="text-xs partner-muted">{o.address}</p>
              {o.comment && <p className="text-xs italic">{o.comment}</p>}
              {o.executorInternal && !isMine && (
                <p className="text-[10px] font-semibold text-slate-500">{GP_INTERNAL_EXECUTOR_NAME}</p>
              )}
              <p className="text-xs">
                Статус: {QR_ORDER_STATUS_LABELS[o.status] || o.status} · {formatPrice(o.totalPrice)}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {canAccept && hasAccess && (
                  <button type="button" className="flex-1 py-2 rounded-xl partner-gradient text-white text-sm font-semibold" onClick={() => accept(o.id)}>
                    Принять
                  </button>
                )}
                {isMine && FLOW[o.status] && (
                  <button type="button" className="flex-1 py-2 rounded-xl partner-gradient text-white text-sm font-semibold" onClick={() => advance(o.id, o.status)}>
                    {nextLabel}
                  </button>
                )}
                {o.status !== 'completed' && o.status !== 'cancelled' && isMine && (
                  <button type="button" className="px-3 py-2 rounded-xl border border-red-500/30 text-red-500 text-xs font-semibold" onClick={() => decline(o.id)}>
                    Отказаться
                  </button>
                )}
              </div>
            </li>
          )
        })}
        {!list.length && <p className="partner-muted text-sm">Нет заявок по этому направлению</p>}
      </ul>
    </div>
  )
}
