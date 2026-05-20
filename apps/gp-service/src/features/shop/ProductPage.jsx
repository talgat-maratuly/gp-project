import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Heart, ShoppingCart } from 'lucide-react'
import { formatPrice, parseProductSpecifications } from '@gp/shared/utils'
import { useService } from '../../context/ServiceContext'
import Button from '../../components/ui/Button'

export default function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getProductById, addToCart, toggleFavorite, isFavorite } = useService()
  const [qty, setQty] = useState(1)
  const product = getProductById(id)

  if (!product) {
    return <div className="p-8 text-center"><Button onClick={() => navigate('/shop')}>В каталог</Button></div>
  }

  const fav = isFavorite(product.id)
  const specRows = parseProductSpecifications(product.specifications || '')

  return (
    <div className="px-4 py-4">
      <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gp-blue-600 mb-4">
        <ChevronLeft className="w-4 h-4" /> Назад
      </button>
      <div className="aspect-square rounded-2xl gp-gradient mb-4 flex items-center justify-center">
        <ShoppingCart className="w-16 h-16 text-white/40" />
      </div>
      <p className="text-xs text-slate-500 mb-1">{product.brand || product.partnerName}</p>
      <h1 className="text-xl font-bold mb-2">{product.name}</h1>
      <p className="text-2xl font-bold text-gp-green-700 mb-4">{formatPrice(product.price)}</p>

      {(product.description || '').trim().length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-1">Описание</h2>
          <p className="text-slate-600 text-sm whitespace-pre-wrap">{product.description}</p>
        </div>
      )}

      {specRows.length > 0 && (
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-2">Характеристики</h2>
          <dl className="space-y-2 text-sm">
            {specRows.map((row, idx) => (
              <div
                key={`${product.id}-spec-${idx}`}
                className={`grid gap-x-3 ${row.name ? 'grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:grid-cols-[140px_1fr]' : 'grid-cols-1'}`}
              >
                {row.name && <dt className="text-slate-500">{row.name}</dt>}
                <dd className={row.name ? 'text-slate-800 font-medium' : 'text-slate-700'}>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <div className="flex gap-2 mb-4">
        <Button className="flex-1" disabled={!product.inStock} onClick={() => addToCart(product.id, qty)}>В корзину ×{qty}</Button>
        <Button variant={fav ? 'danger' : 'secondary'} onClick={() => toggleFavorite(product.id)}><Heart className={fav ? 'fill-current' : ''} /></Button>
      </div>
      <Button variant="outline" className="w-full" disabled={!product.inStock} onClick={() => { addToCart(product.id, qty); navigate('/shop/checkout') }}>
        Купить сейчас
      </Button>
    </div>
  )
}
