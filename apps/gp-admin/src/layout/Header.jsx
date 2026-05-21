import { Menu, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import LanguageSwitcher from '../components/LanguageSwitcher'
import CityFilter from '../components/CityFilter'

export default function Header({ onMenuClick, title }) {
  const { user, logout } = useAuth()
  const { t } = useLanguage()

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/90 backdrop-blur px-4 py-3 lg:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          className="lg:hidden p-2 rounded-xl border border-white/10 hover:bg-white/5"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap justify-end">
        <CityFilter />
        <LanguageSwitcher />
        <div className="text-right hidden md:block">
          <p className="text-sm font-semibold">{user?.name}</p>
          <p className="text-[10px] text-slate-500 uppercase">{t(`role_${user?.role}`)}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-sm hover:bg-white/5"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">{t('logout')}</span>
        </button>
      </div>
    </header>
  )
}
