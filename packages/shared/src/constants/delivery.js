/** Доставка GP Shop (клиент → партнёр) */

/** Фиксированная стоимость доставки курьером, ₸ */
export const SHOP_DELIVERY_FEE_KZT = 2000

/** От этой суммы заказа доставка бесплатно (курьер) */
export const SHOP_FREE_DELIVERY_FROM_KZT = 40000

export const SHOP_DELIVERY_MODES = {
  pickup: { id: 'pickup', label: 'Самовывоз у продавца', shortLabel: 'самовывоз', fee: 0 },
  courier: { id: 'courier', label: 'Доставка курьером', shortLabel: 'доставка', fee: SHOP_DELIVERY_FEE_KZT },
}

/**
 * Сколько ₸ добавить к сумме товаров.
 * @param {number} cartTotal — сумма позиций без доставки
 * @param {'pickup'|'courier'} mode
 */
export function computeShopDeliveryFee(cartTotal, mode) {
  const sub = Number(cartTotal) || 0
  if (mode === 'pickup') return 0
  if (sub >= SHOP_FREE_DELIVERY_FROM_KZT) return 0
  return SHOP_DELIVERY_FEE_KZT
}

export function getShopDeliverySummary(cartTotal, mode) {
  const fee = computeShopDeliveryFee(cartTotal, mode)
  const sub = Number(cartTotal) || 0
  const freeByOrderSum = mode === 'courier' && fee === 0 && sub >= SHOP_FREE_DELIVERY_FROM_KZT
  return {
    fee,
    freeByOrderSum,
    hint:
      mode === 'pickup'
        ? 'Самовывоз — без доставки.'
        : freeByOrderSum
          ? `Доставка не взимается — заказ от ${SHOP_FREE_DELIVERY_FROM_KZT.toLocaleString('ru-RU')} ₸`
          : `Курьер +${SHOP_DELIVERY_FEE_KZT.toLocaleString('ru-RU')} ₸. Бесплатно от ${SHOP_FREE_DELIVERY_FROM_KZT.toLocaleString('ru-RU')} ₸`,
  }
}
