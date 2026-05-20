import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ClipboardList, Star, TrendingUp, Wallet } from 'lucide-react'
import { formatPrice } from '@gp/shared/utils'
import { KaspiButton, KaspiCard, SkeletonBlock } from '@gp/shared/ui/KaspiUI'
import { usePartner } from '../context/PartnerContext'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, newOrders, activeOrders, loading } = usePartner()

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

      <KaspiCard className="!p-5 gp-gradient-kaspi text-white border-0 shadow-[var(--gp-shadow-lg)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium">Баланс</p>
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
        <KaspiCard onClick={() => navigate('/orders')} className="!p-4">
          <p className="text-xs font-bold text-emerald-600 uppercase">Новые</p>
          <p className="text-2xl font-extrabold mt-1">{newOrders.length}</p>
          <p className="text-xs text-[var(--gp-text-muted)] mt-1">заявки</p>
        </KaspiCard>
        <KaspiCard className="!p-4">
          <p className="text-xs font-bold text-blue-600 uppercase">Сегодня</p>
          <p className="text-2xl font-extrabold mt-1">{formatPrice(todayEarned)}</p>
          <p className="text-xs text-[var(--gp-text-muted)] mt-1">заработано</p>
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
          <p className="text-xs text-[var(--gp-text-muted)]">рейтинг</p>
        </KaspiCard>
      </div>

      <KaspiCard className="!p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Заказы за неделю
          </p>
        </div>
        {loading ? (
          <SkeletonBlock className="h-28" />
        ) : (
          <div className="flex items-end gap-2 h-28">
            {chart.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-xl gp-gradient-kaspi opacity-90 min-h-[8px] transition-all"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        )}
      </KaspiCard>

      {newOrders[0] && (
        <KaspiCard className="!p-4">
          <p className="text-xs font-bold text-emerald-600 mb-2">Срочная заявка</p>
          <p className="font-bold">{newOrders[0].serviceName || 'Новый заказ'}</p>
          <p className="text-lg font-extrabold mt-1">{formatPrice(newOrders[0].total)}</p>
          <KaspiButton size="md" className="mt-3" onClick={() => navigate('/orders')}>
            Открыть заявки
          </KaspiButton>
        </KaspiCard>
      )}
    </div>
  )
}
