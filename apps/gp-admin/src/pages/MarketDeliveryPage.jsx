import { useAccess } from '../context/AccessContext'
import { useLanguage } from '../i18n/LanguageContext'

export default function MarketDeliveryPage() {
  const { t } = useLanguage()
  const { scopedDelivery } = useAccess()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{t('market_delivery')}</h1>
      <ul className="space-y-2">
        {scopedDelivery.map((d) => (
          <li key={d.id} className="rounded-xl border border-white/10 p-4">
            <p className="font-bold">{d.name}</p>
            <p className="text-sm text-slate-400">{d.city} · {d.phone}</p>
            <p className="text-xs mt-1">{d.priceType} · {d.basePrice} ₸ · {d.isActive ? t('active') : t('inactive')}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
