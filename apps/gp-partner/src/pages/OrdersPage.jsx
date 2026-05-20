import { useState } from 'react'
import { MapPin, Navigation, Phone } from 'lucide-react'
import { usePartner } from '../context/PartnerContext'
import { formatPrice } from '@gp/shared/utils'
import {
  PARTNER_ORDER_ACTIONS,
  PARTNER_DIRECTIONS,
  getClientCategoryLabel,
  getOrderStatusLabel,
  getPartnerDirectionLabel,
  getMapStatusText,
  formatOrderSchedule,
  LAWN_WORK_TYPES,
} from '@gp/shared/constants'
import { Chip, KaspiCard } from '@gp/shared/ui/KaspiUI'
import OrderMap from '../components/OrderMap'

function openNavigation(order) {
  const lat = order.clientLat
  const lng = order.clientLng
  if (lat == null || lng == null) return
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  window.open(url, '_blank', 'noopener')
}

function OrderCard({ order, user, onAccept, onAdvance, onCancel, onSelect, selected }) {
  const action = PARTNER_ORDER_ACTIONS[order.status]
  const isMine = order.partnerId === user?.partnerProfileId
  const lawnLabel = LAWN_WORK_TYPES.find((t) => t.id === order.lawnWorkType)?.label

  return (
    <li>
      <KaspiCard className={`!p-4 ${selected ? 'ring-2 ring-emerald-500/50' : ''}`}>
        <div className="flex justify-between items-start gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            {getClientCategoryLabel(order.category)}
          </span>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--gp-surface-2)] font-bold text-[var(--gp-text-muted)]">
            {getOrderStatusLabel(order.status)}
          </span>
        </div>
        <p className="font-extrabold text-lg leading-tight mb-1">
          {order.serviceName || (order.items?.length ? `Заказ · ${order.items.length} поз.` : order.id)}
        </p>
        <p className="text-sm text-[var(--gp-text-muted)] flex items-center gap-1">
          <Phone className="w-3.5 h-3.5" />
          {order.clientName} · {order.clientPhone}
        </p>
        <p className="text-sm text-[var(--gp-text-muted)] flex items-center gap-1 mt-0.5">
          <MapPin className="w-3.5 h-3.5" />
          {order.address || 'Уральск'}
        </p>
        {formatOrderSchedule(order) && (
          <p className="text-xs text-blue-600 font-semibold mt-2">🕐 {formatOrderSchedule(order)}</p>
        )}
        {order.category === 'septic' && order.septicVolume && (
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 font-medium">Объём: {order.septicVolume} м³</p>
        )}
        {order.category === 'lawn' && order.lawnAreaSqm && (
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{order.lawnAreaSqm} м² · {lawnLabel}</p>
        )}
        <p className="text-2xl font-extrabold gp-text-gradient mt-3">{formatPrice(order.total)}</p>

        <div className="flex flex-col gap-2 mt-4">
          {order.status === 'new' && !order.partnerId && (
            <button type="button" onClick={() => onAccept(order.id)} className="w-full py-4 rounded-2xl gp-btn-primary font-bold text-sm">
              {PARTNER_ORDER_ACTIONS.new.label}
            </button>
          )}
          {isMine && action && (
            <button type="button" onClick={() => onAdvance(order.id, action.action)} className="w-full py-4 rounded-2xl bg-[var(--gp-surface-2)] font-bold text-sm border border-[var(--gp-border)]">
              {action.label}
            </button>
          )}
          <div className="flex gap-2">
            {isMine && !['done', 'client_confirmed', 'cancelled'].includes(order.status) && (
              <button type="button" onClick={() => onCancel(order.id)} className="flex-1 py-3 rounded-2xl text-sm font-bold text-red-600 border border-red-200 dark:border-red-900/50">
                Отменить
              </button>
            )}
            <button type="button" onClick={() => onSelect(order.id)} className="flex-1 py-3 rounded-2xl text-sm font-bold border border-[var(--gp-border)]">
              На карте
            </button>
            {isMine && order.clientLat != null && (
              <button
                type="button"
                onClick={() => openNavigation(order)}
                className="flex-1 py-3 rounded-2xl text-sm font-bold gp-gradient-kaspi text-white flex items-center justify-center gap-1"
              >
                <Navigation className="w-4 h-4" /> Маршрут
              </button>
            )}
          </div>
        </div>
      </KaspiCard>
    </li>
  )
}

export default function OrdersPage() {
  const {
    user, newOrders, activeOrders, activeOrder, acceptOrder, advanceOrder, cancelOrder,
    setActiveOrderId, updateExecutorLocation,
  } = usePartner()
  const [tab, setTab] = useState('new')
  const [dirFilter, setDirFilter] = useState('all')

  const pool = tab === 'new' ? newOrders : activeOrders
  const filtered = dirFilter === 'all' ? pool : pool.filter((o) => o.category === dirFilter)
  const myDirections = user?.directions || []

  const handleAdvance = async (orderId, status) => {
    const stored = loadDemoLocation()
    await advanceOrder(orderId, status, stored)
    if (status === 'on_way') {
      const lat = stored.lat + 0.002
      const lng = stored.lng + 0.002
      saveDemoLocation(lat, lng)
      await updateExecutorLocation(lat, lng)
    }
  }

  return (
    <div className="gp-animate-in">
      <h1 className="text-2xl font-extrabold mb-1">Заявки</h1>
      <p className="text-xs text-[var(--gp-text-muted)] mb-4">
        {myDirections.map(getPartnerDirectionLabel).join(' · ')}
      </p>

      <div className="flex gap-2 mb-4">
        {['new', 'active'].map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)} className="flex-1 !w-full text-center">
            {t === 'new' ? `Новые (${newOrders.length})` : `В работе (${activeOrders.length})`}
          </Chip>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-2">
        <Chip active={dirFilter === 'all'} onClick={() => setDirFilter('all')}>Все</Chip>
        {PARTNER_DIRECTIONS.filter((d) => myDirections.includes(d.id)).map((d) => (
          <Chip key={d.id} active={dirFilter === d.id} onClick={() => setDirFilter(d.id)}>
            {d.label.split(' / ')[0]}
          </Chip>
        ))}
      </div>

      {activeOrder && (
        <KaspiCard className="!p-0 overflow-hidden mb-4">
          <div className="p-3 border-b border-[var(--gp-border)]">
            <p className="text-xs font-bold text-[var(--gp-text-muted)]">
              {getOrderStatusLabel(activeOrder.status)}
              {getMapStatusText(activeOrder.status) ? ` · ${getMapStatusText(activeOrder.status)}` : ''}
            </p>
          </div>
          <OrderMap
            clientLat={activeOrder.clientLat}
            clientLng={activeOrder.clientLng}
            executorLat={activeOrder.executorLat}
            executorLng={activeOrder.executorLng}
            statusLabel={getMapStatusText(activeOrder.status)}
            className="h-44"
          />
        </KaspiCard>
      )}

      <ul className="space-y-3 pb-4">
        {filtered.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            user={user}
            selected={activeOrder?.id === o.id}
            onAccept={acceptOrder}
            onAdvance={handleAdvance}
            onCancel={cancelOrder}
            onSelect={setActiveOrderId}
          />
        ))}
        {!filtered.length && (
          <KaspiCard className="!p-8 text-center text-sm text-[var(--gp-text-muted)]">
            {tab === 'new' ? 'Нет свободных заявок' : 'Нет активных заказов'}
          </KaspiCard>
        )}
      </ul>
    </div>
  )
}

function loadDemoLocation() {
  try {
    const r = localStorage.getItem('gp-partner-location')
    if (r) return JSON.parse(r)
  } catch { /* */ }
  return { lat: 51.243, lng: 51.377 }
}

function saveDemoLocation(lat, lng) {
  localStorage.setItem('gp-partner-location', JSON.stringify({ lat, lng }))
}
