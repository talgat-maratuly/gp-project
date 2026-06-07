import { useEffect, useState } from 'react'
import { api } from '@gp/shared/api'
import { useLanguage } from '../i18n'

const initial = {
  name: '',
  category: 'trees',
  plantType: 'trees',
  quantity: 100,
  heightCm: 200,
  ageMonths: '',
  price: '',
  delivery: true,
  growToOrder: true,
  description: '',
}

export default function NurseryProductsPage() {
  const { t } = useLanguage()
  const [nursery, setNursery] = useState(null)
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(initial)
  const [message, setMessage] = useState('')

  const refresh = async () => {
    const [me, rows] = await Promise.all([
      api.partnerNurseryMe().catch(() => null),
      api.partnerNurseryProducts().catch(() => []),
    ])
    setNursery(me)
    setProducts(Array.isArray(rows) ? rows : [])
  }

  useEffect(() => {
    refresh()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      await api.partnerNurseryCreateProduct(form)
      setForm(initial)
      await refresh()
    } catch (err) {
      setMessage(err.message || 'Ошибка')
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">{t('nursery_products')}</h1>
      {nursery && <p className="text-sm text-[var(--gp-text-muted)]">{nursery.name} · {nursery.status}</p>}
      {message && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
      <form onSubmit={submit} className="gp-card p-4 space-y-3">
        {[
          ['name', t('nursery_plant_name')],
          ['category', t('nursery_plant_type')],
          ['quantity', t('nursery_quantity')],
          ['heightCm', t('nursery_height')],
          ['ageMonths', t('nursery_age')],
          ['price', t('nursery_price_per_unit')],
        ].map(([key, label]) => (
          <label key={key} className="block text-sm">
            <span className="font-semibold">{label}</span>
            <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full mt-1 p-3 rounded-xl border" required={key === 'name'} />
          </label>
        ))}
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full p-3 rounded-xl border" placeholder={t('nursery_comment')} />
        <button className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold">{t('market_add_product')}</button>
      </form>
      <div className="space-y-2">
        {products.map((p) => (
          <div key={p.id} className="gp-card p-3">
            <p className="font-semibold">{p.name}</p>
            <p className="text-xs text-[var(--gp-text-muted)]">{p.category} · {p.quantity} · {p.availability}</p>
            {p.price && <p className="text-sm font-bold">{Number(p.price).toLocaleString()} ₸</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
