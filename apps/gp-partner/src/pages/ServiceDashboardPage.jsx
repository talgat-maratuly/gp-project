import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ClipboardList, Star, TrendingUp, Wallet } from 'lucide-react'
import { getServiceDashboardLinks } from '@gp/shared/constants'
import { formatPrice } from '@gp/shared/utils'
import { KaspiCard, SkeletonBlock } from '@gp/shared/ui/KaspiUI'
import { usePartner } from '../context/PartnerContext'

export default function ServiceDashboardPage() {
  const navigate = useNavigate()
  const { user, newOrders, activeOrders, loading } = usePartner()
  const links = getServiceDashboardLinks(user?.partnerType)

  const todayEarned = useMemo(() => {
    const today = new Date().toDateString()
    return activeOrders
      .filter((o) => ['done', 'client_confirmed'].includes(o.status) && new Date(o.updatedAt || o.createdAt).toDateString() === today)
      .reduce((s, o) => s + Number(o.total || 0), 0)
  }, [activeOrders])

  const chart = [35, 55, 40, 70, 50, 85, 65]

  if (!user) return null

  return (
    <div className="gp-animate-in space-y-4">
      <div>
        <p className="text-sm text-[var(--gp-text-muted)]">Добрый день</p>
        <h1 className="text-2xl font-extrabold tracking-tight">{user.company || user.name}</h1>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {links.map(({ to, labelKey }) => (
          <Link
            key={to}
            to={to}
            className="text-center py-2.5 rounded-xl bg-[var(--gp-surface-2)] text-xs font-bold text-[var(--gp-text)]"
          >
            {labelKey}
          </Link>
        ))}
      </div>

      <KaspiCard className="!p-5 gp-gradient-kaspi text-white border-0 shadow-[var(--gp-shadow-lg)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium">Выплаты</p>
            <p className="text-3xl font-extrabold mt-1">{formatPrice(user.balance ?? 0)}</p>
          </div>
          <Wallet className="w-8 h-8 opacity-80" />
        </div>
        <button
          type="button"
          onClick={() => navigate('/balance')}
          className="mt-4 text-sm font-bold text-white/90 flex items-center gap-1"
        >
          Вывод средств <ArrowRight className="w-4 h-4" />
        </button>
      </KaspiCard>

      <div className="grid grid-cols-2 gap-3">
        <KaspiCard onClick={() => navigate('/orders/new')} className="!p-4">
          <p className="text-xs font-bold text-emerald-600 uppercase">Новые</p>
          <p className="text-2xl font-extrabold mt-1">{newOrders.length}</p>
        </KaspiCard>
        <KaspiCard className="!p-4">
          <p className="text-xs font-bold text-blue-600 uppercase">Сегодня</p>
          <p className="text-2xl font-extrabold mt-1">{formatPrice(todayEarned)}</p>
        </KaspiCard>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <KaspiCard className="!p-4">
          <ClipboardList className="w-5 h-5 text-[var(--gp-text-muted)] mb-2" />
          <p className="text-2xl font-extrabold">{activeOrders.length}</p>
          <p className="text-xs text-[var(--gp-text-muted)]">активных заказов</p>
        </KaspiCard>
        <KaspiCard className="!p-4">
          <Star className="w-5 h-5 text-amber-500 mb-2 fill-amber-500" />
          <p className="text-2xl font-extrabold">{user.rating?.toFixed?.(1) || '4.9'}</p>
        </KaspiCard>
      </div>

      <KaspiCard className="!p-4">
        <p className="font-bold flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          График работ
        </p>
        {loading ? (
          <SkeletonBlock className="h-24" />
        ) : (
          <div className="flex items-end gap-1 h-24">
            {chart.map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-emerald-500/70" style={{ height: `${h}%` }} />
            ))}
          </div>
        )}
      </KaspiCard>
    </div>
  )
}
