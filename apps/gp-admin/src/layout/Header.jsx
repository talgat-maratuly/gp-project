import { Menu, LogOut, Moon, Sun } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { useTheme } from '../hooks/useTheme'
import LanguageSwitcher from '../components/LanguageSwitcher'
import CityFilter from '../components/CityFilter'

export default function Header({ onMenuClick, title }) {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const { dark, toggle } = useTheme()

  return (
    <header className="admin-header sticky top-0 z-30 flex items-center justify-between gap-3 border-b px-4 py-3 lg:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          className="lg:hidden admin-btn-icon"
          onClick={onMenuClick}
          aria-label={t('closeMenu')}
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold truncate admin-heading">{title}</h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap justify-end">
        <CityFilter />
        <LanguageSwitcher />
        <button
          type="button"
          onClick={toggle}
          className="admin-btn-icon"
          aria-label={dark ? 'Light' : 'Dark'}
        >
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <div className="text-right hidden md:block">
          <p className="text-sm font-semibold admin-heading">{user?.name}</p>
          <p className="text-[10px] admin-muted uppercase">{t(`role_${user?.role}`)}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm admin-btn-icon !min-h-0 !min-w-0"
          style={{ borderColor: 'var(--gp-border)' }}
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">{t('logout')}</span>
        </button>
      </div>
    </header>
  )
}
