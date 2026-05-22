import { usePartner } from '../context/PartnerContext'
import { useLanguage } from '../i18n'

export default function NewOrdersPage() {
  const { newOrders, isDemoMode } = usePartner()
  const { t } = useLanguage()

  return (
    <div>
      <h1 className="text-xl font-bold mb-2">{t('new_orders_title')}</h1>
      {isDemoMode ? (
        <p className="text-sm text-slate-400">{t('admin_assign_hint')}</p>
      ) : (
        <p className="text-xs text-slate-500 mb-3">{t('orders')}</p>
      )}
      {!newOrders.length && <p className="text-slate-500 mt-4">{t('new_orders_empty')}</p>}
    </div>
  )
}
