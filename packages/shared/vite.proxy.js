/** Прокси API для Vite dev-серверов GP Service / GP Partner */
export const GP_API_PROXY = {
  '/auth': { target: 'http://localhost:4000', changeOrigin: true },
  '/products': { target: 'http://localhost:4000', changeOrigin: true },
  '/orders': { target: 'http://localhost:4000', changeOrigin: true },
  '/partners': { target: 'http://localhost:4000', changeOrigin: true },
  '/geo': { target: 'http://localhost:4000', changeOrigin: true },
  '/health': { target: 'http://localhost:4000', changeOrigin: true },
  '/notifications': { target: 'http://localhost:4000', changeOrigin: true },
  '/payments': { target: 'http://localhost:4000', changeOrigin: true },
  '/admin': { target: 'http://localhost:4000', changeOrigin: true },
}
