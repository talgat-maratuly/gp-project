import { Link, NavLink, Navigate, Outlet } from 'react-router-dom'
import { ClipboardList, LayoutDashboard, Map, Store, User } from 'lucide-react'
import LanguageSwitcher from '@gp/shared/components/LanguageSwitcher'
import { useLanguage } from '../i18n'
import { usePartner } from '../context/PartnerContext'
import { useTheme } from '../hooks/useTheme'

const NAV = [
  { to: '/', icon: LayoutDashboard, labelKey: 'nav_home', end: true },
  { to: '/orders', icon: ClipboardList, labelKey: 'nav_orders' },
  { to: '/shop', icon: Store, labelKey: 'market_my_shop' },
  { to: '/map', icon: Map, labelKey: 'nav_map' },
  { to: '/profile', icon: User, labelKey: 'nav_profile' },
]

export default function PartnerShell() {
  const { user, authReady, setOnline } = usePartner()
  useTheme()
  const { t } = useLanguage()

  if (!authReady) {
    return (
      <div className="min-h-screen gp-app-bg flex items-center justify-center text-[var(--gp-text-muted)]">
        {t('loading')}
      </div>
    )
  }
  if (!user) return <Navigate to="/auth" replace />

  return (
    <div className="min-h-screen flex flex-col gp-app-bg">
      <header className="sticky top-0 z-40 bg-[var(--gp-surface)]/90 backdrop-blur-md border-b border-[var(--gp-border)] shadow-[var(--gp-shadow-sm)]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="min-w-0">
            <span className="font-extrabold text-lg gp-text-gradient">{t('app_partner')}</span>
            <p className="text-[10px] text-[var(--gp-text-muted)] truncate leading-none mt-0.5">
              {user.company || user.name}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LanguageSwitcher className="!border-[var(--gp-border)] scale-90" />
            <button
              type="button"
              onClick={toggle}
              className="text-xs font-bold px-2.5 py-2 rounded-xl bg-[var(--gp-surface-2)] text-[var(--gp-text-muted)]"
            >
              {dark ? '☀' : '☾'}
            </button>
            <button
              type="button"
              onClick={() => setOnline(!user.isOnline)}
              className={`text-xs font-bold px-3 py-2 rounded-full transition ${
                user.isOnline
                  ? 'gp-gradient-kaspi text-white shadow-md'
                  : 'bg-[var(--gp-surface-2)] text-[var(--gp-text-muted)]'
              }`}
            >
              {user.isOnline ? t('online') : t('offline')}
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-lg mx-auto w-full safe-pb px-4 py-4">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-[var(--gp-surface)]/95 backdrop-blur-xl border-t border-[var(--gp-border)] shadow-[var(--gp-shadow-md)] pb-[env(safe-area-inset-bottom)]" style={{ height: 'var(--gp-nav-h)' }}>
        <div className="flex max-w-lg mx-auto h-full items-stretch px-1">
          {NAV.map(({ to, icon: Icon, labelKey, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 rounded-2xl mx-0.5 my-1.5 text-[10px] font-bold transition ${
                  isActive ? 'text-white gp-gradient-kaspi shadow-md' : 'text-[var(--gp-text-muted)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  {t(labelKey)}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
