import { useAccess } from '../context/AccessContext'
import { useLanguage } from '../i18n/LanguageContext'
import { formatPrice } from '@gp/shared/utils'

export default function MarketOrdersPage() {
  const { t } = useLanguage()
  const { scopedMarketOrders } = useAccess()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{t('market_orders')}</h1>
      <ul className="space-y-2">
        {scopedMarketOrders.map((o) => (
          <li key={o.id} className="rounded-xl border border-white/10 p-4">
            <div className="flex justify-between">
              <span className="font-bold">#{o.orderNumber}</span>
              <span className="text-emerald-400">{formatPrice(o.finalAmount)}</span>
            </div>
            <p className="text-sm text-slate-400 mt-1">{o.clientName} · {o.city}</p>
            <p className="text-xs mt-2">{t('status')}: {t(`market_status_${o.status}`)} · {t('market_payment')}: {o.paymentStatus}</p>
            <p className="text-xs text-slate-500">{o.deliveryType === 'PICKUP' ? t('market_pickup') : t('market_delivery')}</p>
          </li>
        ))}
        {!scopedMarketOrders.length && <p className="text-slate-500">{t('orders_empty')}</p>}
      </ul>
    </div>
  )
}
