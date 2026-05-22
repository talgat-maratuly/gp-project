import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Briefcase,
  Wrench,
  Wallet,
  MessageSquare,
  Settings,
  Building2,
  Percent,
  X,
  ShoppingBag,
  Store,
  Package,
  ShoppingCart,
  Truck,
  Droplets,
  LayoutGrid,
  FlaskConical,
  QrCode,
} from 'lucide-react'
import { navForRole } from '../lib/permissions'
import { useLanguage } from '../i18n/LanguageContext'

const ICONS = {
  LayoutDashboard,
  ClipboardList,
  Users,
  Briefcase,
  Wrench,
  Wallet,
  MessageSquare,
  Settings,
  Building2,
  Percent,
  ShoppingBag,
  Store,
  Package,
  ShoppingCart,
  Truck,
  Droplets,
  LayoutGrid,
  FlaskConical,
  QrCode,
}

export default function Sidebar({ role, open, onClose }) {
  const { t } = useLanguage()
  const items = navForRole(role)

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          aria-label={t('closeMenu')}
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-white/10 bg-slate-950 transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <p className="font-extrabold text-lg tracking-tight">{t('appName')}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{t('appTagline')}</p>
          </div>
          <button type="button" className="lg:hidden p-2 rounded-lg hover:bg-white/10" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = ICONS[item.icon]
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive ? 'bg-sky-500/20 text-sky-200' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`
                }
              >
                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                {t(item.labelKey)}
              </NavLink>
            )
          })}
        </nav>
        <p className="p-4 text-[10px] text-slate-600 border-t border-white/10">{t('demoFooter')}</p>
      </aside>
    </>
  )
}
