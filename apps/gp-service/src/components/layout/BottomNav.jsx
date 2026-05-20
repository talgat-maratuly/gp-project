import { NavLink } from 'react-router-dom'
import { ClipboardList, Home, ShoppingBag, User, Package } from 'lucide-react'

const ITEMS = [
  { to: '/', icon: Home, label: 'Главная', end: true },
  { to: '/services', icon: ClipboardList, label: 'Услуги' },
  { to: '/shop', icon: ShoppingBag, label: 'Магазин' },
  { to: '/orders', icon: Package, label: 'Заказы' },
  { to: '/profile', icon: User, label: 'Профиль' },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-[var(--gp-surface)]/95 backdrop-blur-xl border-t border-[var(--gp-border)] shadow-[var(--gp-shadow-md)] pb-[env(safe-area-inset-bottom)]"
      style={{ height: 'var(--gp-nav-h)' }}
    >
      <div className="flex max-w-2xl mx-auto h-full items-stretch px-1">
        {ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 rounded-2xl mx-0.5 my-1.5 text-[11px] font-bold transition-all duration-200 ${
                isActive
                  ? 'text-white gp-gradient-kaspi shadow-md scale-[1.02]'
                  : 'text-[var(--gp-text-muted)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
