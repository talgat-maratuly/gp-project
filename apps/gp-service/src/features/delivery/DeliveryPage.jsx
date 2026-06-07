import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@gp/shared/api'
import { PageHeader } from '@gp/shared/ui/KaspiUI'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useService } from '../../context/ServiceContext'
import { useLanguage } from '../../i18n'

const initialForm = {
  fromCity: 'Уральск',
  toCity: 'Астана',
  pickupAddress: '',
  deliveryAddress: '',
  cargoType: 'plants',
  cargoDescription: '',
  weightKg: '',
  volumeM3: '',
  desiredDate: '',
}

export default function DeliveryPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { profile, isLoggedIn } = useService()
  const [routes, setRoutes] = useState([])
  const [orders, setOrders] = useState([])
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const cityId = profile.cityId || 'city-uralsk'

  const refresh = async () => {
    const [routeRows, orderRows] = await Promise.all([
      api.getDeliveryRoutes({ fromCity: form.fromCity }).catch(() => []),
      isLoggedIn ? api.getMyDeliveryOrders().catch(() => []) : Promise.resolve([]),
    ])
    setRoutes(Array.isArray(routeRows) ? routeRows : [])
    setOrders(Array.isArray(orderRows) ? orderRows : [])
  }

  useEffect(() => {
    refresh()
  }, [isLoggedIn])

  const createOrder = async (e) => {
    e.preventDefault()
    if (!isLoggedIn) {
      navigate('/login', { state: { from: '/delivery' } })
      return
    }
    setLoading(true)
    setMessage('')
    try {
      await api.createDeliveryOrder({ ...form, cityId })
      setForm(initialForm)
      setMessage(t('delivery_create_order'))
      await refresh()
    } catch (err) {
      setMessage(err.message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const acceptOffer = async (id) => {
    setLoading(true)
    try {
      await api.acceptDeliveryOffer(id)
      await refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-4 space-y-5">
      <PageHeader title={t('delivery_title')} subtitle={profile.city || 'Уральск'} onBack={() => navigate(-1)} />

      {message && <div className="gp-card p-3 text-sm text-gp-green-700">{message}</div>}

      <section className="gp-card p-4">
        <h2 className="font-bold mb-3">{t('delivery_routes')}</h2>
        <div className="space-y-2">
          {routes.length === 0 && <p className="text-sm text-slate-500">{t('nursery_empty')}</p>}
          {routes.slice(0, 8).map((r) => (
            <div key={r.id} className="border rounded-xl p-3">
              <p className="font-semibold">{r.fromCity} → {r.toCity}</p>
              <p className="text-xs text-slate-500">{r.transportType || r.deliveryPartner?.transportType} · {r.availableDate?.slice(0, 10) || '—'}</p>
              {r.price && <p className="text-sm font-bold mt-1">{Number(r.price).toLocaleString()} ₸</p>}
            </div>
          ))}
        </div>
      </section>

      <form onSubmit={createOrder} className="gp-card p-4 space-y-3">
        <h2 className="font-bold">{t('delivery_create_order')}</h2>
        <Input label={t('delivery_from_city')} value={form.fromCity} onChange={(e) => setForm({ ...form, fromCity: e.target.value })} required />
        <Input label={t('delivery_to_city')} value={form.toCity} onChange={(e) => setForm({ ...form, toCity: e.target.value })} required />
        <Input label={t('delivery_pickup_address')} value={form.pickupAddress} onChange={(e) => setForm({ ...form, pickupAddress: e.target.value })} />
        <Input label={t('delivery_address')} value={form.deliveryAddress} onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })} />
        <Input label={t('delivery_cargo')} value={form.cargoDescription} onChange={(e) => setForm({ ...form, cargoDescription: e.target.value })} required />
        <Input label="кг" type="number" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} />
        <Input label="м³" type="number" value={form.volumeM3} onChange={(e) => setForm({ ...form, volumeM3: e.target.value })} />
        <Input label={t('nursery_desired_date')} type="date" value={form.desiredDate} onChange={(e) => setForm({ ...form, desiredDate: e.target.value })} />
        <Button type="submit" disabled={loading}>{t('delivery_create_order')}</Button>
      </form>

      {orders.length > 0 && (
        <section className="gp-card p-4 space-y-3">
          <h2 className="font-bold">{t('delivery_orders')}</h2>
          {orders.map((o) => (
            <div key={o.id} className="border rounded-xl p-3">
              <p className="font-semibold">{o.fromCity} → {o.toCity}</p>
              <p className="text-xs text-slate-500">{o.status}</p>
              {(o.offers || []).map((offer) => (
                <button key={offer.id} type="button" disabled={loading || offer.status === 'ACCEPTED'} onClick={() => acceptOffer(offer.id)} className="w-full mt-2 p-2 rounded-lg bg-emerald-50 text-left text-sm">
                  {Number(offer.price).toLocaleString()} ₸ · {offer.etaDate?.slice(0, 10) || '—'} · {offer.status}
                </button>
              ))}
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
