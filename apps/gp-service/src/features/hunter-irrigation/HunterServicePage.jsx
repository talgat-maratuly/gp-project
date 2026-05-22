import { Link } from 'react-router-dom'
import { Droplets, Plus, List } from 'lucide-react'
import { useLanguage } from '../../i18n'
import { KaspiButton, KaspiCard } from '@gp/shared/ui/KaspiUI'

export default function HunterServicePage() {
  const { t } = useLanguage()

  return (
    <div className="px-4 py-4">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-6 mb-6">
        <Droplets className="w-10 h-10 mb-3 opacity-90" />
        <h1 className="text-2xl font-extrabold">{t('hunter_title')}</h1>
        <p className="text-sm text-emerald-100 mt-2">{t('hunter_subtitle')}</p>
      </div>
      <KaspiCard className="!p-4 mb-4 text-sm text-[var(--gp-text-muted)]">{t('hunter_disclaimer')}</KaspiCard>
      <Link to="/services/hunter-irrigation/new" className="block mb-3">
        <KaspiButton className="w-full flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> {t('hunter_new_project')}</KaspiButton>
      </Link>
      <Link to="/shop/catalog/hunter_irrigation" className="block text-center text-sm font-semibold text-emerald-600 mb-4">{t('hunter_market_link')}</Link>
      <Link to="/orders" className="flex items-center gap-2 text-sm font-bold text-[var(--gp-text)]"><List className="w-4 h-4" /> {t('hunter_my_projects')}</Link>
    </div>
  )
}
