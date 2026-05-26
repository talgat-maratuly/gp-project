import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MARKET_CATEGORIES } from '@gp/shared/constants'
import { useAccess } from '../context/AccessContext'
import { useStore } from '../context/StoreContext'
import { useLanguage } from '../i18n/LanguageContext'

export default function MarketProductsPage() {
  const { t } = useLanguage()
  const { scopedProducts } = useAccess()
  const { updateMarketProduct } = useStore()
  const [cat, setCat] = useState('all')

  const list = cat === 'all' ? scopedProducts : scopedProducts.filter((p) => p.categoryId === cat)

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h1 className="text-2xl font-bold">{t('market_products')}</h1>
        <Link to="/market/products/new" className="text-sm font-bold text-sky-400 px-3 py-2 rounded-lg border border-sky-500/30">
          + {t('save')}
        </Link>
      </div>
      <select className="mb-4 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm" value={cat} onChange={(e) => setCat(e.target.value)}>
        <option value="all">{t('all')}</option>
        {MARKET_CATEGORIES.map((c) => (
          <option key={c.id} value={c.id}>{t(c.labelKey)}</option>
        ))}
      </select>
      <ul className="space-y-2">
        {list.map((p) => (
          <li key={p.id} className="rounded-xl border border-white/10 p-3 flex justify-between gap-2">
            <div>
              <p className="font-bold">{p.name}</p>
              <p className="text-xs text-slate-500">{p.city} · {p.price} ₸ · {t('market_stock')}: {p.quantity}</p>
            </div>
            <button type="button" className="text-xs text-amber-400" onClick={() => updateMarketProduct(p.id, { status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}>
              {p.status === 'ACTIVE' ? t('market_hide') : t('market_show')}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
