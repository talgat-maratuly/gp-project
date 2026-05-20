import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { RefreshCw, SlidersHorizontal } from 'lucide-react'
import { CATEGORIES } from '../../data/categories'
import { useService } from '../../context/ServiceContext'
import { DEFAULT_FILTERS, SHOP_BRANDS, SORT_OPTIONS, filterProducts } from '../../utils/filters'
import { Chip, KaspiCard, SkeletonBlock } from '@gp/shared/ui/KaspiUI'
import ProductCard from './ProductCard'

export default function CatalogPage() {
  const { categoryId } = useParams()
  const [params, setParams] = useSearchParams()
  const { products, recommendations, productsLoading, productsError, refreshProducts } = useService()
  const [showFilters, setShowFilters] = useState(false)

  const filters = {
    ...DEFAULT_FILTERS,
    search: params.get('q') || '',
    category: categoryId || params.get('cat') || '',
    brand: params.get('brand') || '',
    sort: params.get('sort') || 'popular',
    inStock: params.get('stock') === '1',
  }

  const setFilter = (key, val) => {
    const next = { ...filters, [key]: val }
    const p = new URLSearchParams()
    if (next.search) p.set('q', next.search)
    if (next.brand) p.set('brand', next.brand)
    if (next.sort !== 'popular') p.set('sort', next.sort)
    if (next.inStock) p.set('stock', '1')
    setParams(p, { replace: true })
  }

  const scoped = categoryId ? products.filter((p) => p.categoryId === categoryId) : products
  const filtered = useMemo(() => filterProducts(scoped, filters), [scoped, filters])
  const cat = CATEGORIES.find((c) => c.id === categoryId)

  return (
    <div className="px-4 py-4 gp-animate-in">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h1 className="text-2xl font-extrabold">{cat?.name || 'GP Shop'}</h1>
        <button
          type="button"
          onClick={() => refreshProducts()}
          className="p-3 rounded-2xl bg-[var(--gp-surface)] border border-[var(--gp-border)] shadow-sm"
        >
          <RefreshCw className={`w-5 h-5 ${productsLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <p className="text-sm text-[var(--gp-text-muted)] mb-4">
        {productsLoading ? 'Загрузка…' : `${filtered.length} товаров`}
      </p>

      <input
        type="search"
        placeholder="Поиск товаров…"
        value={filters.search}
        onChange={(e) => setFilter('search', e.target.value)}
        className="w-full px-4 py-4 rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface)] mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-sm"
      />

      <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide pb-1">
        <Link
          to="/shop"
          className={`shrink-0 px-4 py-2.5 rounded-2xl text-sm font-semibold ${!categoryId ? 'gp-gradient-kaspi text-white shadow-md' : 'bg-[var(--gp-surface)] border border-[var(--gp-border)] text-[var(--gp-text-muted)]'}`}
        >
          Все
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            to={`/shop/catalog/${c.id}`}
            className={`shrink-0 px-4 py-2.5 rounded-2xl text-sm font-semibold ${filters.category === c.id ? 'gp-gradient-kaspi text-white shadow-md' : 'bg-[var(--gp-surface)] border border-[var(--gp-border)] text-[var(--gp-text-muted)]'}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 text-sm font-bold text-emerald-600 mb-3"
      >
        <SlidersHorizontal className="w-4 h-4" /> Фильтры
      </button>

      {showFilters && (
        <KaspiCard className="!p-4 mb-4 space-y-3">
          <p className="text-xs font-bold text-[var(--gp-text-muted)] uppercase">Бренд</p>
          <div className="flex flex-wrap gap-2">
            <Chip active={!filters.brand} onClick={() => setFilter('brand', '')}>Все</Chip>
            {SHOP_BRANDS.map((b) => (
              <Chip key={b} active={filters.brand === b} onClick={() => setFilter('brand', b)}>{b}</Chip>
            ))}
          </div>
          <p className="text-xs font-bold text-[var(--gp-text-muted)] uppercase">Сортировка</p>
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map((s) => (
              <Chip key={s.id} active={filters.sort === s.id} onClick={() => setFilter('sort', s.id)}>{s.label}</Chip>
            ))}
          </div>
          <label className="flex items-center gap-3 cursor-pointer font-semibold text-sm">
            <input type="checkbox" checked={filters.inStock} onChange={(e) => setFilter('inStock', e.target.checked ? '1' : '')} className="w-5 h-5 accent-emerald-600" />
            Только в наличии
          </label>
        </KaspiCard>
      )}

      {productsError && (
        <KaspiCard className="!p-4 mb-4 text-red-600 text-sm">
          {productsError}{' '}
          <button type="button" className="underline font-bold" onClick={() => refreshProducts()}>Повторить</button>
        </KaspiCard>
      )}

      {productsLoading && !products.length ? (
        <div className="grid grid-cols-2 gap-3">
          <SkeletonBlock className="h-56" />
          <SkeletonBlock className="h-56" />
          <SkeletonBlock className="h-56" />
          <SkeletonBlock className="h-56" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 pb-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <KaspiCard className="!p-8 text-center text-[var(--gp-text-muted)]">Ничего не найдено</KaspiCard>
      )}

      {!categoryId && recommendations.length > 0 && filtered.length === products.length && (
        <p className="text-xs text-center text-[var(--gp-text-muted)] pb-6">Рекомендуем популярные товары выше</p>
      )}
    </div>
  )
}
