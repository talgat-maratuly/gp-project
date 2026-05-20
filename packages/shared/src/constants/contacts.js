export const GP_CONTACTS = {
  phone: '+7 701 223 62 62',
  phoneHref: 'tel:+77012236262',
  email: 'shop@gp-service.kz',
  emailHref: 'mailto:shop@gp-service.kz',
  address: 'Казахстан, Уральск',
  addressLine: 'ул. Мухит 112',
  country: 'KZ',
  currency: 'KZT',
  currencySymbol: '₸',
}

const PARTNER_DEV_PORT = 5174
const SERVICE_DEV_PORT = 5173

/** URL веб-приложения GP Partner (dev: порт 5174 на том же хосте) */
export function getPartnerWebUrl() {
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:${PARTNER_DEV_PORT}`
    }
  }
  return 'https://partner.gp-service.kz'
}

export function getServiceWebUrl() {
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:${SERVICE_DEV_PORT}`
    }
  }
  return 'https://gp-service.kz'
}

export const PARTNER_APP = {
  name: 'GP Partner',
  tagline: 'Приложение для исполнителей и партнёров',
  get webUrl() {
    return getPartnerWebUrl()
  },
  storeIos: 'https://apps.apple.com/app/gp-partner',
  storeAndroid: 'https://play.google.com/store/apps/details?id=kz.gpservice.partner',
}
