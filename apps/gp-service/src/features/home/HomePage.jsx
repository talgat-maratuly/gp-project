import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Droplets,
  Heart,
  MapPin,
  Package,
  Sparkles,
  Sprout,
  Truck,
  Zap,
} from 'lucide-react'
import { formatPrice } from '@gp/shared/utils'
import { KaspiButton, KaspiCard, SkeletonBlock } from '@gp/shared/ui/KaspiUI'
import { SERVICE_CATALOG } from '../../data/services'
import ProductCard from '../shop/ProductCard'
import { useService } from '../../context/ServiceContext'
import * as demoApi from '../../lib/demoApi'
import OrderMap from '../../components/OrderMap'

const ICONS = { Droplets, Truck, Sprout, Zap }
const QUICK = ['septic-pumping', 'irrigation-tuning', 'lawn-trim']
const DEMO_QR_LINKS = [
  { code: 'QR-FILTER-001', label: 'Фильтр (демо QR)' },
  { code: 'QR-IRRIGATION-001', label: 'Автополив (демо QR)' },
]

const LIVE_STEPS = [
  { id: 'search', label: 'Поиск' },
  { id: 'found', label: 'Исполнитель найден' },
  { id: 'way', label: 'В пути' },
  { id: 'work', label: 'Начал работу' },
  { id: 'done', label: 'Завершено' },
]

function statusToLiveIndex(status) {
  const map = {
    new: 0,
    pending: 0,
    assigned: 1,
    accepted: 1,
    on_way: 2,
    in_process: 3,
    completed: 4,
  }
  return map[status] ?? 0
}

export default function HomePage() {
  const navigate = useNavigate()
  const {
    recommendations, products, productsLoading, orders, ordersLoading, favorites, refreshOrders,
    isDemoMode, demoFranchises, profile, setProfile, isLoggedIn,
  } = useService()

  const quickServices = QUICK.map((id) => SERVICE_CATALOG.find((s) => s.id === id)).filter(Boolean)
  const activeOrder = useMemo(
    () => orders.find((o) => !['completed', 'expired', 'canceled_by_client', 'canceled_by_spec', 'no_show'].includes(o.status)),
    [orders],
  )
  const recentOrders = orders.slice(0, 3)

  return (
    <div className="pb-4 gp-animate-in">
      {isDemoMode && isLoggedIn && demoFranchises?.length > 0 && (
        <div className="px-4 pt-3">
          <label className="text-xs font-bold text-[var(--gp-text-muted)] block mb-1">Город / франшиза</label>
          <select
            className="w-full rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface)] px-3 py-2.5 text-sm"
            value={profile.city}
            onChange={(e) => {
              const fr = demoFranchises.find((f) => f.city === e.target.value)
              setProfile((p) => ({ ...p, city: e.target.value, franchiseId: fr?.id }))
              demoApi.updateDemoSession({ city: e.target.value, franchiseId: fr?.id })
            }}
          >
            {demoFranchises.map((f) => (
              <option key={f.id} value={f.city}>{f.name}</option>
            ))}
          </select>
        </div>
      )}
      <section className="gp-gradient-kaspi text-white px-5 pt-6 pb-10 rounded-b-[1.75rem] shadow-[var(--gp-shadow-md)]">
        <p className="text-white/75 text-sm font-medium mb-1">Добро пожаловать</p>
        <h1 className="text-2xl font-extrabold leading-tight mb-2">Услуги и магазин в одном приложении</h1>
        <p className="text-white/85 text-sm mb-5">Быстрый заказ септика, автополив и магазин — в одном приложении.</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/services/septic-pumping')}
            className="flex-1 py-4 px-4 rounded-2xl bg-white text-emerald-700 font-bold text-sm shadow-lg active:scale-[0.98] transition"
          >
            <Droplets className="w-5 h-5 inline mr-1.5 -mt-0.5" />
            Быстрый заказ
          </button>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="flex-1 py-4 px-4 rounded-2xl bg-white/15 border border-white/30 text-white font-bold text-sm backdrop-blur active:scale-[0.98] transition"
          >
            Магазин
          </button>
        </div>
      </section>

      <section className="px-4 mt-3">
        <p className="text-xs font-bold text-[var(--gp-text-muted)] uppercase mb-2">Демо QR Service</p>
        <div className="flex flex-wrap gap-2">
          {DEMO_QR_LINKS.map((q) => (
            <button
              key={q.code}
              type="button"
              onClick={() => navigate(`/qr/${q.code}`)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface)]"
            >
              {q.label}
            </button>
          ))}
        </div>
      </section>

      {activeOrder && (
        <section className="px-4 -mt-5 mb-2">
          <KaspiCard onClick={() => navigate('/orders')} className="!p-4 border-emerald-500/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Заказ в работе</p>
            </div>
            <p className="font-bold text-base mb-1">{activeOrder.serviceName || 'Заказ'}</p>
            <p className="text-sm text-[var(--gp-text-muted)] mb-3">{formatPrice(activeOrder.total)}</p>
            <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
              {LIVE_STEPS.map((s, i) => {
                const cur = statusToLiveIndex(activeOrder.status)
                const active = i === cur
                const done = i < cur
                return (
                  <span
                    key={s.id}
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      done ? 'gp-gradient-kaspi text-white' : active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-[var(--gp-surface-2)] text-[var(--gp-text-muted)]'
                    }`}
                  >
                    {s.label}
                  </span>
                )
              })}
            </div>
          </KaspiCard>
        </section>
      )}

      <section className="px-4 mt-5">
        <h2 className="font-extrabold text-lg mb-3">Быстрые услуги</h2>
        <div className="grid grid-cols-1 gap-3">
          {quickServices.map((s) => {
            const Icon = ICONS[s.icon] || Droplets
            return (
              <KaspiCard key={s.id} onClick={() => navigate(`/services/${s.id}`)} className="flex items-center gap-4 !p-4">
                <div className="w-14 h-14 rounded-2xl gp-gradient-kaspi flex items-center justify-center shrink-0 shadow-md">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base">{s.name}</p>
                  <p className="text-sm text-[var(--gp-text-muted)]">от {formatPrice(s.priceFrom)}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--gp-text-muted)] shrink-0" />
              </KaspiCard>
            )
          })}
        </div>
      </section>

      <section className="px-4 mt-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-extrabold text-lg">Избранное</h2>
          <button type="button" onClick={() => navigate('/favorites')} className="text-sm font-bold text-emerald-600">
            Все →
          </button>
        </div>
        {favorites.length === 0 ? (
          <KaspiCard className="!p-5 text-center text-[var(--gp-text-muted)] text-sm">
            <Heart className="w-8 h-8 mx-auto mb-2 opacity-40" />
            Добавляйте товары и услуги в избранное
          </KaspiCard>
        ) : (
          <KaspiCard onClick={() => navigate('/favorites')} className="flex items-center gap-3 !p-4">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            <span className="font-semibold">{favorites.length} в избранном</span>
            <ArrowRight className="w-5 h-5 ml-auto text-[var(--gp-text-muted)]" />
          </KaspiCard>
        )}
      </section>

      <section className="px-4 mt-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-extrabold text-lg">Последние заказы</h2>
          <button type="button" onClick={() => { refreshOrders(); navigate('/orders') }} className="text-sm font-bold text-emerald-600">
            Все →
          </button>
        </div>
        {ordersLoading && !orders.length ? (
          <div className="space-y-3">
            <SkeletonBlock className="h-24" />
            <SkeletonBlock className="h-24" />
          </div>
        ) : recentOrders.length === 0 ? (
          <KaspiCard className="!p-5 text-center">
            <Package className="w-8 h-8 mx-auto mb-2 text-[var(--gp-text-muted)]" />
            <p className="text-sm text-[var(--gp-text-muted)] mb-3">Пока нет заказов</p>
            <KaspiButton size="md" onClick={() => navigate('/services/septic-pumping')}>
              Первый заказ
            </KaspiButton>
          </KaspiCard>
        ) : (
          <ul className="space-y-3">
            {recentOrders.map((o) => (
              <li key={o.id}>
                <KaspiCard onClick={() => navigate('/orders')} className="!p-4">
                  <p className="font-bold">{o.serviceName || 'Заказ'}</p>
                  <p className="text-sm text-[var(--gp-text-muted)] mt-0.5">{formatPrice(o.total)} · {o.status}</p>
                </KaspiCard>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="px-4 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-emerald-600" />
          <h2 className="font-extrabold text-lg">Исполнители рядом</h2>
        </div>
        <KaspiCard className="!p-0 overflow-hidden">
          <OrderMap className="h-44 w-full rounded-t-[var(--gp-radius-lg)]" compact />
          <div className="p-4 flex items-center justify-between">
            <p className="text-sm text-[var(--gp-text-muted)]">Карта в реальном времени</p>
            <button type="button" onClick={() => navigate('/orders')} className="text-sm font-bold text-emerald-600">
              Заказы
            </button>
          </div>
        </KaspiCard>
      </section>

      <section className="px-4 mt-6 mb-2">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-extrabold text-lg flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Магазин
          </h2>
          <button type="button" onClick={() => navigate('/shop')} className="text-sm font-bold text-emerald-600">
            Каталог →
          </button>
        </div>
        {productsLoading && !products.length ? (
          <div className="grid grid-cols-2 gap-3">
            <SkeletonBlock className="h-52" />
            <SkeletonBlock className="h-52" />
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {recommendations.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <KaspiCard className="!p-5 text-sm text-[var(--gp-text-muted)] text-center">
            Каталог скоро наполнится партнёрами
          </KaspiCard>
        )}
      </section>
    </div>
  )
}
