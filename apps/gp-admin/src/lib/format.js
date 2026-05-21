export function formatMoney(n) {
  return `${Number(n || 0).toLocaleString('ru-RU')} ₸`
}

export function formatDate(d) {
  if (!d) return '—'
  const iso = String(d).length === 10 ? `${d}T12:00:00` : d
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })
}
