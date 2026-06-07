import { usePartner } from '../context/PartnerContext'
import { useLanguage } from '../i18n'

export default function NewOrdersPage() {
  const { newOrders, isDemoMode } = usePartner()
  const { t } = useLanguage()

  return (
    <div>
      <h1 className="text-xl font-bold text-[var(--gp-text)] mb-2">{t('new_orders_title')}</h1>
      {isDemoMode ? (
        <p className="text-sm text-[var(--gp-text-muted)]">{t('admin_assign_hint')}</p>
      ) : (
        <p className="text-xs text-[var(--gp-text-muted)] mb-3">{t('orders')}</p>
      )}
      {!newOrders.length && <p className="text-[var(--gp-text-muted)] mt-4">{t('new_orders_empty')}</p>}
    </div>
  )
}
