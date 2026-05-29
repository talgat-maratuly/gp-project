/**
 * GP Ecosystem manifest — единый контракт monorepo.
 * Используется validate-ecosystem, check-env, check-api-contract.
 */

export const SERVICES = {
  service: {
    id: 'gp-service',
    workspace: '@gp/service',
    path: 'apps/gp-service',
    port: 5173,
    viteAppName: 'service',
    envFiles: ['apps/gp-service/.env.development', 'apps/gp-service/.env.example'],
  },
  partner: {
    id: 'gp-partner',
    workspace: '@gp/partner',
    path: 'apps/gp-partner',
    port: 5174,
    viteAppName: 'partner',
    envFiles: ['apps/gp-partner/.env.development', 'apps/gp-partner/.env.example'],
  },
  admin: {
    id: 'gp-admin',
    workspace: '@gp/admin',
    path: 'apps/gp-admin',
    port: 5175,
    viteAppName: 'admin',
    envFiles: ['apps/gp-admin/.env.development'],
  },
  api: {
    id: 'gp-api',
    workspace: '@gp/api',
    path: 'apps/api',
    port: 4000,
    envFiles: ['.env', 'apps/api/.env', '.env.example', 'apps/api/.env.example'],
    prismaSchema: 'apps/api/prisma/schema.prisma',
  },
}

/** Общие модули — менять только вместе с backend + все фронты */
export const SHARED_MODULES = {
  api: '@gp/shared/api',
  apiClient: '@gp/shared/api/apiClient',
  apiErrors: '@gp/shared/api/errors',
  apiMappers: '@gp/shared/api/mappers',
  apiToken: '@gp/shared/api/token',
  constants: '@gp/shared/constants',
  ecosystemStatuses: '@gp/shared/constants/ecosystemStatuses',
  partnerRole: '@gp/shared/constants/partnerRole',
  testMode: '@gp/shared/testMode',
  testAuth: '@gp/shared/utils',
  demo: '@gp/shared/demo',
  i18n: '@gp/shared/i18n',
}

/** Критичные API-методы (должны быть в client.js и на backend) */
export const API_CONTRACT = {
  auth: [
    'registerClient',
    'registerPartner',
    'login',
    'logout',
    'me',
  ],
  orders: [
    'getOrders',
    'createOrder',
    'updateOrderStatus',
    'confirmOrder',
    'cancelOrder',
    'recreateOrder',
    'getOrderEvents',
    'getSpecialistFeed',
    'acceptOrderFromPool',
  ],
  admin: [
    'adminModerationPartners',
    'adminApprovePartner',
    'adminRejectPartner',
    'adminRevisionPartner',
    'adminSuspendPartner',
    'adminAssignOrder',
    'adminUpdateOrderStatus',
    'adminMarketProducts',
    'adminModerateMarketProduct',
    'adminOfferings',
    'adminUpdateOfferingStatus',
  ],
  partner: ['getPartnerMe', 'partnerApply', 'getRegions'],
  market: ['getMarketProducts'],
}

/** Переменные окружения по сервису (ключи, которые должны быть документированы) */
export const ENV_CONTRACT = {
  api: {
    required: ['DATABASE_URL', 'JWT_SECRET'],
    optional: ['PORT', 'NODE_ENV', 'CORS_ORIGINS'],
  },
  frontends: {
    required: ['VITE_API_URL'],
    optional: ['VITE_GP_DEMO', 'VITE_GP_TEST_MODE', 'VITE_APP_NAME', 'VITE_GP_DEMO_HUB'],
  },
  docker: {
    required: ['POSTGRES_PASSWORD', 'JWT_SECRET'],
    optional: ['POSTGRES_USER', 'POSTGRES_DB', 'CORS_ORIGINS', 'VITE_API_URL'],
  },
}

/** Backend route prefixes (Nest global prefix `api` except health) */
export const BACKEND_ROUTES = [
  'POST /api/auth/register/client',
  'POST /api/auth/register/partner',
  'POST /api/auth/login',
  'GET /api/auth/me',
  'GET /api/orders',
  'POST /api/orders',
  'PATCH /api/orders/:id/status',
  'PATCH /api/orders/:id/confirm',
  'PATCH /api/orders/:id/cancel',
  'POST /api/orders/:id/recreate',
  'GET /api/orders/:id/events',
  'GET /api/specialist/orders/feed',
  'PATCH /api/orders/:id/accept',
  'GET /api/admin/moderation/partners',
  'PATCH /api/admin/orders/:id/assign',
  'PATCH /api/admin/orders/:id/status',
  'GET /api/market/products',
  'GET /api/regions',
  'GET /health',
  'GET /health/db',
]

export const NGINX_APPS = ['service', 'partner', 'admin']
