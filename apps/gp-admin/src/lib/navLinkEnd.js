/** NavLink `end`: родитель не подсвечивается на дочерних путях. */
const END_EXACT_PATHS = new Set([
  '/',
  '/partners',
  '/market',
  '/market/products',
  '/qr',
  '/specialists/moderation',
  '/services',
])

export function navLinkEnd(path) {
  return END_EXACT_PATHS.has(path)
}
