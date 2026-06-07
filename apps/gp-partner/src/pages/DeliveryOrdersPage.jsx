import { useEffect, useState } from 'react'
import { api } from '@gp/shared/api'
import { useLanguage } from '../i18n'

export default function DeliveryOrdersPage() {
  const { t } = useLanguage()
  const [orders, setOrders] = useState([])
  const [drafts, setDrafts] = useState({})
  const [message, setMessage] = useState('')

  const refresh = async () => setOrders(await api.partnerDeliveryOrderFeed().catch(() => []))

  useEffect(() => {
    refresh()
  }, [])

  const change = (id, patch) => setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))

  const sendOffer = async (id) => {
    const d = drafts[id] || {}
    setMessage('')
    try {
      await api.partnerDeliveryCreateOffer(id, {
        price: d.price || 0,
        pickupDate: d.pickupDate,
        etaDate: d.etaDate,
        comment: d.comment,
      })
      await refresh()
    } catch (err) {
      setMessage(err.message || 'Ошибка')
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">{t('delivery_orders')}</h1>
      {message && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
      {orders.length === 0 && <p className="text-sm text-[var(--gp-text-muted)]">{t('nursery_empty')}</p>}
      {orders.map((o) => (
        <div key={o.id} className="gp-card p-4">
          <p className="font-bold">{o.fromCity} → {o.toCity}</p>
          <p className="text-xs text-[var(--gp-text-muted)]">{o.cargoType} · {o.status}</p>
          <p className="text-sm mt-2">{o.cargoDescription}</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <input className="p-2 rounded-lg border" placeholder={t('priceFrom')} value={drafts[o.id]?.price || ''} onChange={(e) => change(o.id, { price: e.target.value })} />
            <input className="p-2 rounded-lg border" type="date" value={drafts[o.id]?.etaDate || ''} onChange={(e) => change(o.id, { etaDate: e.target.value })} />
            <input className="col-span-2 p-2 rounded-lg border" placeholder={t('nursery_comment')} value={drafts[o.id]?.comment || ''} onChange={(e) => change(o.id, { comment: e.target.value })} />
            <button type="button" onClick={() => sendOffer(o.id)} className="col-span-2 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold">{t('delivery_send_offer')}</button>
          </div>
        </div>
      ))}
    </div>
  )
}
