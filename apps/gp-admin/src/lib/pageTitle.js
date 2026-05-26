import { PAGE_TITLE_KEYS } from './permissions.js'

/** Заголовок страницы по pathname (включая вложенные маршруты). */
export function resolvePageTitleKey(pathname) {
  if (PAGE_TITLE_KEYS[pathname]) return PAGE_TITLE_KEYS[pathname]
  if (pathname.startsWith('/market/products/new')) return 'market_product_create'
  if (pathname.startsWith('/market/products')) return 'market_products'
  if (pathname.startsWith('/qr/')) return 'qr_service'
  if (pathname.startsWith('/services/hunter')) return 'admin_hunter'
  if (pathname.startsWith('/services/furniture')) return 'admin_furniture'
  if (pathname.startsWith('/specialists/')) return 'specialist_moderation'
  if (pathname.startsWith('/partners/')) return 'partner_moderation'
  return null
}
