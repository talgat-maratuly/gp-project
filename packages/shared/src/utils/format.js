const kztFormatter = new Intl.NumberFormat('ru-KZ', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export const formatPrice = (price) => `${kztFormatter.format(price)} ₸`

export const formatDate = (iso) =>
  new Intl.DateTimeFormat('ru-KZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))

export const formatUnitSuffix = (unit) => {
  if (!unit || unit === 'шт') return null
  return `за ${unit}`
}
