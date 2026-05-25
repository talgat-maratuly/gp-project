/** Required @gp/shared/api methods and backend route fragments */

export const API_CONTRACT = {
  auth: ['registerClient', 'registerPartner', 'login', 'logout', 'me'],
  orders: ['getOrders', 'createOrder', 'updateOrderStatus', 'confirmOrder'],
  admin: [
    'adminModerationPartners',
    'adminModerationPartner',
    'adminApprovePartner',
    'adminRejectPartner',
    'adminRevisionPartner',
    'adminSuspendPartner',
    'adminRestorePartner',
    'adminAssignOrder',
    'adminUpdateOrderStatus',
    'adminMarketProducts',
    'adminModerateMarketProduct',
    'adminOfferings',
    'adminUpdateOfferingStatus',
    'adminOrders',
    'adminClients',
    'adminPartners',
  ],
  partner: ['getPartnerMe', 'getPartnerApplication', 'partnerApply', 'getRegions'],
  market: ['getMarketProducts'],
}

export const API_METHODS_REQUIRED = Object.values(API_CONTRACT).flat()

export const BACKEND_ROUTE_CHECKS = [
  { method: 'registerClient', http: 'POST', fragment: 'register/client' },
  { method: 'registerPartner', http: 'POST', fragment: 'register/partner' },
  { method: 'login', http: 'POST', fragment: 'login' },
  { method: 'createOrder', http: 'POST', fragment: 'orders' },
  { method: 'adminAssignOrder', http: 'PATCH', fragment: 'orders' },
  { method: 'adminModerationPartners', http: 'GET', fragment: 'moderation/partners' },
  { method: 'getMarketProducts', http: 'GET', fragment: 'market/products' },
]
