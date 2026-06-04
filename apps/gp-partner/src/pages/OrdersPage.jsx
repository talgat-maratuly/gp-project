import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Navigation, Phone, QrCode } from 'lucide-react'
import { usePartner } from '../context/PartnerContext'
import { formatPrice } from '@gp/shared/utils'
import {
  PARTNER_DIRECTIONS,
  getClientCategoryLabel,
  getOrderStatusLabel,
  getPartnerDirectionLabel,
  getPartnerOrderAction,
  getMapStatusText,
  formatOrderSchedule,
  isTerminalStatus,
  LAWN_WORK_TYPES,
} from '@gp/shared/constants'
import { api } from '@gp/shared/api'
import { buildMockTracking } from '@gp/shared/utils'
import { URALSK_DISPOSAL_ZONES } from '@gp/shared/constants'
import { subscribeOrderTracking } from '@gp/shared/api/trackingSocket'
import LiveTrackingMap from '../components/LiveTrackingMap'
import MapNavigationPicker from '../components/MapNavigationPicker'
import { useGpsTracker } from '../hooks/useGpsTracker'
import { useLanguage } from '@gp/shared/i18n'
import { Chip, KaspiCard } from '@gp/shared/ui/KaspiUI'

function OrderCard({ order, user, onAccept, onAdvance, onCancel, onSelect, onRoute, onOpen, selected, feedMode = false, expanded = false }) {
  const { t } = useLanguage()
  const action = getPartnerOrderAction(order.status, order.category)
  const isMine = (order.assignedPartnerId || order.partnerId) === user?.partnerProfileId
  const lawnLabel = LAWN_WORK_TYPES.find((t) => t.id === order.lawnWorkType)?.label

  const openDetails = () => {
    onOpen?.(order.id)
    onSelect(order.id)
  }

  return (
    <li>
      <KaspiCard
        className={`!p-0 overflow-hidden cursor-pointer active:scale-[0.99] transition ${selected ? 'ring-2 ring-emerald-500/50' : ''}`}
        onClick={openDetails}
      >
        <div className="p-4">
          <div className="flex justify-between items-start gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              {getClientCategoryLabel(order.category)}
            </span>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--gp-surface-2)] font-bold text-[var(--gp-text-muted)]">
              {getOrderStatusLabel(order.status)}
            </span>
          </div>
          <p className="font-extrabold text-lg leading-tight mb-1">
            {order.serviceName || (order.items?.length ? t('orderPositions', { n: order.items.length }) : order.id)}
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
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 font-medium">{t('volumeLabel', { n: order.septicVolume })}</p>
          )}
          {order.category === 'lawn' && order.lawnAreaSqm && (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{order.lawnAreaSqm} м² · {lawnLabel}</p>
          )}
          <p className="text-2xl font-extrabold gp-text-gradient mt-3">{formatPrice(order.total)}</p>
        </div>

        {(expanded || selected) && (
          <div className="px-4 pb-4 border-t border-[var(--gp-border)] pt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs font-bold text-[var(--gp-text-muted)]">{t('orderDetails')}</p>
            {order.note && <p className="text-sm text-[var(--gp-text-muted)]">{order.note}</p>}
            <div className="flex flex-col gap-2">
              {order.status === 'new' && (isMine || feedMode) && (
                <button type="button" onClick={() => onAccept(order.id)} className="w-full py-4 rounded-2xl gp-btn-primary font-bold text-sm">
                  Принять заказ
                </button>
              )}
              {isMine && action && (
                <button type="button" onClick={() => onAdvance(order.id, action.action)} className="w-full py-4 rounded-2xl bg-[var(--gp-surface-2)] font-bold text-sm border border-[var(--gp-border)]">
                  {action.label}
                </button>
              )}
              <div className="flex gap-2 flex-wrap">
                {isMine && !isTerminalStatus(order.status) && order.status !== 'new' && (
                  <button type="button" onClick={() => onCancel(order.id)} className="flex-1 min-w-[120px] py-3 rounded-2xl text-sm font-bold text-red-600 border border-red-200 dark:border-red-900/50">
                    Отменить
                  </button>
                )}
                <button type="button" onClick={() => onSelect(order.id)} className="flex-1 min-w-[120px] py-3 rounded-2xl text-sm font-bold border border-[var(--gp-border)]">
                  Открыть детали
                </button>
                {isMine && (order.clientLat != null || order.address) && (
                  <button
                    type="button"
                    onClick={() => onRoute(order)}
                    className="flex-1 min-w-[120px] py-3 rounded-2xl text-sm font-bold gp-gradient-kaspi text-white flex items-center justify-center gap-1"
                  >
                    <Navigation className="w-4 h-4" /> Маршрут
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {!expanded && !selected && (
          <div className="px-4 pb-3">
            <p className="text-xs text-emerald-600 font-semibold">Нажмите для деталей →</p>
          </div>
        )}
      </KaspiCard>
    </li>
  )
}

export default function OrdersPage() {
  const { t } = useLanguage()
  const {
    user, newOrders, activeOrders, activeOrder, feed, feedLoading,
    acceptOrder, acceptFromFeed, advanceOrder, cancelOrder, setOnline,
    setActiveOrderId, updateExecutorLocation,
  } = usePartner()
  const [tab, setTab] = useState('feed')
  const [dirFilter, setDirFilter] = useState('all')
  const [routeTarget, setRouteTarget] = useState(null)
  const [tracking, setTracking] = useState(null)
  const [geofences, setGeofences] = useState(URALSK_DISPOSAL_ZONES)
  const [detailOrderId, setDetailOrderId] = useState(null)
  const [acceptBanner, setAcceptBanner] = useState(false)

  useGpsTracker(activeOrder?.category === 'septic' ? activeOrder : null)

  useEffect(() => {
    api.getGeofences().then((z) => setGeofences(z?.length ? z : URALSK_DISPOSAL_ZONES)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!activeOrder?.id) {
      setTracking(null)
      return undefined
    }
    const fallback = () => setTracking(buildMockTracking(activeOrder, geofences))
    api.getOrderTracking(activeOrder.id).then(setTracking).catch(fallback)
    return subscribeOrderTracking(activeOrder.id, (t) => setTracking(t || buildMockTracking(activeOrder, geofences)))
  }, [activeOrder?.id, activeOrder?.status, geofences])

  const mapTracking = tracking || (activeOrder ? buildMockTracking(activeOrder, geofences) : null)

  const poolByTab = { feed, new: newOrders, active: activeOrders }
  const pool = poolByTab[tab] || []
  const filtered = dirFilter === 'all' ? pool : pool.filter((o) => o.category === dirFilter)
  const myDirections = user?.directions || []
  const isOnline = !!user?.isOnline

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

  const handleCancel = async (orderId) => {
    const reason = window.prompt(t('cancelReasonPrompt'))
    if (reason && reason.trim().length >= 3) await cancelOrder(orderId, reason.trim())
  }

  const handleRoute = (order) => {
    setRouteTarget({
      lat: order.clientLat,
      lng: order.clientLng,
      address: order.address,
      city: order.city,
    })
  }

  const handleAccept = async (orderId) => {
    const acceptFn = tab === 'feed' ? acceptFromFeed : acceptOrder
    try {
      await acceptFn(orderId)
      setDetailOrderId(orderId)
      setActiveOrderId(orderId)
      setTab('active')
      setAcceptBanner(true)
    } catch {
      /* acceptFromFeed already notifies */
    }
  }

  return (
    <div className="gp-animate-in">
      <h1 className="text-2xl font-extrabold mb-1">{t('ordersPageTitle')}</h1>
      <p className="text-xs text-[var(--gp-text-muted)] mb-2">
        {myDirections.map(getPartnerDirectionLabel).join(' · ')}
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        <Link to="/orders/qr" className="text-xs font-bold px-3 py-1.5 rounded-full bg-[var(--gp-surface-2)] flex items-center gap-1">
          <QrCode className="w-3.5 h-3.5" /> QR-заявки
        </Link>
        <Link to="/orders/filter-replacement" className="text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--gp-border)]">Замена фильтра</Link>
        <Link to="/orders/equipment-service" className="text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--gp-border)]">Обслуживание</Link>
      </div>
      <p className="text-xs font-bold text-[var(--gp-text-muted)] mb-2 mt-1">Мебельные исполнители</p>
      <div className="flex flex-wrap gap-2 mb-4">
        <Link to="/orders/furniture-manufacturing" className="text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--gp-border)]">Изготовление</Link>
        <Link to="/orders/furniture-assembly" className="text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--gp-border)]">Сборка</Link>
        <Link to="/orders/furniture-repair" className="text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--gp-border)]">Ремонт</Link>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          ['feed', t('partnerOrdersFeed', { n: feed.length })],
          ['new', t('partnerOrdersNew', { n: newOrders.length })],
          ['active', t('partnerOrdersActive', { n: activeOrders.length })],
        ].map(([tabId, label]) => (
          <Chip key={tabId} active={tab === tabId} onClick={() => setTab(tabId)} className="flex-1 !w-full text-center">
            {label}
          </Chip>
        ))}
      </div>

      {tab === 'feed' && !isOnline && (
        <KaspiCard className="!p-6 text-center mb-4">
          <p className="text-sm font-bold mb-1">{t('youOffline')}</p>
          <p className="text-xs text-[var(--gp-text-muted)] mb-4">
            {t('partnerOfflineHint')}
          </p>
          <button
            type="button"
            onClick={() => setOnline(true)}
            className="px-5 py-3 rounded-2xl gp-btn-primary font-bold text-sm"
          >
            {t('partnerGoOnline')}
          </button>
        </KaspiCard>
      )}

      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-2">
        <Chip active={dirFilter === 'all'} onClick={() => setDirFilter('all')}>{t('all')}</Chip>
        {PARTNER_DIRECTIONS.filter((d) => myDirections.includes(d.id)).map((d) => (
          <Chip key={d.id} active={dirFilter === d.id} onClick={() => setDirFilter(d.id)}>
            {d.label.split(' / ')[0]}
          </Chip>
        ))}
      </div>

      {acceptBanner && (
        <KaspiCard className="!p-4 mb-4 border-emerald-500/40 bg-emerald-500/10">
          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
            {t('partnerOrderAccepted')}
          </p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => { setTab('active'); setAcceptBanner(false) }}
              className="flex-1 py-3 rounded-2xl gp-btn-primary text-sm font-bold"
            >
              {t('partnerGoToWork')}
            </button>
            <button
              type="button"
              onClick={() => setAcceptBanner(false)}
              className="px-4 py-3 rounded-2xl text-sm font-bold border border-[var(--gp-border)]"
            >
              OK
            </button>
          </div>
        </KaspiCard>
      )}

      {activeOrder && tab === 'active' && (
        <KaspiCard className="!p-4 mb-4 border border-[var(--gp-border)]">
          <p className="text-sm font-bold mb-2">Активный заказ</p>
          <p className="font-extrabold">{activeOrder.serviceName}</p>
          <p className="text-xs text-[var(--gp-text-muted)] mt-1">{getOrderStatusLabel(activeOrder.status)}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <button type="button" onClick={() => setDetailOrderId(activeOrder.id)} className="px-3 py-2 rounded-xl text-xs font-bold border border-[var(--gp-border)]">
              Открыть детали
            </button>
            <button type="button" onClick={() => handleRoute(activeOrder)} className="px-3 py-2 rounded-xl text-xs font-bold gp-gradient-kaspi text-white">
              Построить маршрут
            </button>
            {getPartnerOrderAction(activeOrder.status, activeOrder.category) && (
              <button
                type="button"
                onClick={() => handleAdvance(activeOrder.id, getPartnerOrderAction(activeOrder.status, activeOrder.category).action)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-[var(--gp-surface-2)] border border-[var(--gp-border)]"
              >
                {getPartnerOrderAction(activeOrder.status, activeOrder.category).label}
              </button>
            )}
          </div>
        </KaspiCard>
      )}

      {activeOrder && (
        <KaspiCard className="!p-0 overflow-hidden mb-4">
          <div className="p-3 border-b border-[var(--gp-border)]">
            <p className="text-xs font-bold text-[var(--gp-text-muted)]">
              {getOrderStatusLabel(activeOrder.status)}
              {tracking?.etaMinutes != null && ` · ~${tracking.etaMinutes} мин`}
            </p>
            {activeOrder.illegalDisposal && (
              <p className="text-xs font-bold text-red-600 mt-1">⚠ Подозрительный слив вне зоны</p>
            )}
          </div>
          <LiveTrackingMap tracking={mapTracking} className="h-56" />
        </KaspiCard>
      )}

      {!(tab === 'feed' && !isOnline) && (
        <ul className="space-y-3 pb-4">
          {filtered.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              user={user}
              feedMode={tab === 'feed'}
              selected={detailOrderId === o.id || activeOrder?.id === o.id}
              expanded={detailOrderId === o.id}
              onAccept={handleAccept}
              onAdvance={handleAdvance}
              onCancel={handleCancel}
              onSelect={setActiveOrderId}
              onOpen={setDetailOrderId}
              onRoute={handleRoute}
            />
          ))}
          {!filtered.length && (
            <KaspiCard className="!p-8 text-center text-sm text-[var(--gp-text-muted)]">
              {tab === 'feed'
                ? (feedLoading ? 'Загрузка...' : 'Сейчас нет доступных заказов')
                : tab === 'new' ? 'Нет назначенных заявок' : 'Нет активных заказов'}
            </KaspiCard>
          )}
        </ul>
      )}

      <MapNavigationPicker
        open={!!routeTarget}
        destination={routeTarget}
        onClose={() => setRouteTarget(null)}
      />
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
