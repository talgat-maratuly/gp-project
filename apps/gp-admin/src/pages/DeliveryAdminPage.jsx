import { useEffect, useState } from 'react'
import { api } from '@gp/shared/api'
import { useLanguage } from '../i18n/LanguageContext'

export default function DeliveryAdminPage() {
  const { t } = useLanguage()
  const [partners, setPartners] = useState([])
  const [orders, setOrders] = useState([])

  const refresh = async () => {
    const [p, o] = await Promise.all([
      api.adminDeliveryPartners().catch(() => []),
      api.adminDeliveryOrders().catch(() => []),
    ])
    setPartners(Array.isArray(p) ? p : [])
    setOrders(Array.isArray(o) ? o : [])
  }

  useEffect(() => {
    refresh()
  }, [])

  const act = async (id, kind) => {
    if (kind === 'approve') await api.adminApproveDeliveryPartner(id)
    else await api.adminRejectDeliveryPartner(id)
    await refresh()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('delivery_admin')}</h1>
      <section className="admin-card p-4">
        <h2 className="font-bold mb-3">{t('delivery_apply')}</h2>
        <div className="space-y-2">
          {partners.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-700 p-3">
              <p className="font-semibold">{p.partner?.companyName || p.partner?.user?.name || p.transportType} · {p.city}</p>
              <p className="text-xs text-slate-400">{p.transportType} · {p.capacityKg || '—'} кг · {p.status}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => act(p.id, 'approve')} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm">{t('approve')}</button>
                <button onClick={() => act(p.id, 'reject')} className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm">{t('reject')}</button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="admin-card p-4">
        <h2 className="font-bold mb-3">{t('delivery_orders')}</h2>
        {orders.map((o) => (
          <div key={o.id} className="border-b border-slate-700 py-2">
            <p className="font-semibold">{o.fromCity} → {o.toCity}</p>
            <p className="text-xs text-slate-400">{o.cargoType} · {o.status} · {o.offers?.length || 0} offers</p>
          </div>
        ))}
      </section>
    </div>
  )
}
