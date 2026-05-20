import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { formatPrice } from '@gp/shared/utils'
import { useService } from '../../context/ServiceContext'

export default function ProductCard({ product }) {
  const { addToCart, toggleFavorite, isFavorite, notify } = useService()
  const fav = isFavorite(product.id)
  const inStock = product.inStock ?? product.stock > 0

  return (
    <article className="gp-card-kaspi overflow-hidden flex flex-col gp-animate-in">
      <Link to={`/shop/product/${product.id}`} className="block relative">
        <div className="aspect-square bg-gradient-to-br from-emerald-500/90 to-blue-600/90 flex items-center justify-center">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <ShoppingCart className="w-12 h-12 text-white/40" />
          )}
        </div>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); toggleFavorite(product.id) }}
          className={`absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center shadow-md ${
            fav ? 'bg-red-500 text-white' : 'bg-white/95 text-[var(--gp-text-muted)]'
          }`}
        >
          <Heart className={`w-4 h-4 ${fav ? 'fill-current' : ''}`} />
        </button>
      </Link>
      <div className="p-3 flex flex-col flex-1 gap-2">
        <Link to={`/shop/product/${product.id}`} className="font-bold text-sm line-clamp-2 leading-snug">
          {product.name}
        </Link>
        <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
          <Star className="w-3.5 h-3.5 fill-current" />
          {product.rating || '4.8'}
        </div>
        <p className="text-lg font-extrabold gp-text-gradient">{formatPrice(product.price)}</p>
        <button
          type="button"
          disabled={!inStock}
          onClick={() => (inStock ? addToCart(product.id) : notify('Нет в наличии', 'info'))}
          className="mt-auto w-full py-3 rounded-2xl gp-btn-primary text-sm font-bold disabled:opacity-50"
        >
          {inStock ? 'Купить' : 'Нет в наличии'}
        </button>
      </div>
    </article>
  )
}
