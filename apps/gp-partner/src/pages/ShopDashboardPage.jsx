import { Link } from 'react-router-dom'
import { Package, PlusCircle, ShoppingCart, Boxes, Settings } from 'lucide-react'
import { getShopDashboardLinks } from '@gp/shared/constants'
import { useLanguage } from '../i18n'
import { usePartner } from '../context/PartnerContext'

const ICONS = {
  market_products: Package,
  market_add_product: PlusCircle,
  market_stock: Boxes,
  market_orders: ShoppingCart,
  market_settings: Settings,
}

export default function ShopDashboardPage() {
  const { t } = useLanguage()
  const { user } = usePartner()
  const links = getShopDashboardLinks()

  return (
    <div className="gp-animate-in space-y-4">
      <div>
        <p className="text-sm text-[var(--gp-text-muted)]">GP Market</p>
        <h1 className="text-2xl font-extrabold">{user?.company || user?.name}</h1>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {links.map(({ to, labelKey }) => {
          const Icon = ICONS[labelKey] || Package
          return (
            <Link
              key={to}
              to={to}
              className="rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface)] p-4 flex flex-col gap-2 hover:shadow-md transition"
            >
              <Icon className="w-6 h-6 text-emerald-600" />
              <span className="font-bold text-sm">{t(labelKey) || labelKey}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
