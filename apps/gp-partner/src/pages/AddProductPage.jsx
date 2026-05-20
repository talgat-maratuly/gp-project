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
    <div>
      <h1 className="text-xl font-bold mb-4">Добавить товар</h1>
      <p className="text-xs text-slate-500 mb-4">Товар появится в GP Shop у всех клиентов</p>
      <form onSubmit={submit} className="partner-card p-5 space-y-4">
        <input placeholder="Название" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full p-3 rounded-xl bg-[#0a0f1a] border border-white/10" required />
        <input placeholder="Цена, ₸" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full p-3 rounded-xl bg-[#0a0f1a] border border-white/10" required />
        <input placeholder="Остаток, шт" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full p-3 rounded-xl bg-[#0a0f1a] border border-white/10" required />
        <label className="block text-sm text-slate-400">
          Категория
          <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-[#0a0f1a] border border-white/10">
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-slate-400">
          Описание
          <textarea
            placeholder="Общее описание товара"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full mt-1 p-3 rounded-xl bg-[#0a0f1a] border border-white/10 text-slate-200 placeholder:text-slate-600"
          />
        </label>
        <label className="block text-sm text-slate-400">
          Характеристики
          <textarea
            placeholder={'Каждая строка — отдельный пункт.\nПример:\nЗона полива: 4\nДавление: 1–6 бар'}
            value={form.specifications}
            onChange={(e) => setForm({ ...form, specifications: e.target.value })}
            rows={5}
            className="w-full mt-1 p-3 rounded-xl bg-[#0a0f1a] border border-white/10 font-mono text-sm text-slate-200 placeholder:text-slate-600"
          />
        </label>
        <p className="text-[11px] text-slate-500 leading-snug -mt-1">
          Формат удобен как «название: значение». Простые строки без двоеточия тоже поддерживаются.
        </p>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={saving} className="w-full py-3 partner-gradient rounded-xl font-bold disabled:opacity-50">
          {saving ? 'Сохранение…' : 'Сохранить в GP Shop'}
        </button>
      </form>
    </div>
  )
}
