import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Heart, Moon, ShoppingCart, Sun } from 'lucide-react'
import { useService } from '../../context/ServiceContext'
import { useTheme } from '../../hooks/useTheme'
import BottomNav from './BottomNav'
import ToastHost from '../ui/Toast'

const HIDE_NAV = /^\/(login|shop\/checkout)/

export default function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { cartCount, favorites } = useService()
  const { dark, toggle } = useTheme()
  const hideNav = HIDE_NAV.test(location.pathname)

  return (
    <div className="min-h-screen flex flex-col gp-app-bg">
      <header className="sticky top-0 z-40 bg-[var(--gp-surface)]/90 backdrop-blur-md border-b border-[var(--gp-border)] shadow-[var(--gp-shadow-sm)]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="font-extrabold text-lg gp-text-gradient tracking-tight"
          >
            GP Service
          </button>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={toggle}
              className="p-2.5 rounded-2xl hover:bg-[var(--gp-surface-2)] text-[var(--gp-text-muted)]"
              aria-label="Тема"
            >
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={() => navigate('/favorites')}
              className="relative p-2.5 rounded-2xl hover:bg-[var(--gp-surface-2)]"
              aria-label="Избранное"
            >
              <Heart className="w-5 h-5 text-[var(--gp-text-muted)]" />
              {favorites.length > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/shop/cart')}
              className="relative p-2.5 rounded-2xl hover:bg-[var(--gp-surface-2)]"
              aria-label="Корзина"
            >
              <ShoppingCart className="w-5 h-5 text-[var(--gp-text-muted)]" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 gp-gradient-kaspi text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className={`flex-1 max-w-2xl mx-auto w-full ${hideNav ? '' : 'safe-pb'}`}>
        <Outlet />
      </main>

      {!hideNav && <BottomNav />}
      <ToastHost />
    </div>
  )
}
