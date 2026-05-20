import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, Package, RefreshCw, Wrench } from 'lucide-react'
import { formatDate, formatPrice } from '@gp/shared/utils'
import {
  getClientCategoryLabel,
  getClientStatusMessage,
  getMapStatusText,
  getOrderStatusLabel,
  formatOrderSchedule,
  LAWN_WORK_TYPES,
} from '@gp/shared/constants'
import { useService } from '../../context/ServiceContext'
import OrderMap from '../../components/OrderMap'
import { KaspiButton, KaspiCard, SkeletonBlock, StatusTimeline } from '@gp/shared/ui/KaspiUI'

const LIVE_STEPS = [
  { id: 'search', label: 'Поиск' },
  { id: 'found', label: 'Исполнитель найден' },
  { id: 'way', label: 'В пути' },
  { id: 'work', label: 'Начал работу' },
  { id: 'done', label: 'Завершено' },
]

function statusToIndex(status) {
  const map = { new: 0, pending: 0, assigned: 1, accepted: 1, on_way: 2, in_progress: 3, on_site: 3, started: 3, done: 4, client_confirmed: 4 }
  return map[status] ?? 0
}

export default function OrdersPage() {
  const { allOrders, refreshOrders, confirmOrder, isLoggedIn, ordersLoading } = useService()
  const [params, setParams] = useSearchParams()
  const [success, setSuccess] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [confirming, setConfirming] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const id = params.get('success')
    if (id) { setSuccess(id); setParams({}, { replace: true }) }
  }, [params, setParams])

  useEffect(() => {
    if (!isLoggedIn) return
    refreshOrders()
    const t = setInterval(refreshOrders, 6000)
    return () => clearInterval(t)
  }, [isLoggedIn, refreshOrders])

  const pullRefresh = async () => {
    setRefreshing(true)
    await refreshOrders()
    setRefreshing(false)
  }

  const handleConfirm = async (orderId) => {
    setConfirming(orderId)
    try {
      await confirmOrder(orderId)
    } finally {
      setConfirming(null)
    }
  }

  return (
    <div className="px-4 py-4 gp-animate-in">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-extrabold">Заказы</h1>
        <button
          type="button"
          onClick={pullRefresh}
          className="p-3 rounded-2xl bg-[var(--gp-surface)] border border-[var(--gp-border)] shadow-sm"
          aria-label="Обновить"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing || ordersLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {success && (
        <KaspiCard className="!p-4 mb-4 flex gap-3 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20">
          <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium">Заказ <strong>{success}</strong> создан</p>
        </KaspiCard>
      )}

      {!isLoggedIn ? (
        <KaspiCard className="!p-6 text-center">
          <p className="text-[var(--gp-text-muted)] mb-4">Войдите, чтобы видеть заказы</p>
          <Link to="/login" className="inline-block w-full">
            <KaspiButton>Войти</KaspiButton>
          </Link>
        </KaspiCard>
      ) : ordersLoading && !allOrders.length ? (
        <div className="space-y-3">
          <SkeletonBlock className="h-28" />
          <SkeletonBlock className="h-28" />
        </div>
      ) : !allOrders.length ? (
        <KaspiCard className="!p-8 text-center text-[var(--gp-text-muted)]">Заказов пока нет</KaspiCard>
      ) : (
        <ul className="space-y-3">
          {allOrders.map((o) => {
            const open = expanded === o.id
            const showMap = ['accepted', 'on_way', 'on_site', 'started', 'in_progress', 'done'].includes(o.status)
            const lawnLabel = LAWN_WORK_TYPES.find((t) => t.id === o.lawnWorkType)?.label

            return (
              <li key={o.id}>
                <KaspiCard className="!p-0 overflow-hidden">
                  <button type="button" className="w-full p-4 text-left" onClick={() => setExpanded(open ? null : o.id)}>
                    <div className="flex justify-between mb-2">
                      <span className="font-bold flex items-center gap-2 text-sm">
                        {o.kind === 'shop' ? <Package className="w-4 h-4 text-blue-600" /> : <Wrench className="w-4 h-4 text-emerald-600" />}
                        {getClientCategoryLabel(o.category)}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--gp-surface-2)] font-bold">
                        {getOrderStatusLabel(o.status)}
                      </span>
                    </div>
                    <p className="font-extrabold">{o.serviceName || o.id}</p>
                    <p className="text-sm text-emerald-600 font-semibold mt-1">{getClientStatusMessage(o.status)}</p>
                    {formatOrderSchedule(o) && (
                      <p className="text-xs text-[var(--gp-text-muted)] mt-1">{formatOrderSchedule(o)}</p>
                    )}
                    <p className="text-lg font-extrabold gp-text-gradient mt-2">{formatPrice(o.total)}</p>
                    <p className="text-xs text-[var(--gp-text-muted)] mt-1">{formatDate(o.createdAt)}</p>
                  </button>

                  {open && (
                    <div className="px-4 pb-4 border-t border-[var(--gp-border)] pt-4 space-y-4">
                      {o.category !== 'shop' && (
                        <StatusTimeline steps={LIVE_STEPS} currentIndex={statusToIndex(o.status)} />
                      )}
                      {showMap && (
                        <OrderMap
                          clientLat={o.clientLat}
                          clientLng={o.clientLng}
                          executorLat={o.executorLat}
                          executorLng={o.executorLng}
                          statusLabel={getMapStatusText(o.status)}
                          className="h-40 rounded-2xl overflow-hidden"
                        />
                      )}
                      {o.category === 'lawn' && o.lawnAreaSqm && (
                        <p className="text-sm">{o.lawnAreaSqm} м² · {lawnLabel}</p>
                      )}
                      {o.status === 'done' && (
                        <KaspiButton size="md" disabled={confirming === o.id} onClick={() => handleConfirm(o.id)}>
                          {confirming === o.id ? '…' : 'Подтвердить выполнение'}
                        </KaspiButton>
                      )}
                    </div>
                  )}
                </KaspiCard>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
