import { Link, Outlet, useLocation } from 'react-router-dom'
import { Package, Store, Truck, Wallet, Settings, Boxes } from 'lucide-react'
import { useLanguage } from '../i18n'

const NAV = [
  { to: '/cabinet', end: true, icon: Store, key: 'market_my_shop' },
  { to: '/cabinet/products', icon: Package, key: 'market_products' },
  { to: '/cabinet/stock', icon: Boxes, key: 'market_stock' },
  { to: '/cabinet/orders', icon: Package, key: 'market_orders' },
  { to: '/cabinet/delivery', icon: Truck, key: 'market_delivery' },
  { to: '/cabinet/finance', icon: Wallet, key: 'market_finance' },
  { to: '/cabinet/settings', icon: Settings, key: 'settings' },
]

export default function PartnerCabinetPage() {
  const { t } = useLanguage()
  const loc = useLocation()
  const isRoot = loc.pathname === '/cabinet'

  if (!isRoot) {
    return (
      <div className="min-h-screen bg-[var(--gp-bg)] text-[var(--gp-text)]">
        <header className="border-b border-[var(--gp-border)] bg-[var(--gp-surface)] px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
          <div>
            <p className="text-xs partner-muted uppercase tracking-widest">GP Partner Cabinet</p>
            <h1 className="text-xl font-extrabold gp-text-gradient">{t('market_cabinet')}</h1>
          </div>
          <Link to="/" className="text-sm font-semibold text-emerald-600">{t('market_back_app')}</Link>
        </header>
        <div className="max-w-6xl mx-auto flex min-h-[calc(100vh-4rem)]">
          <aside className="w-56 border-r border-[var(--gp-border)] p-4 space-y-1 hidden md:block">
            {NAV.map(({ to, end, icon: Icon, key }) => (
              <Link
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${isActive ? 'bg-emerald-500/15 text-emerald-700' : 'partner-muted hover:bg-[var(--gp-surface-2)]'}`
                }
              >
                <Icon className="w-4 h-4" /> {t(key)}
              </Link>
            ))}
          </aside>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--gp-bg)] text-[var(--gp-text)] p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-extrabold mb-2">{t('market_cabinet')}</h1>
      <p className="partner-muted text-sm mb-6">{t('market_cabinet_hint')}</p>
      <div className="grid gap-2">
        {NAV.map(({ to, icon: Icon, key }) => (
          <Link key={to} to={to} className="partner-card p-4 flex items-center gap-3 hover:border-emerald-500/50">
            <Icon className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold">{t(key)}</span>
          </Link>
        ))}
      </div>
      <Link to="/shop" className="block mt-6 text-center text-emerald-600 font-semibold">{t('market_my_shop')}</Link>
    </div>
  )
}
