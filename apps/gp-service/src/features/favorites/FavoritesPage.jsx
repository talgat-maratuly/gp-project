import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useService } from '../../context/ServiceContext'
import { useLanguage } from '../../i18n'
import ProductCard from '../shop/ProductCard'
import Button from '../../components/ui/Button'

export default function FavoritesPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { favoriteProducts } = useService()

  if (!favoriteProducts.length) {
    return (
      <div className="px-4 py-16 text-center">
        <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 mb-4">{t('favoritesEmptyPage')}</p>
        <Button onClick={() => navigate('/shop')}>{t('favoritesGoShop')}</Button>
      </div>
    )
  }

  return (
    <div className="px-4 py-4">
      <h1 className="text-2xl font-bold mb-4">{t('favorites')}</h1>
      <div className="grid grid-cols-2 gap-3">
        {favoriteProducts.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  )
}
