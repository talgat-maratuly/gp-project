import { Link } from 'react-router-dom'
import { LayoutGrid, Plus } from 'lucide-react'
import { useLanguage } from '../../i18n'
import { KaspiButton, KaspiCard } from '@gp/shared/ui/KaspiUI'

export default function FurnitureServicePage() {
  const { t } = useLanguage()

  return (
    <div className="px-4 py-4">
      <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-white border border-slate-200 p-6 mb-6">
        <LayoutGrid className="w-10 h-10 text-slate-700 mb-3" />
        <h1 className="text-2xl font-extrabold text-slate-900">{t('furniture_title')}</h1>
        <p className="text-sm text-slate-600 mt-2">{t('furniture_subtitle')}</p>
      </div>
      <Link to="/services/furniture/new" className="block mb-3">
        <KaspiButton className="w-full flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> {t('furniture_new_project')}</KaspiButton>
      </Link>
      <Link to="/shop/catalog/furniture" className="block text-center text-sm font-semibold text-slate-700 mb-4">{t('furniture_market_link')}</Link>
      <div className="grid gap-2 mb-4">
        <Link to="/services/furniture-assembly" className="block text-center text-sm font-semibold text-slate-800 py-3 rounded-xl border border-slate-200 bg-white">Сборка мебели</Link>
        <Link to="/services/furniture-repair" className="block text-center text-sm font-semibold text-slate-800 py-3 rounded-xl border border-slate-200 bg-white">Ремонт мебели</Link>
      </div>
      <KaspiCard className="!p-4 text-xs text-[var(--gp-text-muted)]">{t('furniture_planner_note')}</KaspiCard>
    </div>
  )
}
