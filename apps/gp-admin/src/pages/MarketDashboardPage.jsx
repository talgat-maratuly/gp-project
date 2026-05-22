import { useAccess } from '../context/AccessContext'
import { useLanguage } from '../i18n/LanguageContext'

export default function MarketDashboardPage() {
  const { t } = useLanguage()
  const { scopedStore, marketStats } = useAccess()

  const s = marketStats || {}
  const cards = [
    { label: t('market_total_products'), value: s.totalProducts ?? 0 },
    { label: t('market_active_products'), value: s.activeProducts ?? 0 },
    { label: t('market_shops'), value: s.shops ?? 0 },
    { label: t('market_orders'), value: s.orders ?? 0 },
    { label: t('market_turnover'), value: `${(s.turnover ?? 0).toLocaleString()} ₸` },
    { label: t('market_problem_orders'), value: s.problemOrders ?? 0 },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{t('market_dashboard')}</h1>
      <p className="text-sm text-slate-400 mb-6">{t('market_legal_note')}</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className="text-2xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-6">{t('market_demo_cities')}: {scopedStore.franchises?.map((f) => f.city).join(', ')}</p>
    </div>
  )
}
