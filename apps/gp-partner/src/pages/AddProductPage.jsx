import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePartner } from '../context/PartnerContext'

const CATEGORIES = [
  { id: 'plants', name: 'Растения' },
  { id: 'lawn', name: 'Газон' },
  { id: 'irrigation', name: 'Автополив' },
  { id: 'hunter', name: 'Hunter' },
  { id: 'pumps', name: 'Насосы' },
  { id: 'filters', name: 'Фильтры' },
  { id: 'fertilizers', name: 'Удобрения' },
  { id: 'lighting', name: 'Освещение' },
  { id: 'tools', name: 'Инструменты' },
  { id: 'consumables', name: 'Расходники' },
  { id: 'parts', name: 'Комплектующие' },
]

export default function AddProductPage() {
  const navigate = useNavigate()
  const { addProduct, user } = usePartner()
  const [form, setForm] = useState({
    name: '', price: '', stock: '10', categoryId: 'irrigation', description: '', specifications: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (!user) {
        setError('Войдите в аккаунт партнёра')
        return
      }
      await addProduct({
        name: form.name.trim(),
        price: Number(form.price),
        stock: Math.floor(Number(form.stock)),
        categoryId: form.categoryId,
        description: form.description.trim(),
        specifications: form.specifications.trim(),
      })
      navigate('/shop', { replace: true })
    } catch (err) {
      setError(err.message || 'Ошибка сохранения. Проверьте, что API запущен (npm run dev:api).')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-1 text-[var(--gp-text)]">Добавить товар</h1>
      <p className="text-sm text-[var(--gp-text-muted)] mb-4">Товар появится в GP Shop у клиентов вашего региона</p>
      <form onSubmit={submit} className="partner-card p-4 sm:p-5 gp-form-stack">
        <div className="gp-form-field">
          <label className="gp-form-label" htmlFor="product-name">Название товара</label>
          <input
            id="product-name"
            placeholder="Например: Семена газона 1 кг"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="gp-input-kaspi"
            required
            autoComplete="off"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="gp-form-field">
            <label className="gp-form-label" htmlFor="product-price">Цена, ₸</label>
            <input
              id="product-price"
              placeholder="15000"
              type="number"
              min="0"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="gp-input-kaspi"
              required
            />
          </div>
          <div className="gp-form-field">
            <label className="gp-form-label" htmlFor="product-stock">Остаток, шт</label>
            <input
              id="product-stock"
              placeholder="10"
              type="number"
              min="0"
              inputMode="numeric"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="gp-input-kaspi"
              required
            />
          </div>
        </div>

        <div className="gp-form-field">
          <label className="gp-form-label" htmlFor="product-category">Категория</label>
          <select
            id="product-category"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="gp-input-kaspi"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="gp-form-field">
          <label className="gp-form-label" htmlFor="product-description">Описание</label>
          <textarea
            id="product-description"
            placeholder="Краткое описание для клиентов"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="gp-textarea-kaspi"
          />
        </div>

        <div className="gp-form-field">
          <label className="gp-form-label" htmlFor="product-specs">Характеристики</label>
          <span className="gp-form-hint">Каждая строка — отдельный пункт. Пример: Зона полива: 4</span>
          <textarea
            id="product-specs"
            placeholder={'Зона полива: 4\nДавление: 1–6 бар'}
            value={form.specifications}
            onChange={(e) => setForm({ ...form, specifications: e.target.value })}
            rows={5}
            className="gp-textarea-kaspi font-mono text-sm"
          />
        </div>

        {error && <p className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
        <button type="submit" disabled={saving} className="w-full min-h-[48px] py-3 partner-gradient rounded-xl font-bold text-white disabled:opacity-50">
          {saving ? 'Сохранение…' : 'Сохранить в GP Shop'}
        </button>
      </form>
    </div>
  )
}
