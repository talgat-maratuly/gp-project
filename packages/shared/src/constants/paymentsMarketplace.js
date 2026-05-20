/** Оплата: деньги идут партнёру, GP берёт комиссию с баланса партнёра */
export const PAYMENT_TO_PARTNER = [
  { id: 'kaspi_partner', label: 'Kaspi партнёру', shortLabel: 'Kaspi', online: true, note: 'Оплата напрямую исполнителю через Kaspi. GP не хранит ваши деньги.' },
  { id: 'cash', label: 'Наличные при получении', shortLabel: 'Наличные', online: false, note: 'Оплата исполнителю на месте. Сервисный сбор GP списывается с баланса партнёра.' },
]

export const isPartnerDirectPayment = (id) => ['kaspi_partner', 'kaspi', 'cash'].includes(id)
