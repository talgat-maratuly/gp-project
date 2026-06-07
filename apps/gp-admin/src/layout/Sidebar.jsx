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
  MapPin,
  UserCog,
  UserCheck,
  ClipboardCheck,
} from 'lucide-react'
import { navForRole } from '../lib/permissions'
import { navLinkEnd } from '../lib/navLinkEnd'
import { useLanguage } from '../i18n/LanguageContext'
import { isDemoMode } from '@gp/shared/demo'

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
  MapPin,
  UserCog,
  UserCheck,
  ClipboardCheck,
}

export default function Sidebar({ role, open, onClose }) {
  const { t } = useLanguage()
  const items = navForRole(role)

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 admin-overlay z-40 lg:hidden"
          aria-label={t('closeMenu')}
          onClick={onClose}
        />
      )}
      <aside
        className={`admin-sidebar fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col border-r transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--gp-border)' }}>
          <div>
            <p className="font-extrabold text-lg tracking-tight admin-heading">{t('appName')}</p>
            <p className="text-[10px] admin-muted uppercase tracking-widest">{t('appTagline')}</p>
          </div>
          <button type="button" className="lg:hidden admin-btn-icon !min-h-0 !min-w-0 p-2" onClick={onClose}>
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
                end={navLinkEnd(item.path)}
                onClick={onClose}
                className={({ isActive }) =>
                  `admin-nav-link ${isActive ? 'admin-nav-link-active' : ''}`
                }
              >
                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                {t(item.labelKey)}
              </NavLink>
            )
          })}
        </nav>
        {isDemoMode() && (
          <p className="p-4 text-[10px] admin-muted border-t" style={{ borderColor: 'var(--gp-border)' }}>
            {t('demoFooter')}
          </p>
        )}
      </aside>
    </>
  )
}
