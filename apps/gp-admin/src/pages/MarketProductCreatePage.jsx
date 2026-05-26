import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MARKET_CATEGORIES } from '@gp/shared/constants'
import { api } from '@gp/shared/api'
import { useLanguage } from '../i18n/LanguageContext'

export default function MarketProductCreatePage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [stores, setStores] = useState([])
  const [form, setForm] = useState({
    storeId: '',
    name: '',
    description: '',
    categoryId: 'plants',
    price: '',
    quantity: '1',
    isActive: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    api.adminMarketProducts()
      .then((products) => {
        const map = new Map()
        for (const p of products || []) {
          if (p.store?.id) map.set(p.store.id, p.store)
        }
        setStores([...map.values()])
      })
      .catch(() => setStores([]))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await api.adminCreateMarketProduct({
        storeId: form.storeId,
        name: form.name.trim(),
        description: form.description.trim(),
        categoryId: form.categoryId,
        price: Number(form.price),
        quantity: Number(form.quantity),
        isActive: form.isActive,
      })
      setSuccess('Товар создан')
      setTimeout(() => navigate('/market/products', { replace: true }), 800)
    } catch (err) {
      setError(err?.message || t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-2">{t('market_products')} — создать</h1>
      <Link to="/market/products" className="text-sm text-sky-400 mb-4 inline-block">← {t('back')}</Link>
      <form onSubmit={submit} className="admin-card space-y-3">
        <label className="block text-xs text-slate-400">
          Магазин
          <select
            className="admin-input mt-1"
            value={form.storeId}
            onChange={(e) => setForm({ ...form, storeId: e.target.value })}
            required
          >
            <option value="">—</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
            ))}
          </select>
        </label>
        <input className="admin-input" placeholder="Название" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <textarea className="admin-input min-h-[80px]" placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <select className="admin-input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
          {MARKET_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{t(c.labelKey)}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <input className="admin-input" type="number" min="0" placeholder="Цена" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <input className="admin-input w-28" type="number" min="0" placeholder="Остаток" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-emerald-400 text-sm">{success}</p>}
        <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-sky-600 font-bold text-sm disabled:opacity-50">
          {loading ? t('loading') : t('save')}
        </button>
      </form>
    </div>
  )
}
