import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { usePartner } from '../context/PartnerContext'
import { formatPrice } from '@gp/shared/utils'

export default function PartnerShopPage() {
  const { products, refreshAll } = usePartner()

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Магазин</h1>
          <p className="text-xs text-slate-500">Товары видны клиентам в GP Shop</p>
        </div>
        <Link to="/catalog/add" className="p-3 rounded-2xl partner-gradient shadow-lg" title="Добавить товар">
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      <button
        type="button"
        onClick={() => refreshAll()}
        className="text-xs text-emerald-400 mb-3 underline"
      >
        Обновить список
      </button>

      <ul className="space-y-2">
        {products.map((p) => (
          <li key={p.id} className="partner-card p-4 flex justify-between items-center">
            <div>
              <p className="font-semibold text-white">{p.name}</p>
              <p className="text-xs text-slate-500">{p.categoryId} · остаток {p.stock}</p>
            </div>
            <span className="text-emerald-400 font-bold">{formatPrice(p.price)}</span>
          </li>
        ))}
        {!products.length && (
          <li className="text-center py-8">
            <p className="text-slate-500 text-sm mb-3">Товаров пока нет</p>
            <Link to="/catalog/add" className="inline-block py-2 px-4 rounded-xl partner-gradient text-sm font-semibold">
              Добавить первый товар
            </Link>
          </li>
        )}
      </ul>
    </div>
  )
}
