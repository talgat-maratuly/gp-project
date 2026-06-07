import { useEffect, useState } from 'react'
import { api } from '@gp/shared/api'
import { useLanguage } from '../i18n'

const initial = {
  fromCity: 'Уральск',
  toCity: 'Астана',
  transportType: 'Газель',
  price: '',
  availableDate: '',
}

export default function DeliveryRoutesPage() {
  const { t } = useLanguage()
  const [me, setMe] = useState(null)
  const [form, setForm] = useState(initial)
  const [message, setMessage] = useState('')

  const refresh = async () => setMe(await api.partnerDeliveryMe().catch(() => null))

  useEffect(() => {
    refresh()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      await api.partnerDeliveryCreateRoute(form)
      setForm(initial)
      await refresh()
    } catch (err) {
      setMessage(err.message || 'Ошибка')
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">{t('delivery_routes')}</h1>
      {me && <p className="text-sm text-[var(--gp-text-muted)]">{me.transportType} · {me.status}</p>}
      {message && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
      <form onSubmit={submit} className="gp-card p-4 space-y-3">
        {[
          ['fromCity', t('delivery_from_city')],
          ['toCity', t('delivery_to_city')],
          ['transportType', 'Транспорт'],
          ['price', t('priceFrom')],
        ].map(([key, label]) => (
          <label key={key} className="block text-sm">
            <span className="font-semibold">{label}</span>
            <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full mt-1 p-3 rounded-xl border" required={key !== 'price'} />
          </label>
        ))}
        <input type="date" value={form.availableDate} onChange={(e) => setForm({ ...form, availableDate: e.target.value })} className="w-full p-3 rounded-xl border" />
        <button className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold">{t('delivery_routes')}</button>
      </form>
      <div className="space-y-2">
        {(me?.routes || []).map((r) => (
          <div key={r.id} className="gp-card p-3">
            <p className="font-semibold">{r.fromCity} → {r.toCity}</p>
            <p className="text-xs text-[var(--gp-text-muted)]">{r.availableDate?.slice(0, 10) || '—'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
