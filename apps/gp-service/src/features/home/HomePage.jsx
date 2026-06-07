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
import CitySelector from '@gp/shared/components/CitySelector'
import OrderMap from '../../components/OrderMap'
import { useLanguage } from '../../i18n'

const ICONS = { Droplets, Truck, Sprout, Zap }
const QUICK = ['septic-pumping', 'irrigation-tuning', 'lawn-trim']

const LIVE_STEP_KEYS = ['liveStepSearch', 'liveStepFound', 'liveStepWay', 'liveStepWork', 'liveStepDone']

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
  const { t, lang } = useLanguage()
  const {
    recommendations, products, productsLoading, orders, ordersLoading, favorites, refreshOrders,
    isDemoMode, profile, setProfile, isLoggedIn, geoStore, getCityCatalog,
  } = useService()

  const demoQrLinks = useMemo(() => [
    { code: 'QR-FILTER-001', label: t('demoQrFilter') },
    { code: 'QR-IRRIGATION-001', label: t('demoQrIrrigation') },
  ], [t])

  const cityCatalog = useMemo(
    () => getCityCatalog(SERVICE_CATALOG, lang),
    [getCityCatalog, lang, profile.franchiseId],
  )
  const catalogById = useMemo(() => Object.fromEntries(cityCatalog.map((s) => [s.id, s])), [cityCatalog])
  const quickServices = QUICK.map((id) => catalogById[id]).filter(Boolean)
  const activeOrder = useMemo(
    () => orders.find((o) => !['completed', 'expired', 'canceled_by_client', 'canceled_by_spec', 'no_show'].includes(o.status)),
    [orders],
  )
  const recentOrders = orders.slice(0, 3)

  return (
    <div className="pb-4 gp-animate-in">
      {isDemoMode && isLoggedIn && geoStore && (
        <div className="px-4 pt-3">
          <CitySelector
            store={geoStore}
            value={{ oblastId: profile.oblastId, cityId: profile.cityId }}
            inputClassName="w-full rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface)] px-3 py-2.5 text-sm"
            onChange={(sel) => {
              setProfile((p) => ({
                ...p,
                oblastId: sel.oblastId,
                cityId: sel.cityId,
                city: sel.city || p.city,
                franchiseId: sel.franchiseId || p.franchiseId,
              }))
              demoApi.updateDemoSession({
                oblastId: sel.oblastId,
                cityId: sel.cityId,
                city: sel.city,
                franchiseId: sel.franchiseId,
              })
            }}
          />
        </div>
      )}
      <section className="gp-gradient-kaspi text-white px-5 pt-6 pb-10 rounded-b-[1.75rem] shadow-[var(--gp-shadow-md)]">
        <p className="text-white/75 text-sm font-medium mb-1">{t('welcome')}</p>
        <h1 className="text-2xl font-extrabold leading-tight mb-2">{t('homeHeroSubtitle')}</h1>
        <p className="text-white/85 text-sm mb-5">{t('homeHeroDesc')}</p>
        <div>
          <button
            type="button"
            onClick={() => navigate('/quick-order')}
            className="w-full py-4 px-4 rounded-2xl bg-white text-emerald-700 font-bold text-sm shadow-lg active:scale-[0.98] transition"
          >
            <Droplets className="w-5 h-5 inline mr-1.5 -mt-0.5" />
            {t('quickOrder')}
          </button>
        </div>
      </section>

      <section className="px-4 mt-3">
        <p className="text-xs font-bold text-[var(--gp-text-muted)] uppercase mb-2">{t('demoQrService')}</p>
        <div className="flex flex-wrap gap-2">
          {demoQrLinks.map((q) => (
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
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">{t('orderInProgressLabel')}</p>
            </div>
            <p className="font-bold text-base mb-1">{activeOrder.serviceName || t('genericOrder')}</p>
            <p className="text-sm text-[var(--gp-text-muted)] mb-3">{formatPrice(activeOrder.total)}</p>
            <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
              {LIVE_STEP_KEYS.map((key, i) => {
                const cur = statusToLiveIndex(activeOrder.status)
                const active = i === cur
                const done = i < cur
                return (
                  <span
                    key={key}
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      done ? 'gp-gradient-kaspi text-white' : active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-[var(--gp-surface-2)] text-[var(--gp-text-muted)]'
                    }`}
                  >
                    {t(key)}
                  </span>
                )
              })}
            </div>
          </KaspiCard>
        </section>
      )}

      <section className="px-4 mt-5">
        <h2 className="font-extrabold text-lg mb-3">{t('quickServices')}</h2>
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
                  <p className="text-sm text-[var(--gp-text-muted)]">{t('priceFrom')} {formatPrice(s.priceFrom)}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--gp-text-muted)] shrink-0" />
              </KaspiCard>
            )
          })}
        </div>
      </section>

      <section className="px-4 mt-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-extrabold text-lg">{t('favorites')}</h2>
          <button type="button" onClick={() => navigate('/favorites')} className="text-sm font-bold text-emerald-600">
            {t('allLink')}
          </button>
        </div>
        {favorites.length === 0 ? (
          <KaspiCard className="!p-5 text-center text-[var(--gp-text-muted)] text-sm">
            <Heart className="w-8 h-8 mx-auto mb-2 opacity-40" />
            {t('favoritesEmpty')}
          </KaspiCard>
        ) : (
          <KaspiCard onClick={() => navigate('/favorites')} className="flex items-center gap-3 !p-4">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            <span className="font-semibold">{t('favoritesCount').replace('{n}', String(favorites.length))}</span>
            <ArrowRight className="w-5 h-5 ml-auto text-[var(--gp-text-muted)]" />
          </KaspiCard>
        )}
      </section>

      <section className="px-4 mt-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-extrabold text-lg">{t('recentOrders')}</h2>
          <button type="button" onClick={() => { refreshOrders(); navigate('/orders') }} className="text-sm font-bold text-emerald-600">
            {t('allLink')}
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
            <p className="text-sm text-[var(--gp-text-muted)] mb-3">{t('noOrdersYet')}</p>
            <KaspiButton size="md" onClick={() => navigate('/quick-order')}>
              {t('firstOrder')}
            </KaspiButton>
          </KaspiCard>
        ) : (
          <ul className="space-y-3">
            {recentOrders.map((o) => (
              <li key={o.id}>
                <KaspiCard onClick={() => navigate('/orders')} className="!p-4">
                  <p className="font-bold">{o.serviceName || t('genericOrder')}</p>
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
          <h2 className="font-extrabold text-lg">{t('executorsNearby')}</h2>
        </div>
        <KaspiCard className="!p-0 overflow-hidden">
          <OrderMap className="h-44 w-full rounded-t-[var(--gp-radius-lg)]" compact />
          <div className="p-4 flex items-center justify-between">
            <p className="text-sm text-[var(--gp-text-muted)]">{t('liveMap')}</p>
            <button type="button" onClick={() => navigate('/orders')} className="text-sm font-bold text-emerald-600">
              {t('nav_orders')}
            </button>
          </div>
        </KaspiCard>
      </section>

      <section className="px-4 mt-6 mb-2">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-extrabold text-lg flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-amber-500" />
            {t('popularProducts')}
          </h2>
          <button type="button" onClick={() => navigate('/shop')} className="text-sm font-bold text-emerald-600">
            {t('catalogLink')}
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
            {t('catalogSoon')}
          </KaspiCard>
        )}
      </section>
    </div>
  )
}
