import { useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { formatPrice } from '@gp/shared/utils'
import { useService } from '../../context/ServiceContext'
import Button from '../../components/ui/Button'

export default function CartPage() {
  const navigate = useNavigate()
  const { cartItems, cartTotal, updateCartQty, removeFromCart } = useService()

  if (!cartItems.length) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-slate-500 mb-4">Корзина пуста</p>
        <Button onClick={() => navigate('/shop')}>В магазин</Button>
      </div>
    )
  }

  return (
    <div className="px-4 py-4">
      <h1 className="text-2xl font-bold mb-4">Корзина</h1>
      <ul className="space-y-3 mb-6">
        {cartItems.map(({ product, qty }) => (
          <li key={product.id} className="gp-card p-3 flex gap-3 items-center">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm line-clamp-2">{product.name}</p>
              <p className="text-gp-green-700 font-bold text-sm">{formatPrice(product.price)}</p>
            </div>
            <div className="flex items-center border rounded-lg">
              <button type="button" onClick={() => updateCartQty(product.id, qty - 1)} className="p-2"><Minus className="w-4 h-4" /></button>
              <span className="px-2 text-sm font-medium">{qty}</span>
              <button type="button" onClick={() => updateCartQty(product.id, qty + 1)} className="p-2"><Plus className="w-4 h-4" /></button>
            </div>
            <button type="button" onClick={() => removeFromCart(product.id)} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
          </li>
        ))}
      </ul>
      <div className="gp-card p-4 sticky bottom-20">
        <div className="flex justify-between text-lg font-bold mb-4">
          <span>Итого</span>
          <span className="text-gp-green-700">{formatPrice(cartTotal)}</span>
        </div>
        <Button size="lg" className="w-full" onClick={() => navigate('/shop/checkout')}>Оформить за 3 шага</Button>
      </div>
    </div>
  )
}
