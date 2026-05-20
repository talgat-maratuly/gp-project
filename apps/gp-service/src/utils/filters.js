import { SHOP_BRANDS } from '@gp/shared/constants'

export const SORT_OPTIONS = [
  { value: 'popular', label: 'Популярные' },
  { value: 'price-asc', label: 'Цена ↑' },
  { value: 'price-desc', label: 'Цена ↓' },
  { value: 'rating', label: 'Рейтинг' },
]

export const DEFAULT_FILTERS = {
  search: '', category: '', brand: '', minPrice: '', maxPrice: '', inStock: false, sort: 'popular',
}

export function filterProducts(products, filters) {
  let r = [...products]
  if (filters.search) {
    const q = filters.search.toLowerCase()
    r = r.filter((p) =>
      p.name?.toLowerCase().includes(q)
      || (p.brand || '').toLowerCase().includes(q)
      || (p.description || '').toLowerCase().includes(q),
    )
  }
  if (filters.category) r = r.filter((p) => p.categoryId === filters.category)
  if (filters.brand) r = r.filter((p) => p.brand === filters.brand)
  if (filters.minPrice) r = r.filter((p) => p.price >= Number(filters.minPrice))
  if (filters.maxPrice) r = r.filter((p) => p.price <= Number(filters.maxPrice))
  if (filters.inStock) r = r.filter((p) => p.inStock)
  switch (filters.sort) {
    case 'price-asc': r.sort((a, b) => a.price - b.price); break
    case 'price-desc': r.sort((a, b) => b.price - a.price); break
    case 'rating': r.sort((a, b) => b.rating - a.rating); break
    default: r.sort((a, b) => b.popularity - a.popularity)
  }
  return r
}

export { SHOP_BRANDS }
