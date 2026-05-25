export const SERVICES = {
  service: {
    id: 'gp-service',
    workspace: '@gp/service',
    path: 'apps/gp-service',
    port: 5173,
    viteAppName: 'service',
  },
  partner: {
    id: 'gp-partner',
    workspace: '@gp/partner',
    path: 'apps/gp-partner',
    port: 5174,
    viteAppName: 'partner',
  },
  admin: {
    id: 'gp-admin',
    workspace: '@gp/admin',
    path: 'apps/gp-admin',
    port: 5175,
    viteAppName: 'admin',
  },
  api: {
    id: 'gp-api',
    workspace: '@gp/api',
    path: 'apps/api',
    port: 4000,
    prismaSchema: 'apps/api/prisma/schema.prisma',
  },
}

export const ENV_CONTRACT = {
  api: { required: ['DATABASE_URL', 'JWT_SECRET'], optional: ['PORT', 'CORS_ORIGINS'] },
  frontends: {
    required: ['VITE_API_URL'],
    optional: ['VITE_GP_DEMO', 'VITE_GP_TEST_MODE', 'VITE_APP_NAME'],
  },
}

export const DOCKER_IMAGES = ['gp-api', 'gp-service', 'gp-partner', 'gp-admin']
