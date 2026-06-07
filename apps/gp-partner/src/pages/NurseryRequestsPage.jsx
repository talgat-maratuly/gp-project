import { useEffect, useState } from 'react'
import { api } from '@gp/shared/api'
import { useLanguage } from '../i18n'

export default function NurseryRequestsPage() {
  const { t } = useLanguage()
  const [requests, setRequests] = useState([])
  const [preorders, setPreorders] = useState([])
  const [drafts, setDrafts] = useState({})
  const [message, setMessage] = useState('')

  const refresh = async () => {
    const [requestRows, preorderRows] = await Promise.all([
      api.partnerNurseryRequestFeed().catch(() => []),
      api.partnerGrowingPreorderFeed().catch(() => []),
    ])
    setRequests(Array.isArray(requestRows) ? requestRows : [])
    setPreorders(Array.isArray(preorderRows) ? preorderRows : [])
  }

  useEffect(() => {
    refresh()
  }, [])

  const change = (id, patch) => setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))

  const offerRequest = async (id) => {
    const d = drafts[id] || {}
    setMessage('')
    try {
      await api.partnerNurseryCreateOffer(id, {
        pricePerUnit: d.pricePerUnit || 0,
        availableQty: d.availableQty || 1,
        supplyDate: d.supplyDate,
        deliveryTerms: d.deliveryTerms,
        comment: d.comment,
      })
      await refresh()
    } catch (err) {
      setMessage(err.message || 'Ошибка')
    }
  }

  const offerPreorder = async (id) => {
    const d = drafts[id] || {}
    setMessage('')
    try {
      await api.partnerGrowingPreorderOffer(id, {
        pricePerUnit: d.pricePerUnit || 0,
        readyDate: d.supplyDate,
        minBatch: d.availableQty || 1,
        paymentTerms: d.deliveryTerms,
        comment: d.comment,
      })
      await refresh()
    } catch (err) {
      setMessage(err.message || 'Ошибка')
    }
  }

  const OfferFields = ({ id, onSend }) => (
    <div className="grid grid-cols-2 gap-2 mt-3">
      <input className="p-2 rounded-lg border" placeholder={t('nursery_price_per_unit')} value={drafts[id]?.pricePerUnit || ''} onChange={(e) => change(id, { pricePerUnit: e.target.value })} />
      <input className="p-2 rounded-lg border" placeholder={t('nursery_available_qty')} value={drafts[id]?.availableQty || ''} onChange={(e) => change(id, { availableQty: e.target.value })} />
      <input className="p-2 rounded-lg border" type="date" value={drafts[id]?.supplyDate || ''} onChange={(e) => change(id, { supplyDate: e.target.value })} />
      <input className="p-2 rounded-lg border" placeholder={t('delivery_routes')} value={drafts[id]?.deliveryTerms || ''} onChange={(e) => change(id, { deliveryTerms: e.target.value })} />
      <button type="button" onClick={onSend} className="col-span-2 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold">{t('nursery_send_offer')}</button>
    </div>
  )

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">{t('nursery_requests')}</h1>
      {message && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
      {requests.length === 0 && preorders.length === 0 && <p className="text-sm text-[var(--gp-text-muted)]">{t('nursery_empty')}</p>}
      {requests.map((r) => (
        <div key={r.id} className="gp-card p-4">
          <p className="font-bold">{r.plantName} · {r.quantity}</p>
          <p className="text-xs text-[var(--gp-text-muted)]">{r.city} · {r.heightCm || '—'} см · {r.status}</p>
          <p className="text-sm mt-2">{r.comment}</p>
          <OfferFields id={r.id} onSend={() => offerRequest(r.id)} />
        </div>
      ))}
      <h2 className="text-lg font-bold">{t('growing_preorders')}</h2>
      {preorders.map((r) => (
        <div key={r.id} className="gp-card p-4">
          <p className="font-bold">{r.plantName} · {r.quantity}</p>
          <p className="text-xs text-[var(--gp-text-muted)]">{r.city} · {r.deliveryDate?.slice(0, 10) || '—'} · {r.status}</p>
          <p className="text-sm mt-2">{r.comment}</p>
          <OfferFields id={r.id} onSend={() => offerPreorder(r.id)} />
        </div>
      ))}
    </div>
  )
}
