import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MARKET_CATEGORIES } from '@gp/shared/constants'
import { useAccess } from '../context/AccessContext'
import { useStore } from '../context/StoreContext'
import { useLanguage } from '../i18n/LanguageContext'
import AdminEmptyState from '../components/ui/AdminEmptyState'
import MarketProductsModerationPanel from '../components/MarketProductsModerationPanel'

export default function MarketProductsPage() {
  const { t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'moderation' ? 'moderation' : 'catalog'
  const { scopedProducts } = useAccess()
  const { updateMarketProduct } = useStore()
  const [cat, setCat] = useState('all')

  const list = cat === 'all' ? scopedProducts : scopedProducts.filter((p) => p.categoryId === cat)

  const setTab = (next) => {
    if (next === 'catalog') setSearchParams({})
    else setSearchParams({ tab: 'moderation' })
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4 p-1 rounded-xl bg-slate-900/80 border border-white/10 w-fit">
        <button
          type="button"
          onClick={() => setTab('catalog')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold min-h-[44px] ${
            tab === 'catalog' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t('market_tab_catalog')}
        </button>
        <button
          type="button"
          onClick={() => setTab('moderation')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold min-h-[44px] ${
            tab === 'moderation' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t('market_tab_moderation')}
        </button>
      </div>

      {tab === 'moderation' ? (
        <MarketProductsModerationPanel />
      ) : (
        <>
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{t('market_products')}</h1>
            <Link
              to="/market/products/new"
              className="admin-btn-primary text-sm px-3"
            >
              + {t('createProduct')}
            </Link>
          </div>
          <select
            className="mb-4 admin-input max-w-xs"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
          >
            <option value="all">{t('all')}</option>
            {MARKET_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{t(c.labelKey)}</option>
            ))}
          </select>
          {!list.length ? (
            <AdminEmptyState />
          ) : (
            <ul className="space-y-2">
              {list.map((p) => (
                <li key={p.id} className="rounded-xl border border-white/10 p-3 flex justify-between gap-2">
                  <div>
                    <p className="font-bold">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      {p.city} · {p.price} ₸ · {t('market_stock')}: {p.quantity}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-amber-400 min-h-[40px] px-2"
                    onClick={() => updateMarketProduct(p.id, { status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                  >
                    {p.status === 'ACTIVE' ? t('market_hide') : t('market_show')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
